const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0050');

if (!facility) {
    console.log('❌ park-0050 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 단장형/합장형/봉안묘로 구분
const rows단장형 = [
    { name: '1단미니모델', price: 2156000, grade: '60cm비석,60cm화강암석,화병', isRepresentative: true },
    { name: '1단 1.1×2.1모델', price: 2304500, grade: '60cm비석,60cm화강암석,화병', isRepresentative: false }
];

const rows합장형 = [
    { name: '2단모-중', price: 4474800, grade: '90cm2반비석,75cm화강암석,화병', isRepresentative: true },
    { name: '2단모-대', price: 4990700, grade: '90cm2반비석,75cm화강암석,화병', isRepresentative: false },
    { name: '2단모-특', price: 7200600, grade: '90cm2반비석,90cm화강암석,화병', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안묘 2인', price: 4032600, grade: '60cm미니노비석,60cm화강암석,화병', isRepresentative: true },
    { name: '봉안묘 4인', price: 6103900, grade: '75cm화강암비석,75cm화강암석,화병', isRepresentative: false },
    { name: '봉안묘 6인', price: 7604300, grade: '75cm화강암비석,75cm화강암석,화병', isRepresentative: false },
    { name: '매장묘 봉안묘 묘지사용료', price: 1895100, grade: '3.3㎡', isRepresentative: false },
    { name: '묘지관리비', price: 15400, grade: '1년간 관리비(3.3㎡)', isRepresentative: false }
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
            console.log(`✅ park-0050: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length + rows봉안묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0050 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
