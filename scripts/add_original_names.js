const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'data/facilities.json');
const imageDir = path.join(process.cwd(), 'FLATTENED_IMAGES');

console.log('📁 Reading facilities.json...');
const facilities = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('📸 Scanning FLATTENED_IMAGES...');
const files = fs.readdirSync(imageDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

// Build map: facilityName -> "Number.Name"
const nameMap = {};
files.forEach(file => {
    const keyPart = file.split('_img')[0]; // "10.재단법인 솥발산공원묘원"
    const firstDot = keyPart.indexOf('.');
    if (firstDot > -1) {
        const facilityName = keyPart.substring(firstDot + 1).trim();
        if (!nameMap[facilityName]) {
            nameMap[facilityName] = keyPart; // Store "10.재단법인..."
        }
    }
});

console.log(`Found ${Object.keys(nameMap).length} unique facilities in FLATTENED_IMAGES`);

let updated = 0;
facilities.forEach(facility => {
    const matchedOriginal = nameMap[facility.name];
    if (matchedOriginal) {
        facility.originalName = matchedOriginal;
        updated++;
    } else if (!facility.originalName) {
        // No match found, but set a default to avoid empty field
        facility.originalName = facility.name;
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(facilities, null, 2), 'utf-8');

console.log(`✅ Updated ${updated} facilities with originalName`);
console.log('✅ All facilities now have originalName field!');
