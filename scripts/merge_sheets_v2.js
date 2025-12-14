const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

const TARGET_SHEET_TITLE = '시트3';
const SOURCE_SHEET_1 = '시트1';
const SOURCE_SHEET_6 = '시트6';

// Helper to normalize facility names for matching
function normalizeName(name) {
    if (!name) return "";
    return name.replace(/\(.*\)/g, '') // Remove (Info)
        .replace(/재단법인/g, '')
        .replace(/\(재\)/g, '')
        .replace(/공원묘원/g, '')
        .replace(/공원묘지/g, '')
        .replace(/추모공원/g, '')
        .replace(/\s+/g, '') // Remove spaces
        .trim();
}

async function main() {
    console.log("🚀 Starting Merge: Sheet 1 + Sheet 6 -> Sheet 3");

    // 1. Auth & Load Info
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    const sheet1 = doc.sheetsByTitle[SOURCE_SHEET_1];
    const sheet6 = doc.sheetsByTitle[SOURCE_SHEET_6];

    if (!sheet1 || !sheet6) {
        console.error("❌ Source sheets not found!");
        return;
    }

    console.log("📥 Loading data...");
    const rows1 = await sheet1.getRows();
    const rows6 = await sheet6.getRows();
    console.log(`   Sheet 1 (Base): ${rows1.length} rows`);
    console.log(`   Sheet 6 (Ref):  ${rows6.length} rows`);

    // 1.1 Load facilities.json for Address/Phone
    const facilitiesPath = path.join(process.cwd(), 'data', 'facilities.json');
    const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
    const facilityMap = new Map(); // ID -> Item
    facilitiesData.forEach(f => facilityMap.set(f.id, f));
    console.log(`📚 Loaded ${facilitiesData.length} facilities from JSON.`);

    // 2. Aggregate Sheet 6 Data (it has multiple rows per facility)
    console.log("🧩 Aggregating Sheet 6 data...");
    const refData = {}; // Key: Normalized Name

    for (const r of rows6) {
        const name = r.get('시설명');
        const normName = normalizeName(name);

        if (!refData[normName]) {
            refData[normName] = {
                name: name,
                image: r.get('이미지 URL') || "",
                tags: new Set(),
                prices: []
            };
        }

        // Collect Tags
        ['유형', '종교', '운영'].forEach(k => {
            const val = r.get(k);
            if (val && val !== '-' && val !== '무관') refData[normName].tags.add(val);
        });

        // Collect Prices
        const pCat = r.get('항목');
        const pDet = r.get('내역');
        const pPrice = r.get('요금');
        if (pPrice && pPrice !== '-') {
            refData[normName].prices.push(`${pCat} (${pDet}): ${pPrice}`);
        }
    }

    // 3. Prepare Sheet 3
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
            'tags', 'price_min', 'price_details', 'image_url',
            'is_reference_match'
        ]
    });

    // 4. Merge & Create Rows
    console.log("🔄 Merging data...");
    const mergedRows = [];
    let matchCount = 0;

    for (const r1 of rows1) {
        const id = r1.get('id');
        const name1 = r1.get('parkName') || r1.get('제목');
        const norm1 = normalizeName(name1);

        // Lookup Facility Info
        const facilityInfo = facilityMap.get(id);
        const address = facilityInfo ? (facilityInfo.address || "") : "";
        const phone = facilityInfo ? (facilityInfo.phone || "") : "";

        const match = refData[norm1];

        let tags = "";
        let priceDetails = "";
        let imageUrl = "";
        let isMatch = "X";

        if (match) {
            matchCount++;
            isMatch = "O";
            tags = Array.from(match.tags).join(', ');
            priceDetails = match.prices.join('\n');
            imageUrl = match.image; // Use one image for now
        }

        // Price Min Logic
        let priceMin = r1.get('price');
        if (!priceMin || priceMin === '0') {
            // Fallback?
        }

        mergedRows.push({
            id: id,
            parkName: name1,
            address: address,
            phone: phone,
            tags: tags,
            price_min: priceMin,
            price_details: priceDetails,
            image_url: imageUrl,
            is_reference_match: isMatch
        });
    }

    // 5. Upload to Sheet 3
    console.log(`💾 Saving ${mergedRows.length} rows to ${TARGET_SHEET_TITLE}...`);
    console.log(`   (Matched: ${matchCount} / ${rows1.length} = ${((matchCount / rows1.length) * 100).toFixed(1)}%)`);

    // Batch upload
    const BATCH_SIZE = 500;
    for (let i = 0; i < mergedRows.length; i += BATCH_SIZE) {
        const chunk = mergedRows.slice(i, i + BATCH_SIZE);
        await sheet3.addRows(chunk);
        process.stdout.write('.');
    }
    console.log("\n🎉 Merge Complete!");
}

main().catch(console.error);
