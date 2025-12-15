const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_PATH = path.join(__dirname, '../data/pricing_all.csv');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const TARGET_ID = 'park-0001'; // Target Facility ID in CSV

async function injectPricing() {
    console.log(`🚀 Starting pricing injection for ${TARGET_ID}...`);

    // 1. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV File not found: ${CSV_PATH}`);
        process.exit(1);
    }
    let csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
    }
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true // 공백 제거 옵션 추가
    });

    console.log('First Record:', records[0]); // Debugging

    // 2. Filter and Group Data for Target ID
    const targetRecords = records.filter(r => r.FacilityID === TARGET_ID);
    console.log(`📊 Found ${targetRecords.length} pricing records for ${TARGET_ID}`);

    if (targetRecords.length === 0) {
        console.error('❌ No records found for this ID.');
        process.exit(1);
    }

    const priceTable = {};

    targetRecords.forEach(record => {
        const category = record.Category || '기타';
        const name = record.ItemName;
        const price = parseInt(record.Price?.replace(/,/g, '') || '0', 10);
        const description = record.RawText;

        if (!priceTable[category]) {
            priceTable[category] = { rows: [] };
        }

        priceTable[category].rows.push({
            name,
            price,
            description
        });
    });

    console.log('✅ Price Table Constructed:', Object.keys(priceTable));

    // 3. Update facilities.json
    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ JSON File not found: ${JSON_PATH}`);
        process.exit(1);
    }
    const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

    // Find target facility (Matching by ID or trying to match Name if ID fails)
    let facilityIndex = jsonData.findIndex(f => f.id === TARGET_ID);

    // 만약 park-0001 ID가 없다면, 이름으로 찾아본다. ((재)낙원추모공원)
    if (facilityIndex === -1) {
        console.log('⚠️ ID match failed. Trying name match...');
        const targetName = targetRecords[0].ParkName;
        facilityIndex = jsonData.findIndex(f => f.name.replace(/\s+/g, '') === targetName.replace(/\s+/g, ''));
    }

    if (facilityIndex === -1) {
        console.error(`❌ Facility not found in JSON: ${TARGET_ID} or name match.`);
        // 혹시 모르니 전체 리스트에서 park-0001이 진짜 없는지 확인
        // console.log('Sample IDs:', jsonData.slice(0, 5).map(f => f.id));
        process.exit(1);
    }

    const facility = jsonData[facilityIndex];
    console.log(`✅ Updating Facility: ${facility.name} (${facility.id})`);

    // Backup original just in case
    // const backupPath = JSON_PATH + '.bak_pricing';
    // fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));

    // Update
    jsonData[facilityIndex] = {
        ...facility,
        priceInfo: {
            ...facility.priceInfo,
            priceTable: priceTable
        },
        _hasDetailedPrices: true // Mark asking for detail
    };

    // Save
    fs.writeFileSync(JSON_PATH, JSON.stringify(jsonData, null, 2));
    console.log(`🎉 Successfully injected pricing for ${facility.name}!`);
}

injectPricing();
