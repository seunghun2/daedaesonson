const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0061');

if (!facility) {
    console.log('❌ park-0061 not found');
    process.exit(1);
}

// 단장형/합장형으로 재구성
const rows단장형 = [
    { name: '사용료', price: 447870, grade: '', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 360000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '사용료', price: 0, grade: '', groupType: '기초수급자/국가유공자', isRepresentative: false }
];

const rows합장형 = [
    { name: '사용료', price: 746460, grade: '', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 600000, grade: '', groupType: '일반', isRepresentative: false },
    { name: '사용료', price: 0, grade: '', groupType: '기초수급자/국가유공자', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '사용료', price: 74640, grade: '', isRepresentative: true },
    { name: '관리비', price: 60000, grade: '', isRepresentative: false }
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
            합장형: { unit: '원', rows: rows합장형 },
            봉안묘: { unit: '원', rows: rows봉안묘 }
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
            console.log(`✅ park-0061: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (일반 2 + 기초수급자/국가유공자 1)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (일반 2 + 기초수급자/국가유공자 1)`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`\n   재구성: 매장묘 → 단장형/합장형 분리, 봉안당 → 봉안묘`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0061 (고성군 공설묘원) 데이터 정리...\n');
update().then(() => console.log('\n✨ Done!'));
