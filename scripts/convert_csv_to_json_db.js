const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const DATA_DIR = path.join(__dirname, '../data');
const CSV_FILES = [
    'pricing_cemetery.csv',
    'pricing_cremation.csv',
    'pricing_enshrinement.csv',
    'pricing_natural.csv'
];
const OUTPUT_FILE = path.join(DATA_DIR, 'pricing_db.json');

function run() {
    let allData = [];
    let idCounter = 1;

    CSV_FILES.forEach(filename => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            parsed.data.forEach(row => {
                allData.push({
                    id: idCounter++,
                    parkId: row.ParkID,
                    parkName: row.ParkName,
                    category: row.Category,
                    itemName: row.ItemName,
                    price: row.Price,
                    rawText: row.RawText,
                    sourceFile: filename
                });
            });
        }
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`Generated JSON DB with ${allData.length} rows at ${OUTPUT_FILE}`);
}

run();
