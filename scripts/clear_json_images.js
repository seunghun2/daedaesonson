const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'data/facilities.json');

console.log('📁 Reading facilities.json...');
const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

console.log(`Found ${data.length} facilities`);

let modified = 0;

data.forEach(facility => {
    if (facility.images || facility.imageGallery) {
        facility.images = [];
        facility.imageGallery = [];
        modified++;
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`✅ Modified ${modified} facilities`);
console.log('✅ All images cleared from JSON file!');
