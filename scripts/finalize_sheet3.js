const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

// --- Config ---
const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트3';
const CREDENTIALS_PATH = 'credentials.json';
const FACILITIES_PATH = 'data/facilities.json';

// --- Price Rules ---
const EXCLUDED_KEYWORDS = [
    '관리비', '연관리비', '유지비', '옵션', '추가', '선택',
    '석물', '비석', '상석', '시공', '설치', '운반', '인도', '수수료',
    '연장', '갱신', '납골함', '유골함', '기본 1평', '1평 기본',
    '이론상', '참고', '식대', '안치비'
];

const MIN_VALID_PRICE = 100000;

function cleanPrice(p) {
    if (!p) return 0;
    let str = String(p).replace(/[^0-9]/g, '');
    let val = parseInt(str, 10);

    if (isNaN(val)) return 0;
    if (val < MIN_VALID_PRICE) return 0;
    if (val > 5000000000) return 0;

    return val;
}

function parseArea(text) {
    const match = text.match(/([0-9.]+)\s*평/);
    if (match) return parseFloat(match[1]);
    return null;
}

function classifyCategory(text) {
    text = text.toLowerCase();
    if (['수목', '자연장', '잔디', '평장'].some(k => text.includes(k))) return 'NATURAL';
    if (['봉안', '납골'].some(k => text.includes(k)) && !text.includes('매장')) return 'CHARNEL';
    if (['매장', '묘지', '단장', '합장', '공원묘지'].some(k => text.includes(k))) return 'BURIAL';
    return 'UNKNOWN';
}

function formatKRW(val) {
    if (!val) return "";
    return (val / 10000).toLocaleString() + "만원";
}

async function main() {
    console.log("🚀 Starting Final Clean Merge (Sheet 3 Output)...");

    // 1. Load Master List
    const facilities = JSON.parse(fs.readFileSync(path.join(process.cwd(), FACILITIES_PATH), 'utf8'));
    console.log(`📚 Loaded ${facilities.length} Master Facilities.`);

    // 2. Load Pricing Data (Sheet 1 + Sheet 6)
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    // Sheet 1: Use CellsInRange to handle duplicate headers and explicit indices
    const sheet1 = doc.sheetsByTitle['data_on'];
    // Assuming max rows around 9300, fetching generous range A2:N10000 (A-N covers index 0-13)
    // User Layout: 
    // 0:id, 1:시설명, 2:parkId, 3:운영(Fact), 4:종교(Fact), 5:필터(Tags), 
    // 6:img분석, 7:운영(Old), 8:개인단/부부단, 9:관내/관외, 10:제목, 11:설명, 12:가격
    await sheet1.loadCells('A2:M9500');
    const totalRows1 = sheet1.rowCount;
    console.log(`📥 Loaded Sheet 1 Cells (Approximating ${totalRows1} rows)`);

    const rows6 = await doc.sheetsByTitle['시트6'].getRows();
    console.log(`📥 Loaded Sheet 6: ${rows6.length} rows`);

    // 3. Index Pricing Data & Collect Metadata
    const norm = (n) => n ? n.replace(/\s+/g, '').replace(/\(.*\)/g, '').trim() : "";

    const pricingMap1 = {};
    const pricingMap6 = {};
    const metaMap = {};

    // Helper to add multiple tags
    const addTags = (key, tagStr) => {
        if (!tagStr) return;
        if (!metaMap[key]) metaMap[key] = new Set();
        tagStr.split(/,|\s+/).forEach(t => {
            const clean = t.trim();
            if (clean && clean !== '-' && clean !== '무관' && clean.length > 1) {
                metaMap[key].add(clean);
            }
        });
    };

    // Helper to set specific metadata fields if valid
    const setMeta = (key, type, val) => {
        if (!val) return;
        if (!metaMap[key]) metaMap[key] = new Set();
        // Prefix keys to distinguish types if needed, but for now just adding to set
        // Actually, we need to distinguish specifically for 'Reli' and 'Oper' columns
        // Let's store them in a separate object property if we want strict column mapping
        // But the previous architecture used a unified 'Set' then split by keywords.
        // User wants "Fact" columns. Let's prioritize these terms.

        // Strategy: Add these explicit values to the Set. 
        // The split logic (Step 4) will find them again.
        // e.g. "기독교" in '종교' column -> Added to Set -> Detected as Religion later.
        metaMap[key].add(val.trim());
    };

    // Iterate Sheet 1 Rows (Indices 0 to rowCount-1, raw 2D access is hard with loadCells? 
    // loadCells loads data into cache. We iterate row indices.)
    // A2 is row index 1.
    for (let r = 1; r < 9500; r++) { // Safety cap
        const getVal = (c) => {
            try { return sheet1.getCell(r, c).value; } catch (e) { return null; }
        };

        const parkName = getVal(1); // 시설명
        const title = getVal(10); // 제목

        // If neither exists, skip (empty row)
        if (!parkName && !title) continue;

        const effectiveName = parkName || title; // Use parkName for matching usually
        const key = norm(effectiveName);

        if (!pricingMap1[key]) pricingMap1[key] = [];

        const priceRaw = getVal(12); // 가격
        const priceVal = cleanPrice(priceRaw);

        // Push Price Item
        if (priceVal > 0) {
            pricingMap1[key].push({
                name: title || "",
                price: priceVal,
                rawText: getVal(11) || "", // 설명
                catStr: (getVal(5) || "") + " " + effectiveName
            });
        }

        // Collect Metadata from FACT columns
        addTags(key, getVal(5)); // 필터 (Tags)
        setMeta(key, 'Oper', getVal(3)); // 운영 (Fact)
        setMeta(key, 'Reli', getVal(4)); // 종교 (Fact)
    }

    for (const r of rows6) {
        const name = r.get('시설명');
        if (!name) continue;
        const key = norm(name);
        if (!pricingMap6[key]) pricingMap6[key] = [];

        // Push Price Item
        const pStr = r.get('요금');
        const pVal = cleanPrice(pStr);

        pricingMap6[key].push({
            name: `${r.get('항목')} ${r.get('내역')}`,
            price: pVal,
            rawText: r.get('내역') || "",
            catStr: (r.get('유형') || "") + " " + (r.get('시설명') || "")
        });

        // Collect Tags (Type, Religion, Operation)
        addTags(key, r.get('유형'));
        addTags(key, r.get('종교'));
        addTags(key, r.get('운영'));
    }

    const cleanTitle = (name) => {
        if (!name) return "";
        let clean = name;
        // Remove Legal Entity Prefixes (Start of string)
        clean = clean.replace(/^\s*\((재|사|복|주|유)\)\s*/, '');
        clean = clean.replace(/^\s*(재|사|복|주|유)\./, '');

        // Remove Specific Suffixes
        clean = clean.replace(/\s*\((만장|묘지|자연장|공원)\)$/, '');

        // Remove "Corporation" suffix if purely (주) at end
        clean = clean.replace(/\s*\((주|유)\)$/, '');

        return clean.trim();
    };

    // 4. Process Each Facility
    const finalRows = [];

    for (const f of facilities) {
        const key = norm(f.name);
        const isPublic = (f.operatorType === 'PUBLIC') || f.name.includes('공설') || f.name.includes('시립');
        const baseArea = isPublic ? 1.5 : 3.0;

        let items = pricingMap1[key];
        let sourceUsed = 'Sheet1';

        // Fallback to Sheet 6
        if (!items || items.length === 0) {
            items = pricingMap6[key];
            sourceUsed = 'Sheet6';
        }

        if (!items) items = [];

        // Valid & Categorize
        const validItems = items.filter(i => {
            if (i.price === 0) return false;
            const fullText = (i.name + i.rawText).toLowerCase();
            return !EXCLUDED_KEYWORDS.some(k => fullText.includes(k));
        });

        const groups = { BURIAL: [], CHARNEL: [], NATURAL: [] };
        validItems.forEach(i => {
            const cat = classifyCategory(i.catStr + " " + i.name);
            if (groups[cat]) groups[cat].push(i);
        });

        // Tag Splitting
        const typeSet = new Set();
        const reliSet = new Set();
        const operSet = new Set();

        // 1. Gather all raw tokens
        const rawTokens = [
            ...(metaMap[key] ? Array.from(metaMap[key]) : []),
            ...(sourceUsed === 'Sheet6' ? ['Verified'] : [])
        ];

        // Add collected category groups
        if (groups.BURIAL.length > 0) rawTokens.push('매장묘');
        if (groups.CHARNEL.length > 0) rawTokens.push('봉안당');
        if (groups.NATURAL.length > 0) rawTokens.push('수목장');

        // 2. Map to Standard Columns
        const fullString = rawTokens.join(' ').toLowerCase();

        // Type
        if (fullString.includes('매장') || fullString.includes('묘지')) typeSet.add('매장묘');
        if (fullString.includes('봉안') || fullString.includes('납골')) typeSet.add('봉안당');
        if (fullString.includes('수목') || fullString.includes('자연') || fullString.includes('잔디') || fullString.includes('평장')) typeSet.add('수목장');

        // Religion
        if (fullString.includes('기독')) reliSet.add('기독교');
        if (fullString.includes('불교')) reliSet.add('불교');
        if (fullString.includes('천주') || fullString.includes('성당')) reliSet.add('천주교');
        // If empty, user can assume '무관' manually, or we leave blank.

        // Operator
        if (fullString.includes('재단')) operSet.add('재단법인');
        if (fullString.includes('사단')) operSet.add('사단법인');
        if (fullString.includes('공설') || fullString.includes('시립') || fullString.includes('군립')) operSet.add('공설');
        if (fullString.includes('사설')) operSet.add('사설');

        // Special (Add to Note if needed, currently skipping '관내' tag for columns)

        // Logic & Additional Tags
        let burialStr = "-", charnelStr = "-", naturalStr = "-";

        // Burial
        if (groups.BURIAL.length > 0) {
            const sorted = groups.BURIAL.sort((a, b) => a.price - b.price);
            let chosen = sorted.find(i => parseArea(i.name + i.rawText) === baseArea) || sorted[0];

            if (chosen) {
                const area = parseArea(chosen.name + chosen.rawText) || baseArea;
                const pyeongP = Math.round(chosen.price / area);
                burialStr = `${formatKRW(chosen.price)}부터\n(약 ${formatKRW(pyeongP)}/평)`;
            }
        }

        // Charnel
        if (groups.CHARNEL.length > 0) {
            const minP = Math.min(...groups.CHARNEL.map(i => i.price));
            charnelStr = `${formatKRW(minP)}부터`;
        }

        // Natural
        if (groups.NATURAL.length > 0) {
            const minP = Math.min(...groups.NATURAL.map(i => i.price));
            naturalStr = `${formatKRW(minP)}부터`;
        }

        finalRows.push({
            id: f.id,
            title: f.name,
            address: f.address,
            phone: f.phone || "",
            type: Array.from(typeSet).join(', '),
            religion: Array.from(reliSet).join(', '),
            operator: Array.from(operSet).join(', '),
            price_burial: burialStr,
            price_charnel: charnelStr,
            price_natural: naturalStr,
            note: "",
            image_url: f.images && f.images.length > 0 ? f.images[0] : ""
        });
    }

    // 5. Upload to Sheet 3
    let sheet3 = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (sheet3) {
        console.log(`🗑️ Deleting old ${TARGET_SHEET_TITLE}...`);
        await sheet3.delete();
    }

    console.log(`✨ Creating ${TARGET_SHEET_TITLE}...`);
    sheet3 = await doc.addSheet({
        title: TARGET_SHEET_TITLE,
        headerValues: [
            'id', 'title', 'address', 'phone',
            'type', 'religion', 'operator',
            'price_burial', 'price_charnel', 'price_natural',
            'note', 'image_url'
        ]
    });

    // Resize columns for readability
    // (Note: library support for resizing is limited, skipping visual formatting for now)

    console.log(`💾 Saving ${finalRows.length} rows...`);
    const BATCH = 500;
    for (let i = 0; i < finalRows.length; i += BATCH) {
        await sheet3.addRows(finalRows.slice(i, i + BATCH));
        process.stdout.write('.');
    }
    console.log("\n🎉 Final Merge Complete!");
}

main().catch(console.error);
