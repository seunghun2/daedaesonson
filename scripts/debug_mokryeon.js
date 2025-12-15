const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

const content = fs.readFileSync(CSV_FILE, 'utf-8');
const lines = content.split('\n');

console.log("Searching for park-0020 items with category '기본비용':");

lines.forEach(line => {
    if (line.includes('park-0020')) {
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols[2] === '기본비용') {
            console.log(`Matched: Name=[${cols[3]}], Desc=[${cols[5]}]`);
        }
    }
});
