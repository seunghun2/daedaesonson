const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../data/crawled_all.json');
const TARGET_FILE = path.join(__dirname, '../data/funeral_list_final.json');

try {
    const data = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const json = JSON.parse(data);

    // Check structure: esky array?
    let list = json.esky || [];

    // Filter for FuneralHallDet
    // Also use 'TBC0700001' which confirms it is funeral hall
    const funeralList = list.filter(item => item.type === 'FuneralHallDet' || item.facilitygroupcd === 'TBC0700001');

    // Create simplified list with RNO
    const simplified = funeralList.map((item, index) => ({
        rno: index + 1,
        companyname: item.companyname,
        facilitycd: item.facilitycd,
        fulladdress: item.fulladdress
    }));

    fs.writeFileSync(TARGET_FILE, JSON.stringify(simplified, null, 2), 'utf-8');
    console.log(`Extracted ${simplified.length} funeral homes to ${TARGET_FILE}`);

    if (simplified.length > 0) {
        console.log(`First: ${simplified[0].companyname} (${simplified[0].facilitycd})`);
        console.log(`Last: ${simplified[simplified.length - 1].companyname}`);
    }

} catch (e) {
    console.error(e);
}
