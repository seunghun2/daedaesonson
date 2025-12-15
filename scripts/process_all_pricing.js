const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const DATA_DIR = path.join(__dirname, '../data');
const FILES = [
    'pricing_cemetery.csv',
    'pricing_cremation.csv',
    'pricing_enshrinement.csv',
    'pricing_natural.csv'
];

function getNum(idStr) {
    if (!idStr) return 999999;
    const match = idStr.match(/park-(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
}

function processFile(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        return { name: filename, status: 'NOT_FOUND' };
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    const records = parsed.data;

    // 1. 정렬
    records.sort((a, b) => {
        return getNum(a.ParkID) - getNum(b.ParkID);
    });

    // 2. 저장
    const csvOutput = Papa.unparse(records, {
        header: true,
        newline: '\n',
        quotes: false,
    });
    fs.writeFileSync(filePath, csvOutput);

    // 3. 결번 파악
    const uniqueIds = new Set(records.map(r => getNum(r.ParkID)).filter(n => n !== 999999));
    const sortedIds = Array.from(uniqueIds).sort((a, b) => a - b);

    if (sortedIds.length === 0) {
        return { name: filename, status: 'EMPTY' };
    }

    const minId = sortedIds[0];
    const maxId = sortedIds[sortedIds.length - 1];
    const totalUnique = sortedIds.length;

    // 결번 계산 (1번부터 마지막 번호까지)
    let missingCount = 0;
    // const missingIds = [];
    for (let i = 1; i <= maxId; i++) {
        if (!uniqueIds.has(i)) {
            missingCount++;
            // missingIds.push(i);
        }
    }

    return {
        name: filename,
        status: 'OK',
        minId: `park-${String(minId).padStart(4, '0')}`,
        maxId: `park-${String(maxId).padStart(4, '0')}`,
        totalUnique,
        missingCount
    };
}

function run() {
    console.log('🔄 Processing 4 Pricing Files...\n');
    console.log('| File Name | Range | Unique Count | Missing Count (Gaps) |');
    console.log('|---|---|---|---|');

    const results = FILES.map(processFile);

    results.forEach(r => {
        if (r.status === 'OK') {
            console.log(`| ${r.name} | ${r.minId} ~ ${r.maxId} | ${r.totalUnique} | **${r.missingCount}** |`);
        } else {
            console.log(`| ${r.name} | ERROR (${r.status}) | - | - |`);
        }
    });

    console.log('\n✅ All files sorted and updated.');
}

run();
