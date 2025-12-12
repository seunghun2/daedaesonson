const fs = require('fs');
const path = require('path');

const ARCHIVE_DIR = path.join(__dirname, '../archive');

if (!fs.existsSync(ARCHIVE_DIR)) {
    console.log("Archive directory does not exist.");
    process.exit(0);
}

const facilities = fs.readdirSync(ARCHIVE_DIR).filter(file => {
    return fs.statSync(path.join(ARCHIVE_DIR, file)).isDirectory();
});

console.log(`Total archived facility folders: ${facilities.length}`);

const missingPdf = [];

facilities.forEach(facility => {
    const facilityPath = path.join(ARCHIVE_DIR, facility);
    const pdfPath = path.join(facilityPath, 'price_info.pdf');

    if (!fs.existsSync(pdfPath)) {
        missingPdf.push(facility);
    }
});

console.log(`\nFacilities with MISSING 'price_info.pdf': ${missingPdf.length}`);
if (missingPdf.length > 0) {
    missingPdf.slice(0, 50).forEach(f => console.log(` - ${f}`));
    if (missingPdf.length > 50) console.log(` ... and ${missingPdf.length - 50} more`);
}
