const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0034');

if (!facility) {
    console.log('❌ park-0034 not found');
    process.exit(1);
}

// 2평형/3평형으로 그룹화 + 중복 제거
const rows매장묘 = [
    // 2평형 (6.75㎡)
    { name: '30년 사용료', price: 572000, grade: '30년', groupType: '2평형 (6.75㎡)', isRepresentative: true },
    { name: '30년 관리비', price: 480000, grade: '30년', groupType: '2평형 (6.75㎡)', isRepresentative: false },
    { name: '매장비 (동절기)', price: 370000, grade: '1구당', groupType: '2평형 (6.75㎡)', isRepresentative: false },
    { name: '화강암 석물비', price: 940000, grade: '', groupType: '2평형 (6.75㎡)', isRepresentative: false },
    { name: '오석 석물비', price: 1118000, grade: '', groupType: '2평형 (6.75㎡)', isRepresentative: false },

    // 3평형 (9.9㎡)
    { name: '30년 사용료', price: 839000, grade: '30년', groupType: '3평형 (9.9㎡)', isRepresentative: false },
    { name: '30년 관리비', price: 720000, grade: '30년', groupType: '3평형 (9.9㎡)', isRepresentative: false },
    { name: '1구당 매장비', price: 370000, grade: '1구당', groupType: '3평형 (9.9㎡)', isRepresentative: false },
    { name: '2구당 매장비', price: 740000, grade: '2구당', groupType: '3평형 (9.9㎡)', isRepresentative: false },
    { name: '화강암 석물비', price: 982000, grade: '', groupType: '3평형 (9.9㎡)', isRepresentative: false },
    { name: '오석 석물비', price: 1160000, grade: '', groupType: '3평형 (9.9㎡)', isRepresentative: false },

    // 국가유공자/수급자 (무료)
    { name: '2평형 30년 사용료', price: 0, grade: '1종 수급 국가유공자', groupType: '국가유공자/수급자', isRepresentative: false },
    { name: '2평형 30년 관리비', price: 0, grade: '1종 수급 국가유공자', groupType: '국가유공자/수급자', isRepresentative: false },
    { name: '3평형 30년 사용료', price: 0, grade: '1종 수급 국가유공자', groupType: '국가유공자/수급자', isRepresentative: false },
    { name: '3평형 30년 관리비', price: 0, grade: '1종 수급 국가유공자', groupType: '국가유공자/수급자', isRepresentative: false }
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
            console.log(`✅ park-0034: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   그룹: 2평형(5) + 3평형(6) + 국가유공자/수급자(4)`);
            console.log(`\n   중복 제거: 오석 석물비 중복 항목 제거`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0034 (삼척시추모공원) 데이터 정리...\n');
update().then(() => console.log('\n✨ Done!'));
