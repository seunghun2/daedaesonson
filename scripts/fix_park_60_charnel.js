const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0060');
park.priceInfo.standardizedPrices.forEach(sp => {
    if (sp.subType === '석물') {
        sp.subType = '[필수]석물';
        console.log('✅ park-0060: 석물 → [필수]석물');
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
