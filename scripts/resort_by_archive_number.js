const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

(async () => {
    console.log("Re-sorting facilities.json to match Archive Folder Numbers...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error("No data file.");
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));

    // Map: RawName -> Number
    // Map: CleanName -> Number (fallback)
    const orderMap = {};

    archiveFolders.forEach(folder => {
        // Normalize for MacOS
        folder = folder.normalize('NFC');

        // Folder format: "1.(재)낙원추모공원"
        // Find first dot
        const dotIndex = folder.indexOf('.');
        if (dotIndex !== -1) {
            const numStr = folder.substring(0, dotIndex);
            const num = parseInt(numStr, 10);
            const rawName = folder.substring(dotIndex + 1).trim();

            if (!isNaN(num)) {
                orderMap[rawName] = num;

                // Also Clean Name Map just in case facility name isn't fully updated
                const clean = rawName.replace(/^(\(재\)|\(주\)|\(사\)|\(종\)|재단법인|주식회사|사단법인|종교법인|공설)/, '').trim();
                orderMap[clean] = num;
            }
        }
    });

    // Validated List
    let knownFacilities = [];
    let unknownFacilities = [];

    facilities.forEach(item => {
        const itemName = item.name.normalize('NFC').trim();
        let n = orderMap[itemName];

        // Try getting clean name if lookup failed
        if (n === undefined) {
            const clean = itemName.replace(/^(\(재\)|\(주\)|\(사\)|\(종\)|재단법인|주식회사|사단법인|종교법인|공설)/, '').trim();
            n = orderMap[clean];
        }

        if (n !== undefined) {
            item._sortOrder = n;
            knownFacilities.push(item);
        } else {
            console.log(`Warning: No Archive Number found for '${itemName}'`);
            item._sortOrder = 999999; // End
            unknownFacilities.push(item);
        }
    });

    // Sort Known
    knownFacilities.sort((a, b) => a._sortOrder - b._sortOrder);

    // Merge
    const finalSorted = [...knownFacilities, ...unknownFacilities]; // Unknowns at end

    // Cleanup temp prop
    finalSorted.forEach(i => delete i._sortOrder);

    console.log(`Sorted ${finalSorted.length} facilities.`);

    fs.writeFileSync(DATA_FILE, JSON.stringify(finalSorted, null, 2));
    console.log("✅ Saved sorted facilities.json");

})();
