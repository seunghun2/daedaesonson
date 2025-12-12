const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

(async () => {
    console.log("Migrating: Adding 'originalName' field...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error("No data file.");
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    let updatedCount = 0;

    facilities.forEach(item => {
        // If originalName is missing, set it to current name
        // We assume current name is the Correct Raw Name because of previous steps
        if (!item.originalName) {
            item.originalName = item.name;
            updatedCount++;
        }
    });

    console.log(`Updated ${updatedCount} facilities with originalName.`);

    fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
    console.log("✅ Saved facilities.json");

})();
