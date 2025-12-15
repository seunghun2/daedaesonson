const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../esky_화장시설.json');
const TARGET_FILE = path.join(__dirname, '../data/raw_list.json');

const START_RNO = 1;

try {
    const data = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const json = JSON.parse(data);
    const list = json.list;

    // Filter from START_RNO to the end
    const batch = list.filter(item => item.rno >= START_RNO);

    fs.writeFileSync(TARGET_FILE, JSON.stringify(batch, null, 2), 'utf-8');
    console.log(`Extracted ${batch.length} items (from rno ${START_RNO} to end) to ${TARGET_FILE}`);

    if (batch.length > 0) {
        console.log(`First item: ${batch[0].rno} - ${batch[0].companyname}`);
        console.log(`Last item: ${batch[batch.length - 1].rno} - ${batch[batch.length - 1].companyname}`);
    }

} catch (e) {
    console.error(e);
}
