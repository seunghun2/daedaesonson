const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

function splitItemName() {
    console.log('🔄 Loading pricing database...');
    let pricingData = [];
    try {
        pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    } catch (err) {
        console.error('Failed to load pricing_db.json', err);
        return;
    }

    const newPricingData = pricingData.map(item => {
        // 대표 메뉴(isRepresentative) 필드는 굳이 안 지워도 되지만, 
        // itemName1, itemName2 복사는 확실하게.
        return {
            ...item,
            itemName1: item.itemName || '',
            itemName2: item.itemName || ''
        };
    });

    console.log(`💾 Saving updated data with itemName1 & itemName2...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
    console.log('🎉 Done! Item name split complete.');
}

splitItemName();
