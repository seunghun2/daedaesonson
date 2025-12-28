const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0488');

if (!facility) {
    console.log('❌ park-0488 not found');
    process.exit(1);
}

// 단장형/합장형으로 나누고 groupType으로 관내/관외 구분
const rows단장형 = [
    // 관내
    { name: '묘지 사용료', price: 340000, grade: '15년 3회연장가능', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: true },
    { name: '묘지 관리비', price: 180000, grade: '15년 3회연장가능', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '석물비', price: 305000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '비석글씨', price: 70000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '인건비', price: 211000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '잔디', price: 20000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },

    // 관외
    { name: '묘지 사용료', price: 600000, grade: '15년 3회연장가능', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '묘지 관리비', price: 180000, grade: '15년 3회연장가능', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '석물비', price: 305000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '비석글씨', price: 70000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '인건비', price: 211000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '잔디', price: 20000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false }
];

const rows합장형 = [
    // 관내
    { name: '묘지 사용료', price: 555000, grade: '15년 3회연장가능', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: true },
    { name: '묘지 관리비', price: 225000, grade: '15년 3회연장가능', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '석물비', price: 330000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '비석글씨', price: 70000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '인건비', price: 282000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },
    { name: '잔디', price: 26000, grade: '', groupType: '관내 (사망일 1개월 전 광양 거주)', isRepresentative: false },

    // 관외
    { name: '묘지 사용료', price: 789000, grade: '15년 3회연장가능', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '묘지 관리비', price: 225000, grade: '15년 3회연장가능', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '석물비', price: 330000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '비석글씨', price: 70000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '인건비', price: 282000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false },
    { name: '잔디', price: 26000, grade: '', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)', isRepresentative: false }
];

const rows무연고 = [
    { name: '사용료', price: 100000, grade: '10년 연장불가능', isRepresentative: true },
    { name: '관리비', price: 120000, grade: '10년 연장불가능', isRepresentative: false }
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
            무연고: { unit: '원', rows: rows무연고 }
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
            console.log(`✅ park-0488: ${facility.name} (Item 748)`);
            console.log(`   단장형: ${rows단장형.length}개 행 (관내 6 + 관외 6)`);
            console.log(`   합장형: ${rows합장형.length}개 행 (관내 6 + 관외 6)`);
            console.log(`   무연고: ${rows무연고.length}개 행`);
            console.log(`   총 26개 행 (CSV 완전 반영)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 748 (park-0488: 광양시립묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
