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

console.log(`Total facilities: ${facilities.length}`);

let renamedCount = 0;
let skippedCount = 0;

facilities.forEach(folderName => {
    const facilityPath = path.join(ARCHIVE_DIR, folderName);
    const oldPdfPath = path.join(facilityPath, 'price_info.pdf');

    // Target name: FolderName_price_info.pdf
    // User requested "[폴더명]price_info", adding underscore for readability and standard practice unless specified otherwise.
    // If exact concatenation is required, remove the underscore.
    const newPdfName = `${folderName}_price_info.pdf`;
    const newPdfPath = path.join(facilityPath, newPdfName);

    if (fs.existsSync(oldPdfPath)) {
        fs.renameSync(oldPdfPath, newPdfPath);
        // console.log(`Renamed in ${folderName}: price_info.pdf -> ${newPdfName}`);
        renamedCount++;
    } else if (fs.existsSync(newPdfPath)) {
        // console.log(`Skipped ${folderName}: Already renamed.`);
        skippedCount++;
    } else {
        // console.warn(`Warning: No price info found in ${folderName}`);
    }
});

console.log(`\nRenaming Complete.`);
console.log(`Renamed: ${renamedCount}`);
console.log(`Already Renamed/Skipped: ${skippedCount}`);
