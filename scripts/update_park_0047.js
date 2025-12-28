const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0047');

if (!facility) {
    console.log('❌ park-0047 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 단장형/합장형으로 구분하고 일반/특례자 groupType
const rows단장형 = [
    // 일반
    { name: '사용료', price: 359440, grade: '', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 240000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '매장비', price: 240000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '석렬비', price: 880000, grade: '', groupType: '일반', isRepresentative: false },

    // 수급자/독립유공자/국가유공자/유가족
    { name: '사용료', price: 259440, grade: '', groupType: '수급자,독립유공자,국가유공자,유가족', isRepresentative: false },
    { name: '관리비', price: 240000, grade: '', groupType: '수급자,독립유공자,국가유공자,유가족', isRepresentative: false }
];

const rows합장형 = [
    // 일반
    { name: '사용료', price: 527170, grade: '', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 360000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '매장비', price: 240000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '석렬비', price: 240000, grade: '', groupType: '일반', isRepresentative: false },

    // 수급자/독립유공자/국가유공자/유가족
    { name: '사용료', price: 527170, grade: '', groupType: '수급자,독립유공자,국가유공자,유가족', isRepresentative: false },
    { name: '관리비', price: 360000, grade: '', groupType: '수급자,독립유공자,국가유공자,유가족', isRepresentative: false }
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
            console.log(`✅ park-0047: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (일반 + 특례자)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (일반 + 특례자)`);
            console.log(`   총 ${rows단장형.length + rows합장형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0047 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
