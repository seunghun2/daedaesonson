const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0018');

if (!facility) {
    console.log('❌ park-0018 not found');
    process.exit(1);
}

// 보령시모란공원 매장묘 데이터 정리
const rows매장묘 = [
    // 계약시 (사용료+관리비) - 관내 거주자
    { name: '단장A', price: 5400000, grade: 'A형(18m2) / 사용료+관리비=계약시', groupType: '관내 거주자', isRepresentative: true },
    { name: '단장B', price: 7500000, grade: 'B형(25m2) / 사용료+관리비=계약시', groupType: '관내 거주자', isRepresentative: false },
    { name: '합장A', price: 9000000, grade: '합A형(30m2) / 사용료+관리비=계약시', groupType: '관내 거주자', isRepresentative: false },
    { name: '합장B', price: 10800000, grade: '합B형(36m2) / 사용료+관리비=계약시', groupType: '관내 거주자', isRepresentative: false },
    { name: '합장C', price: 12600000, grade: '합C형(42m2) / 사용료+관리비=계약시', groupType: '관내 거주자', isRepresentative: false },

    // 계약시 - 3개월이상1년미만
    { name: '단장A', price: 9900000, grade: 'A형(18m2) / 사용료+관리비=계약시', groupType: '3개월이상1년미만 거주자', isRepresentative: false },
    { name: '단장B', price: 13750000, grade: 'B형(25m2) / 사용료+관리비=계약시', groupType: '3개월이상1년미만 거주자', isRepresentative: false },
    { name: '합장A', price: 16500000, grade: '합A형(30m2) / 사용료+관리비=계약시', groupType: '3개월이상1년미만 거주자', isRepresentative: false },
    { name: '합장B', price: 19800000, grade: '합B형(36m2) / 사용료+관리비=계약시', groupType: '3개월이상1년미만 거주자', isRepresentative: false },
    { name: '합장C', price: 23100000, grade: '합C형(42m2) / 사용료+관리비=계약시', groupType: '3개월이상1년미만 거주자', isRepresentative: false },

    // 안장시 (석물+매장비) - 관내/3개월이상 동일
    { name: '단장A', price: 2216000, grade: 'A형(18m2) / 석물+매장비=안장시', groupType: '안장시', isRepresentative: false },
    { name: '단장B', price: 2486000, grade: 'B형(25m2) / 석물+매장비=안장시', groupType: '안장시', isRepresentative: false },
    { name: '합장A', price: 2810000, grade: '합A형(30m2) / 석물+매장비=안장시', groupType: '안장시', isRepresentative: false },
    { name: '합장B', price: 2810000, grade: '합B형(36m2) / 석물+매장비=안장시', groupType: '안장시', isRepresentative: false },
    { name: '합장C', price: 2810000, grade: '합C형(42m2) / 석물+매장비=안장시', groupType: '안장시', isRepresentative: false },

    // 연장시 (관리비) - 3개월미만/관외자
    { name: '단장A', price: 3600000, grade: 'A형(18m2) / 연장시 관리비', groupType: '관외자', isRepresentative: false },
    { name: '단장B', price: 5000000, grade: 'B형(25m2) / 연장시 관리비', groupType: '관외자', isRepresentative: false },
    { name: '합장A', price: 6000000, grade: '합A형(30m2) / 연장시 관리비', groupType: '관외자', isRepresentative: false },
    { name: '합장B', price: 7200000, grade: '합B형(36m2) / 연장시 관리비', groupType: '관외자', isRepresentative: false },
    { name: '합장C', price: 8400000, grade: '합C형(42m2) / 연장시 관리비', groupType: '관외자', isRepresentative: false }
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
            console.log(`✅ park-0018: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   그룹: 관내 거주자(5) + 3개월이상1년미만(5) + 안장시(5) + 관외자(5)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0018 (보령시모란공원) 데이터 정리 (groupType 적용)...\n');
update().then(() => console.log('\n✨ Done!'));
