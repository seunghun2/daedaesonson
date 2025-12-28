const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

// park-0142 정리
const facility142 = facilities.find(f => f.id === 'park-0142');
// park-0103 정리
const facility103 = facilities.find(f => f.id === 'park-0103');

if (!facility142 || !facility103) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// park-0142: 단장형/합장형으로 재분류
const rows142단장형 = [
    { name: '공설묘지 사용료', price: 60000, grade: '', isRepresentative: true },
    { name: '공설묘지 관리비', price: 30000, grade: '', isRepresentative: false }
];

const rows142합장형 = [
    { name: '공설묘지 사용료', price: 90000, grade: '', isRepresentative: true },
    { name: '공설묘지 관리비', price: 45000, grade: '', isRepresentative: false }
];

// park-0103: 단장형/합장형으로 재분류 (데이터 구조 확인 필요)
const rows103단장형 = [];
const rows103합장형 = [];

const payload142 = {
    id: facility142.id,
    name: facility142.name,
    address: facility142.address,
    category: facility142.category,
    coordinates: facility142.coordinates,
    priceInfo: {
        priceTable: {
            단장형: { unit: '원', rows: rows142단장형 },
            합장형: { unit: '원', rows: rows142합장형 }
        }
    }
};

async function update() {
    try {
        // park-0142 업데이트
        const response142 = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload142)
        });

        const result142 = await response142.json();

        if (result142.error) {
            console.log(`❌ park-0142 업데이트 실패: ${result142.error}`);
        } else {
            console.log(`✅ park-0142: ${facility142.name}`);
            console.log(`   단장형: ${rows142단장형.length}개 행`);
            console.log(`   합장형: ${rows142합장형.length}개 행`);
            console.log(`   재구성: 매장묘 → 단장형/합장형 분리`);
        }

        console.log('\n---\n');
        console.log('park-0103 데이터 구조 확인 필요');

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0142 카테고리 재분류...\n');
update().then(() => console.log('\n✨ Done!'));
