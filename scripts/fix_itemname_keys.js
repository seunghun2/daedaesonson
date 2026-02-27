const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let itemNameCount = 0;
let modifiedParks = 0;

data.forEach((park, idx) => {
    let changed = false;
    const priceInfo = park.priceInfo;
    if (priceInfo && priceInfo.standardizedPrices) {
        priceInfo.standardizedPrices.forEach(group => {
            if (group.rows) {
                group.rows.forEach(row => {
                    if (row.itemName !== undefined) {
                        row.name = row.itemName;
                        delete row.itemName;
                        itemNameCount++;
                        changed = true;
                    }
                });
            }
        });
    }
    if (changed) {
        modifiedParks++;
    }
});

if (modifiedParks > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully changed 'itemName' to 'name' in ${itemNameCount} rows across ${modifiedParks} parks.`);
} else {
    console.log('No "itemName" keys found. Nothing was changed.');
}
