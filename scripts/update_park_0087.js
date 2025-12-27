const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0087');

if (!facility) {
    console.log('❌ park-0087 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 332749, grade: '332,749원/1㎡(1,100,000원/1평)', isRepresentative: true },
    { name: '관리비', price: 4538, grade: '4,538원/1㎡(15,000원/1평)', isRepresentative: false },
    { name: '매장묘(일반 개인묘/3평형)', price: 11325000, grade: '돌래석, 오석비표, 상석, 꽃병, 향로', isRepresentative: false },
    { name: '분묘설치비', price: 500000, grade: '3.3㎡(1평)당', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안묘(일반 부부형/1.5평형)', price: 6892500, grade: '돌래석, 오석비표, 상석, 꽃병, 향로', isRepresentative: true }
];

const rows평장묘 = [
    { name: '자연장 평장묘(일반 개인묘/1평형)', price: 4770000, grade: '표석, 반석대, 꽃병', isRepresentative: true }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: { unit: '원', rows: rows매장묘 },
            봉안묘: { unit: '원', rows: rows봉안묘 },
            평장묘: { unit: '원', rows: rows평장묘 }
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
            console.log(`✅ park-0087: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0087 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
