const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// === Park 51 fix ===
const park51 = data.find(p => p.id === 'park-0051');
if (park51) {
    park51.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            feeType: 'USAGE',
            rows: [
                { name: '묘지 사용료 (하단구역)', price: 20000000, groupType: '', note: '5㎡ / 30년간 사용' },
                { name: '묘지 사용료 (상단구역)', price: 15000000, groupType: '', note: '5㎡ / 30년간 사용' },
                { name: '관리비 (10년 선납)', price: 600000, groupType: '', note: '1년 60,000원 × 10년' },
                { name: '부부합장묘 추가비용', price: 1500000, groupType: '', note: '' },
                { name: '자연장', price: 1500000, groupType: '', note: '30cm×30cm / 표석없음 / 관리비없음 / 기간 영구' },
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안당',
            feeType: 'USAGE',
            rows: [
                { name: '봉안당 (개인함/부부함)', price: 0, groupType: '', note: '호실과 단의 높이에 따라 정함' },
                { name: '관리비 (10년 선납)', price: 500000, groupType: '', note: '1년 50,000원 × 10년' },
            ]
        }
    ];
    console.log('✅ park-0051 fixed: CHARNEL→BONGSAN, 자연장 merged into 매장묘');
}

// === Park 52 fix ===
const park52 = data.find(p => p.id === 'park-0052');
if (park52) {
    // Find 봉안담 section and change BURIAL→BONGSAN
    park52.priceInfo.standardizedPrices.forEach(sp => {
        if (sp.subType === '봉안담') {
            sp.serviceType = 'BONGSAN';
            console.log('✅ park-0052 fixed: 봉안담 BURIAL→BONGSAN');
        }
    });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ Hotfix complete');
