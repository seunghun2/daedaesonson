const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0021');

if (!facility) {
    console.log('❌ park-0021 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 3개 이미지 통합
// 1. 묘지
const rows매장묘 = [
    // 사용료 및 관리비 (최초) - 30년
    { name: '사용료', price: 996000, grade: '30년', groupType: '단장 (최초)', isRepresentative: true },
    { name: '관리비', price: 448000, grade: '30년', groupType: '단장 (최초)', isRepresentative: false },
    { name: '사용료', price: 1436000, grade: '30년', groupType: '합장 (최초)', isRepresentative: false },
    { name: '관리비', price: 673000, grade: '30년', groupType: '합장 (최초)', isRepresentative: false },

    // 연장 관리비 - 30년
    { name: '관리비', price: 448000, grade: '30년', groupType: '단장 (연장)', isRepresentative: false },
    { name: '관리비', price: 673000, grade: '30년', groupType: '합장 (연장)', isRepresentative: false },

    // 연장 관리비 - 15년
    { name: '관리비', price: 300000, grade: '15년', groupType: '단장 (연장)', isRepresentative: false },
    { name: '관리비', price: 450000, grade: '15년', groupType: '합장 (연장)', isRepresentative: false },

    // 매장비 정보
    { name: '석물비', price: 1129000, grade: '단장(10㎡)', isRepresentative: false },
    { name: '석물비', price: 1366000, grade: '합장(15㎡)', isRepresentative: false },
    { name: '석물비', price: 1366000, grade: '동시합장', isRepresentative: false },
    { name: '매장비', price: 480000, grade: '단장(10㎡)', isRepresentative: false },
    { name: '매장비', price: 580000, grade: '합장(15㎡)', isRepresentative: false },
    { name: '매장비', price: 960000, grade: '동시합장', isRepresentative: false },
    { name: '석물설치비', price: 100000, grade: '', isRepresentative: false },
    { name: '잔디.석회', price: 100000, grade: '', isRepresentative: false },
    { name: '총합계', price: 1809000, grade: '단장(10㎡)', isRepresentative: false },
    { name: '총합계', price: 2146000, grade: '합장(15㎡)', isRepresentative: false },
    { name: '총합계', price: 2526000, grade: '동시합장', isRepresentative: false }
];

// 2. 봉안시설
const rows봉안당 = [
    // 사용료 및 관리비 (최초) - 30년
    { name: '사용료', price: 600000, grade: '30년', groupType: '개인단', isRepresentative: true },
    { name: '관리비', price: 0, grade: '-', groupType: '개인단', isRepresentative: false },
    { name: '사용료', price: 1200000, grade: '30년', groupType: '부부단', isRepresentative: false },
    { name: '관리비', price: 0, grade: '-', groupType: '부부단', isRepresentative: false },

    // 연장 관리비 - 30년
    { name: '사용료', price: 600000, grade: '30년', groupType: '개인단 (연장)', isRepresentative: false },
    { name: '사용료', price: 1200000, grade: '30년', groupType: '부부단 (연장)', isRepresentative: false },

    // 연장 관리비 - 15년
    { name: '관리비', price: 300000, grade: '15년', groupType: '개인단 (연장)', isRepresentative: false },
    { name: '관리비', price: 600000, grade: '15년', groupType: '부부단 (연장)', isRepresentative: false }
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
            봉안당: { unit: '원', rows: rows봉안당 }
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
            console.log(`✅ park-0021: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안당: ${rows봉안당.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows봉안당.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0021 데이터 입력 (이미지 기준 - 3개 통합)...\n');
update().then(() => console.log('\n✨ Done!'));
