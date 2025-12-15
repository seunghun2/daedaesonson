const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');
const PRICE_FILE = path.join(__dirname, '../facilities_3_to_10_prices.json');

console.log('===기본비용 정확한 데이터로 채우기 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const priceData = JSON.parse(fs.readFileSync(PRICE_FILE, 'utf-8'));

// 1~2번은 수동
const manualData = {
    1: { usage: { name: '사용료', price: 3000000 }, mgmt: { name: '관리비', price: 25000 } },
    2: { usage: { name: '묘지사용료', price: 2160000 }, mgmt: { name: '관리비', price: 16000 } }
};

// 1~2번 처리
[1, 2].forEach(num => {
    const idx = num - 1;
    const facility = facilities[idx];
    const data = manualData[num];

    if (!facility.priceInfo.priceTable['기본비용']) {
        facility.priceInfo.priceTable['기본비용'] = {
            unit: '원',
            category: 'base_cost',
            rows: []
        };
    }

    facility.priceInfo.priceTable['기본비용'].rows = [
        { name: data.usage.name, price: data.usage.price, grade: '' },
        { name: data.mgmt.name, price: data.mgmt.price, grade: '' }
    ];

    console.log(`${num}. ${facility.name} ✅`);
});

// 3~10번 처리  
priceData.forEach(data => {
    const num = data.number;
    const idx = num - 1;
    const facility = facilities[idx];

    if (!facility.priceInfo.priceTable['기본비용']) {
        facility.priceInfo.priceTable['기본비용'] = {
            unit: '원',
            category: 'base_cost',
            rows: []
        };
    }

    const rows = [];
    if (data.usageFee && data.usageFee.price) {
        rows.push({ name: data.usageFee.name, price: data.usageFee.price, grade: '' });
    }
    if (data.managementFee && data.managementFee.price) {
        rows.push({ name: data.managementFee.name, price: data.managementFee.price, grade: '' });
    }

    facility.priceInfo.priceTable['기본비용'].rows = rows;

    console.log(`${num}. ${facility.name} ✅`);
});

// 저장
fs.writeFileSync(DATA_FILE, JSON.stringify(facilities, null, 2));

console.log('\n✅ 전체 기본비용 채우기 완료!');
console.log('브라우저 새로고침 하세요!');
