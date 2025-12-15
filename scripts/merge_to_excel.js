const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');

const DATA_DIR = path.join(__dirname, '../data');
const CSV_FILES = [
    'pricing_cemetery.csv',
    'pricing_cremation.csv',
    'pricing_enshrinement.csv',
    'pricing_natural.csv'
];
const OUTPUT_FILE = path.join(DATA_DIR, 'pricing_data_v1.xlsx');

function getNum(idStr) {
    if (!idStr) return 999999;
    const match = idStr.match(/park-(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
}

function run() {
    console.log('🔄 Merging 4 CSVs into Excel...');

    let allRows = [];

    // 1. Read CSVs
    CSV_FILES.forEach(filename => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });

            // 파일 소스 정보는 필요시 추가 (현재는 스키마가 같으므로 그대로 병합)
            allRows = allRows.concat(parsed.data);
            console.log(`- Loaded ${parsed.data.length} rows from ${filename}`);
        } else {
            console.warn(`⚠️ Warning: ${filename} not found.`);
        }
    });

    // 2. Sort by ParkID
    console.log(`\nSorting total ${allRows.length} rows...`);
    allRows.sort((a, b) => {
        return getNum(a.ParkID) - getNum(b.ParkID);
    });

    // 3. Create Excel
    // 컬럼 순서 고정 (ParkID, ParkName, Category, ItemName, Price, RawText, ...)
    const ws = XLSX.utils.json_to_sheet(allRows, {
        header: ["ParkID", "ParkName", "Category", "ItemName", "Price", "RawText"]
    });

    // 컬럼 너비 자동 조정 (약간의 편의성)
    const wscols = [
        { wch: 12 }, // ParkID
        { wch: 30 }, // ParkName
        { wch: 15 }, // Category
        { wch: 30 }, // ItemName
        { wch: 15 }, // Price
        { wch: 50 }, // RawText
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pricing_All");

    // 4. Write File
    XLSX.writeFile(wb, OUTPUT_FILE);
    console.log(`\n🎉 Success! Created Excel file: ${OUTPUT_FILE}`);
}

run();
