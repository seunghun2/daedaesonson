const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0042');

if (!facility) {
    console.log('❌ park-0042 not found');
    process.exit(1);
}

// 이미지 기준으로 단장형/합장형 분리
const rows단장형 = [
    // 일반
    { name: '토지사용료', price: 10000000, grade: '10㎡', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 260000, grade: '1년기준(3.5년 선납시 할1회 적용)', groupType: '일반', isRepresentative: false },
    { name: '석물설치비', price: 15400000, grade: '10㎡(상세금액 별도)', groupType: '일반', isRepresentative: false },

    // THE PROUD
    { name: '토지사용료(THE PROUD)', price: 13000000, grade: '10㎡', groupType: 'THE PROUD', isRepresentative: false },
    { name: '석물설치비(THE PROUD)', price: 17820000, grade: '10㎡(상세금액 별도)', groupType: 'THE PROUD', isRepresentative: false }
];

const rows합장형 = [
    // 일반
    { name: '토지사용료', price: 15000000, grade: '15㎡', groupType: '일반', isRepresentative: true },
    { name: '관리비', price: 390000, grade: '1년기준(3.5년 선납시 할1회 적용)', groupType: '일반', isRepresentative: false },
    { name: '석물설치비', price: 19800000, grade: '15㎡(상세금액 별도)', groupType: '일반', isRepresentative: false },

    // THE PROUD
    { name: '토지사용료(THE PROUD)', price: 19500000, grade: '15㎡', groupType: 'THE PROUD', isRepresentative: false },
    { name: '석물설치비(THE PROUD)', price: 21120000, grade: '15㎡(상세금액 별도)', groupType: 'THE PROUD', isRepresentative: false }
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
            console.log(`✅ park-0042: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행 (일반 3 + THE PROUD 2)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (일반 3 + THE PROUD 2)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0042 단장형/합장형 분리 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
