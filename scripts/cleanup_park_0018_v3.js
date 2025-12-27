const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0018');

if (!facility) {
    console.log('❌ park-0018 not found');
    process.exit(1);
}

// 1차: 단장형 카테고리 (priceTable 키)
// 2차: groupType (단장A, 단장B)
const rows단장형 = [
    // 단장A
    { name: '관내 거주자', price: 5400000, grade: '사용료+관리비=계약시', groupType: '단장A (18m2)', isRepresentative: true },
    { name: '3개월이상1년미만 거주자', price: 9900000, grade: '사용료+관리비=계약시', groupType: '단장A (18m2)', isRepresentative: false },
    { name: '안장시 (석물+매장비)', price: 2216000, grade: '석물+매장비', groupType: '단장A (18m2)', isRepresentative: false },
    { name: '관외자 연장시', price: 3600000, grade: '연장시 관리비', groupType: '단장A (18m2)', isRepresentative: false },

    // 단장B
    { name: '관내 거주자', price: 7500000, grade: '사용료+관리비=계약시', groupType: '단장B (25m2)', isRepresentative: false },
    { name: '3개월이상1년미만 거주자', price: 13750000, grade: '사용료+관리비=계약시', groupType: '단장B (25m2)', isRepresentative: false },
    { name: '안장시 (석물+매장비)', price: 2486000, grade: '석물+매장비', groupType: '단장B (25m2)', isRepresentative: false },
    { name: '관외자 연장시', price: 5000000, grade: '연장시 관리비', groupType: '단장B (25m2)', isRepresentative: false }
];

// 1차: 합장형 카테고리 (priceTable 키)
// 2차: groupType (합장A, 합장B, 합장C)
const rows합장형 = [
    // 합장A
    { name: '관내 거주자', price: 9000000, grade: '사용료+관리비=계약시', groupType: '합장A (30m2)', isRepresentative: true },
    { name: '3개월이상1년미만 거주자', price: 16500000, grade: '사용료+관리비=계약시', groupType: '합장A (30m2)', isRepresentative: false },
    { name: '안장시 (석물+매장비)', price: 2810000, grade: '석물+매장비', groupType: '합장A (30m2)', isRepresentative: false },
    { name: '관외자 연장시', price: 6000000, grade: '연장시 관리비', groupType: '합장A (30m2)', isRepresentative: false },

    // 합장B
    { name: '관내 거주자', price: 10800000, grade: '사용료+관리비=계약시', groupType: '합장B (36m2)', isRepresentative: false },
    { name: '3개월이상1년미만 거주자', price: 19800000, grade: '사용료+관리비=계약시', groupType: '합장B (36m2)', isRepresentative: false },
    { name: '안장시 (석물+매장비)', price: 2810000, grade: '석물+매장비', groupType: '합장B (36m2)', isRepresentative: false },
    { name: '관외자 연장시', price: 7200000, grade: '연장시 관리비', groupType: '합장B (36m2)', isRepresentative: false },

    // 합장C
    { name: '관내 거주자', price: 12600000, grade: '사용료+관리비=계약시', groupType: '합장C (42m2)', isRepresentative: false },
    { name: '3개월이상1년미만 거주자', price: 23100000, grade: '사용료+관리비=계약시', groupType: '합장C (42m2)', isRepresentative: false },
    { name: '안장시 (석물+매장비)', price: 2810000, grade: '석물+매장비', groupType: '합장C (42m2)', isRepresentative: false },
    { name: '관외자 연장시', price: 8400000, grade: '연장시 관리비', groupType: '합장C (42m2)', isRepresentative: false }
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
            console.log(`✅ park-0018: ${facility.name}`);
            console.log(`   1차 카테고리: 단장형 (${rows단장형.length}개 행) + 합장형 (${rows합장형.length}개 행)`);
            console.log(`   2차 그룹: 단장A/B, 합장A/B/C (groupType)`);
            console.log(`   3차 항목: 관내/3개월이상/안장시/관외자 (name)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0018 (보령시모란공원) 단장형/합장형 카테고리 분리...\n');
update().then(() => console.log('\n✨ Done!'));
