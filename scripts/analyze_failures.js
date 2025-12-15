const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = path.join(__dirname, '../archive');
const OUTPUT_FILE = path.join(__dirname, '../data/failed_non_funeral_full.json');

const FILES = [
    'esky_묘지.json',
    'esky_봉안시설.json',
    'esky_자연장지.json',
    'esky_화장시설.json'
];

let allNonFuneral = [];

FILES.forEach(filename => {
    const filePath = path.join(__dirname, `../${filename}`);
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        // data.list contains the array
        if (data.list) {
            allNonFuneral = allNonFuneral.concat(data.list);
        }
    } else {
        console.warn(`File not found: ${filename}`);
    }
});

console.log(`Total Non-Funeral Facilities Identified: ${allNonFuneral.length}`);

const failures = [];

allNonFuneral.forEach(item => {
    // Expected folder name: "RNO.COMPANYNAME"
    // Note: Verify if RNO is unique across files or only within file?
    // In archive list, we saw "1.(재)낙원추모공원" and "1.정토사 극락원" etc.
    // It seems RNOs are NOT unique globally.
    // However, the folder naming convention used previously seems to be `${rno}.${companyname}`.
    // We strictly check for THAT directory existence.

    // We do NOT check uniqueness here, just specific existence.
    const folderName = `${item.rno}.${item.companyname}`;
    const facilityDir = path.join(ARCHIVE_DIR, folderName);
    const pdfPath = path.join(facilityDir, 'price_info.pdf');
    // const photosDir = path.join(facilityDir, 'photos');

    let reasons = [];
    if (!fs.existsSync(facilityDir)) {
        reasons.push('Directory missing');
    } else {
        if (!fs.existsSync(pdfPath)) {
            reasons.push('Price PDF missing');
        }
    }

    if (reasons.length > 0) {
        failures.push({
            ...item,
            folderName, // Add folder name for reference
            failureReasons: reasons
        });
    }
});

console.log(`Failed/Incomplete Non-Funeral Facilities: ${failures.length}`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(failures, null, 2));

// Print first 20 failures
if (failures.length > 0) {
    console.log('Sample failures:');
    failures.slice(0, 20).forEach(f => console.log(`- ${f.folderName}: ${f.failureReasons.join(', ')}`));
}
