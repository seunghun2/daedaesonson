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

const emptyPhotos = [];
const missingPhotosDir = [];

facilities.forEach(facility => {
    const facilityPath = path.join(ARCHIVE_DIR, facility);
    const photosPath = path.join(facilityPath, 'photos');

    if (!fs.existsSync(photosPath)) {
        missingPhotosDir.push(facility);
    } else {
        const files = fs.readdirSync(photosPath);
        // Filter out .DS_Store or other system files if needed, but for now strict check
        const validFiles = files.filter(f => !f.startsWith('.'));
        if (validFiles.length === 0) {
            emptyPhotos.push(facility);
        }
    }
});

console.log(`\nFacilities with MISSING 'photos' directory: ${missingPhotosDir.length}`);
if (missingPhotosDir.length > 0) {
    missingPhotosDir.slice(0, 20).forEach(f => console.log(` - ${f}`));
    if (missingPhotosDir.length > 20) console.log(` ... and ${missingPhotosDir.length - 20} more`);
}

console.log(`\nFacilities with EMPTY 'photos' directory: ${emptyPhotos.length}`);
if (emptyPhotos.length > 0) {
    emptyPhotos.slice(0, 20).forEach(f => console.log(` - ${f}`));
    if (emptyPhotos.length > 20) console.log(` ... and ${emptyPhotos.length - 20} more`);
}

// Combine for result file if needed, but console output is requested.
