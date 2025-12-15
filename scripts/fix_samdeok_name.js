const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

(async () => {
    console.log("Fixing Samdeok Facility Name...");

    if (!fs.existsSync(DATA_FILE)) {
        console.error("No data file.");
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // Find item with Samdeok description but potentially wrong name
    const samdeok = facilities.find(i => i.description.includes('삼덕공원묘원') || i.description.includes('(재)삼덕'));

    if (samdeok) {
        console.log(`Found candidate item: ID=${samdeok.id}, CurrentName=${samdeok.name}`);

        if (samdeok.name !== '(재)삼덕공원묘원') {
            samdeok.name = '(재)삼덕공원묘원';
            console.log("✅ Updated name to '(재)삼덕공원묘원'");

            fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));
            console.log("Saved facilities.json");
        } else {
            console.log("Name is already correct.");
        }
    } else {
        console.log("❌ Could not find facilities with '삼덕' in description.");
    }
})();
