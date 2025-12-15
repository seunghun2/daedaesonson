const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

function splitCategory() {
    console.log('🔄 Loading pricing database...');
    let pricingData = [];
    try {
        pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    } catch (err) {
        console.error('Failed to load pricing_db.json', err);
        return;
    }

    console.log(`✅ Loaded ${pricingData.length} items.`);

    const newPricingData = pricingData.map(item => {
        // category1 = 기존 category
        // category2 = 기존 category (일단 복사)
        return {
            ...item,
            category1: item.category || '',
            category2: item.category || ''
        };
    });

    console.log(`💾 Saving updated data with category1 & category2...`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
    console.log('🎉 Done!');
}

splitCategory();
