const fs = require('fs');
const path = require('path');

const LIST_FILE = path.join(__dirname, '../esky_full_with_details.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');
const OUTPUT_FILE = path.join(__dirname, '../esky_full_renumbered.json');

// Check if file exists
if (!fs.existsSync(LIST_FILE)) {
    console.error(`File not found: ${LIST_FILE}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(LIST_FILE, 'utf-8'));
const list = data.list || data;

console.log(`Loaded ${list.length} facilities.`);

let newId = 1;
let renamedCount = 0;
let missingCount = 0;

list.forEach(item => {
    const oldRno = item.rno;
    const name = item.companyname;

    // Some names might have special characters that were sanitized in folder creation? 
    // Usually we try exact match first.
    const oldFolderName = `${oldRno}.${name}`;
    const oldFolderPath = path.join(ARCHIVE_DIR, oldFolderName);

    const newFolderName = `${newId}.${name}`;
    const newFolderPath = path.join(ARCHIVE_DIR, newFolderName);

    // Update item rno
    item.rno = newId;

    if (fs.existsSync(oldFolderPath)) {
        // If the new folder name is different (which it almost always will be, or to avoid case issues)
        if (oldFolderPath !== newFolderPath) {
            try {
                fs.renameSync(oldFolderPath, newFolderPath);
                // console.log(`Renamed: ${oldFolderName} -> ${newFolderName}`);
                renamedCount++;
            } catch (e) {
                console.error(`Failed to rename ${oldFolderName}: ${e.message}`);
            }
        }
    } else {
        // Check if ALREADY properly named (in case run multiple times)
        if (fs.existsSync(newFolderPath)) {
            // Already good, do nothing
        } else {
            // console.warn(`Folder not found: ${oldFolderName}`);
            missingCount++;
        }
    }

    newId++;
});

// Save updated JSON
const outputData = { list: list };
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
fs.writeFileSync(LIST_FILE, JSON.stringify(outputData, null, 2)); // Overwrite original too as requested

console.log(`\nProcess Complete.`);
console.log(`Total Renumbered Folders: ${renamedCount}`);
console.log(`Total Missing Folders: ${missingCount}`);
console.log(`Updated JSON saved to ${LIST_FILE}`);
