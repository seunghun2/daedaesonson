const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.name && f.name.includes('전주효자'));

if (!facility) {
    console.log('❌ 전주효자공원 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 (최초 30년 / 5년 연장 구분)
const rows매장묘 = [
    { name: '사용료', price: 240000, grade: '기 사용허가를 받은자', groupType: '최초 30년', isRepresentative: true },
    { name: '관리비', price: 160000, grade: '기 사용허가를 받은자', groupType: '최초 30년', isRepresentative: false },
    { name: '사용료', price: 40000, grade: '1회에 한함', groupType: '5년 연장', isRepresentative: false },
    { name: '관리비', price: 27000, grade: '1회에 한함', groupType: '5년 연장', isRepresentative: false },
    { name: '매장 전 사용장소의 반환', price: 0, grade: '남부한 금액의 반액', groupType: null, isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 }
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
            console.log(`✅ ${facility.id}: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행 (최초 30년 2 + 5년 연장 2 + 반환 1)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 전주효자공원 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
