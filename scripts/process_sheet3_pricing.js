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
    '이론상', '참고'
];

// Minimum reasonable price for a facility spot (100,000 KRW)
// Excludes management fees (10k~50k), cheap urns, etc.
const MIN_VALID_PRICE = 100000;

function cleanPrice(p) {
    if (!p) return 0;
    let str = String(p).replace(/[^0-9]/g, '');
    let val = parseInt(str, 10);

    // Filter noise
    if (isNaN(val)) return 0;
    if (val < MIN_VALID_PRICE) return 0; // Too cheap (likely management fee)
    if (val > 5000000000) return 0; // Too expensive (parsing error)

    return val;
}

function parseArea(text) {
    // Try to extract "3평" or "1.5평"
    const match = text.match(/([0-9.]+)\s*평/);
    if (match) return parseFloat(match[1]);
    return null;
}

function classifyCategory(item) {
    // Combines text fields to search keywords
    const text = ((item.name || "") + " " + (item.rawText || "") + " " + (item.category0 || "")).toLowerCase();

    // 1. 수목장 (Highest Priority for distinct types)
    if (['수목', '자연장', '잔디', '평장'].some(k => text.includes(k))) return 'NATURAL';
    // 2. 봉안
    if (['봉안', '납골'].some(k => text.includes(k)) && !text.includes('매장')) return 'CHARNEL';
    // 3. 매장
    if (['매장', '묘지', '단장', '합장', '공원묘지'].some(k => text.includes(k))) return 'BURIAL';

    return 'UNKNOWN';
}

function calculateBurialPrice(items, isPublic) {
    // Filter Valid Items
    const validItems = items.filter(i => {
        const t = (i.name + i.rawText).toLowerCase();
        // Exclude Keywords
        if (EXCLUDED_KEYWORDS.some(k => t.includes(k))) return false;
        // Exclude "1평" if explicit
        if (t.includes('1평')) return false;
        return true;
    });

    if (validItems.length === 0) return null;

    const baseArea = isPublic ? 1.5 : 3.0;

    // A. Exact Match baseArea
    const exact = validItems.filter(i => parseArea(i.name + i.rawText) === baseArea);
    if (exact.length > 0) {
        // Return lowest price among exact matches
        const minP = Math.min(...exact.map(i => i.price));
        return { price: minP, area: baseArea };
    }

    // B. Larger than baseArea (Lowest price)
    const larger = validItems.filter(i => {
        const a = parseArea(i.name + i.rawText);
        return a && a > baseArea;
    });
    if (larger.length > 0) {
        const sorted = larger.sort((a, b) => a.price - b.price);
        return { price: sorted[0].price, area: parseArea(sorted[0].name + sorted[0].rawText) || baseArea };
    }

    // C. Smaller (Representative) - Only if no larger provided? 
    // Logic: "Use representative" -> Lowest valid if nothing else matches
    const sorted = validItems.sort((a, b) => a.price - b.price);
    const best = sorted[0];
    const area = parseArea(best.name + best.rawText) || baseArea;
    return { price: best.price, area: area };
}

function calculateBasicPrice(items) {
    // For Charnel/Natural: Lowest valid price
    const validItems = items.filter(i => {
        const t = (i.name + i.rawText).toLowerCase();
        if (EXCLUDED_KEYWORDS.some(k => t.includes(k))) return false;
        return true;
    });

    if (validItems.length === 0) return null;
    return Math.min(...validItems.map(i => i.price));
}

// Format Helper
function formatKRW(val) {
    if (!val) return "";
    return (val / 10000).toLocaleString() + "만원";
}

async function main() {
    console.log("🚀 Starting Sheet 3 Price Processing (Sheet 1 Source)...");

    // 1. Load Facilities (Master)
    const facilities = JSON.parse(fs.readFileSync(path.join(process.cwd(), FACILITIES_PATH), 'utf8'));
    const facilityMap = new Map();
    facilities.forEach(f => facilityMap.set(f.id, f));

    // 2. Load Sheet 1 (Pricing Data)
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    const sheet1 = doc.sheetsByTitle['시트1'];
    const rows1 = await sheet1.getRows();
    console.log(`📚 Loaded ${rows1.length} pricing rows from Sheet 1.`);

    // 3. Group Prices by Facility Name (Normalized)
    const priceGroups = {}; // ParkName -> Items[]

    // Name normalization helper
    const norm = (n) => n.replace(/\s+/g, '').replace(/\(.*\)/g, '').trim();

    for (const r of rows1) {
        // Sheet 1 rows don't have UUID? 
        // Wait, 'diagnose_sheet1' output showed `parkName`. `pricing_db.json` has `id` but it's `park-xxxx`?
        // Let's check matching strategy.
        // facilities.json has `id` (UUID) and `name`.
        // Sheet 1 has `parkName`. We must match by NAME.
        const name = r.get('parkName') || r.get('제목');
        if (!name) continue;

        const key = norm(name);
        if (!priceGroups[key]) priceGroups[key] = [];

        priceGroups[key].push({
            name: r.get('제목') || "",
            price: cleanPrice(r.get('price')),
            rawText: r.get('rawText') || "",
            category0: r.get('category0') || "",
            category1: r.get('category1') || ""
        });
    }

    // 4. Process Each Facility
    const finalRows = [];

    for (const f of facilities) {
        const key = norm(f.name);
        const pricingItems = priceGroups[key] || []; // Get items for this facility

        // Group items by category
        const groups = { BURIAL: [], CHARNEL: [], NATURAL: [] };

        pricingItems.forEach(item => {
            const cat = classifyCategory(item);
            if (groups[cat]) groups[cat].push(item);
        });

        // Determine Operator Type (Public/Private)
        const isPublic = (f.operatorType === 'PUBLIC') || f.name.includes('공설') || f.name.includes('시립') || f.name.includes('군립');

        // Calculate Prices
        let burialStr = "-", charnelStr = "-", naturalStr = "-";
        const tags = [];

        // Burial
        if (groups.BURIAL.length > 0) {
            tags.push('매장묘');
            const res = calculateBurialPrice(groups.BURIAL, isPublic);
            if (res && res.price > 0) {
                const pyeongPrice = Math.round(res.price / res.area);
                burialStr = `${formatKRW(res.price)}부터\n(약 ${formatKRW(pyeongPrice)}/평)`;
            }
        }

        // Charnel
        if (groups.CHARNEL.length > 0) {
            tags.push('봉안당');
            const p = calculateBasicPrice(groups.CHARNEL);
            if (p && p > 0) charnelStr = `${formatKRW(p)}부터`;
        }

        // Natural
        if (groups.NATURAL.length > 0) {
            tags.push('수목장');
            const p = calculateBasicPrice(groups.NATURAL);
            if (p && p > 0) naturalStr = `${formatKRW(p)}부터`;
        }

        finalRows.push({
            id: f.id,
            parkName: f.name,
            address: f.address,
            phone: f.phone || "",
            tags: tags.join(', '),
            price_burial: burialStr,
            price_charnel: charnelStr,
            price_natural: naturalStr,
            image_url: f.images && f.images.length > 0 ? f.images[0] : ""
        });
    }

    // 5. Upload to Sheet 3
    let sheet3 = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (sheet3) {
        console.log(`🗑️ Deleting existing ${TARGET_SHEET_TITLE}...`);
        await sheet3.delete();
    }
    console.log(`✨ Creating new ${TARGET_SHEET_TITLE}...`);

    sheet3 = await doc.addSheet({
        title: TARGET_SHEET_TITLE,
        headerValues: [
            'id', 'parkName', 'address', 'phone',
            'tags', 'price_burial', 'price_charnel', 'price_natural', 'image_url'
        ]
    });

    console.log(`💾 Saving ${finalRows.length} rows...`);
    const BATCH = 500;
    for (let i = 0; i < finalRows.length; i += BATCH) {
        await sheet3.addRows(finalRows.slice(i, i + BATCH));
        process.stdout.write('.');
    }
    console.log("\n🎉 Done!");
}

main().catch(console.error);
