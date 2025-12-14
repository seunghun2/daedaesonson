const fs = require('fs');
const path = require('path');

const PRICING_DB_PATH = path.join(__dirname, '../data/pricing_db.json');

function updateCategory3() {
    console.log('🔄 Loading pricing data...');
    let pricingData = [];
    try {
        pricingData = JSON.parse(fs.readFileSync(PRICING_DB_PATH, 'utf-8'));
    } catch (err) {
        console.error('Failed to load pricing_db.json', err);
        return;
    }

    let updatedCount = 0;

    const newPricingData = pricingData.map(item => {
        // Init category3
        let cat3 = item.category3 || '';

        // Search text: itemName, rawText
        const textToSearch = (item.itemName + ' ' + (item.rawText || '')).toLowerCase();

        // Keywords
        if (textToSearch.includes('관내') || textToSearch.includes('주민') || textToSearch.includes('시민')) {
            cat3 = '관내';
        } else if (textToSearch.includes('관외') || textToSearch.includes('타지역') || textToSearch.includes('타시군')) {
            cat3 = '관외';
        } else {
            // Default: If no keyword found, leave blank or '일반'?
            // Usually 'General' applies if not specified, but let's keep blank for now.
            // cat3 = ''; 
        }

        if (cat3 !== item.category3) {
            updatedCount++;
        }

        return {
            ...item,
            category3: cat3
        };
    });

    console.log(`💾 Saving... Updated ${updatedCount} items with category3 (Quan-nae/Quan-oe).`);
    fs.writeFileSync(PRICING_DB_PATH, JSON.stringify(newPricingData, null, 2));
}

updateCategory3();
