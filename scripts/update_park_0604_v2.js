const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0604');

if (!facility) {
    console.log('❌ park-0604 not found');
    process.exit(1);
}

// 봉안묘를 가족형/부부형/평장형으로 그룹 나누고 기 수 낮은 순으로 정렬
const rows봉안묘 = [
    // 부부형 (2기)
    { name: '부부형봉안묘(평장형)', price: 7900000, grade: '2기봉안', groupType: '부부형', isRepresentative: true },

    // 평장형 (6기)
    { name: '평장형 치연장', price: 9900000, grade: '6기봉안', groupType: '평장형', isRepresentative: false },

    // 가족형 (기 수 낮은 순: 8 → 12 → 16 → 20 → 20 → 22 → 40 → 44 → 46)
    { name: '가족봉안묘-경승8호', price: 15000000, grade: '8기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승9호(2018년신규)', price: 21000000, grade: '12기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승6호(초화장)', price: 26500000, grade: '매화2기+봉안12기', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승11호', price: 25000000, grade: '16기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승3호', price: 27500000, grade: '20기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승7호', price: 23000000, grade: '20기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승10호', price: 25000000, grade: '20기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승4호', price: 27500000, grade: '22기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승1호', price: 46000000, grade: '40기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승6호(덤계장)', price: 37000000, grade: '44기봉안', groupType: '가족형', isRepresentative: false },
    { name: '가족봉안묘-경승2호', price: 39000000, grade: '46기봉안', groupType: '가족형', isRepresentative: false }
];

const rows매장묘 = [
    { name: '묘지사용료', price: 1300000, grade: '3.3㎡2단', isRepresentative: true },
    { name: '관리비', price: 18000, grade: '3.3㎡2단', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            봉안묘: { unit: '원', rows: rows봉안묘 },
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
            console.log(`✅ park-0604: ${facility.name}`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`     - 부부형: 1개 (2기)`);
            console.log(`     - 평장형: 1개 (6기)`);
            console.log(`     - 가족형: 11개 (8기~46기, 기 수 낮은 순)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows봉안묘.length + rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0604 봉안묘 그룹 재정렬 (부부형/평장형/가족형, 기 수 낮은 순)...\n');
update().then(() => console.log('\n✨ Done!'));
