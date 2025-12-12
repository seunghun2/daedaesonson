const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/facilities.json');
const v1Data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`V1 Total: ${v1Data.length}`);

const nameCounts = {};
v1Data.forEach(f => {
    const n = f.name.trim();
    nameCounts[n] = (nameCounts[n] || 0) + 1;
});

let duplicates = 0;
Object.entries(nameCounts).forEach(([name, count]) => {
    if (count > 1) {
        console.log(`Duplicate: ${name} (${count})`);
        duplicates += (count - 1);
    }
});

console.log(`Total Duplicates in V1: ${duplicates}`);
console.log(`Unique Facilities: ${v1Data.length - duplicates}`);
