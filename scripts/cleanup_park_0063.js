const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0063');

if (!facility) {
    console.log('❌ park-0063 not found');
    process.exit(1);
}

// 단장형/합장형으로 재분류하고 일반/특례자 groupType
const rows단장형 = [
    // 일반
    { name: '하절기', price: 2273000, grade: '', groupType: '일반', isRepresentative: true },
    { name: '동절기', price: 2493000, grade: '', groupType: '일반', isRepresentative: false },

    // 기초수급자, 국가유공자
    { name: '하절기', price: 1650000, grade: '', groupType: '기초수급자,국가유공자', isRepresentative: false },
    { name: '동절기', price: 1870000, grade: '', groupType: '기초수급자,국가유공자', isRepresentative: false }
];

const rows합장형 = [
    // 일반
    { name: '하절기', price: 2844000, grade: '', groupType: '일반', isRepresentative: true },
    { name: '동절기', price: 3064000, grade: '', groupType: '일반', isRepresentative: false },

    // 기초수급자, 국가유공자
    { name: '하절기', price: 1930000, grade: '', groupType: '기초수급자,국가유공자', isRepresentative: false },
    { name: '동절기', price: 2150000, grade: '', groupType: '기초수급자,국가유공자', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            단장형: { unit: '원', rows: rows단장형 },
            합장형: { unit: '원', rows: rows합장형 }
        }
    }
};

async function update() {
    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ 업데이트 실패: ${result.error}`);
        } else {
            console.log(`✅ park-0063: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (일반 + 특례자)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (일반 + 특례자)`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리 + groupType 구분`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0063 카테고리 재분류 (단장형/합장형 + groupType)...\n');
update().then(() => console.log('\n✨ Done!'));
