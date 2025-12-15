const fs = require('fs');
const path = require('path');

const jsonPath = path.join(process.cwd(), 'data', 'facilities.json');

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Total items: ${data.length}`);

    // Pick first 5 items
    const samples = data.slice(0, 5);

    samples.forEach((item, idx) => {
        console.log(`\n[${idx + 1}] ${item.name || item.parkName}`);
        console.log(`  - category0   : ${item.category0}`);
        console.log(`  - category0_1 : ${item.category0_1}`);
        console.log(`  - category1   : ${item.category1}`);
        console.log(`  - category2   : ${item.category2}`);
        console.log(`  - category3   : ${item.category3}`);
    });
} catch (e) {
    console.error(e);
}
