const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const ARCHIVE_DIR = path.join(__dirname, '../archive');

const TYPE_PATTERNS = [
    /^(\(재\)|재단법인\s*|재\))/,
    /^(\(주\)|주식회사\s*|주\))/,
    /^(\(종\)|종교법인\s*)/,
    /^(\(사\)|사단법인\s*)/,
    /공설/
];

function getCleanKey(name) {
    let clean = name.trim();
    for (const p of TYPE_PATTERNS) {
        clean = clean.replace(p, '');
    }
    return clean.replace(/\s+/g, '').trim(); // Remove spaces for better matching
}

(async () => {
    console.log("Checking and Forcing Name Update from Archive...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error("No data file.");
        return;
    }

    let facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const archiveFolders = fs.readdirSync(ARCHIVE_DIR).filter(f => !f.startsWith('.'));

    // Map: CleanedKey -> RawNameFromArchive
    const archiveMap = {};

    archiveFolders.forEach(folder => {
        const dotIndex = folder.indexOf('.');
        if (dotIndex !== -1) {
            const rawName = folder.substring(dotIndex + 1).trim(); // "(재)낙원추모공원"
            const key = getCleanKey(rawName);
            archiveMap[key] = rawName;
        }
    });

    let updatedCount = 0;

    facilities = facilities.map(item => {
        const itemKey = getCleanKey(item.name);
        const archiveName = archiveMap[itemKey];

        if (archiveName) {
            // Mismatch Check
            if (item.name !== archiveName) {
                // console.log(`Updating: ${item.name} -> ${archiveName}`);
                item.name = archiveName;
                updatedCount++;

                // Also update operatorType if needed? 
                // Previous logic handled it, assuming it's done or we just want name sync.
                // Let's just update name as requested.
            }
        }
        return item;
    });

    console.log(`Updated ${updatedCount} facility names to match Archive.`);

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log("✅ Saved facilities.json");

})();
