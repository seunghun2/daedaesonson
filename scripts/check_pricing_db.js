const fs = require('fs');
const path = require('path');

// Try pricing_db.json
const jsonPath = path.join(process.cwd(), 'data', 'pricing_db.json');

try {
    if (!fs.existsSync(jsonPath)) {
        console.log("pricing_db.json NOT FOUND");
    } else {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`Total items in pricing_db: ${data.length}`);

        // Pick top 5
        const samples = data.slice(0, 5);
        samples.forEach((item, idx) => {
            console.log(`\n[${idx + 1}] ${item.parkName}`);
            console.log(`  - c0: ${item.category0}`);
            console.log(`  - c1: ${item.category1}`);
            console.log(`  - c2: ${item.category2}`);
            console.log(`  - c3: ${item.category3}`);
        });
    }
} catch (e) {
    console.error(e);
}
