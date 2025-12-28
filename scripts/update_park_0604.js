const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0604');

if (!facility) {
    console.log('❌ park-0604 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 봉안묘와 매장묘 구분
const rows봉안묘 = [
    { name: '가족봉안묘-경승1호', price: 46000000, grade: '40기봉안', isRepresentative: true },
    { name: '가족봉안묘-경승2호', price: 39000000, grade: '46기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승3호', price: 27500000, grade: '20기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승4호', price: 27500000, grade: '22기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승6호(초화장)', price: 26500000, grade: '매화2기+봉안12기', isRepresentative: false },
    { name: '가족봉안묘-경승6호(덤계장)', price: 37000000, grade: '44기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승7호', price: 23000000, grade: '20기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승8호', price: 15000000, grade: '8기봉안', isRepresentative: false },
    { name: '부부형봉안묘(평장형)', price: 7900000, grade: '2기봉안', isRepresentative: false },
    { name: '평장형 치연장', price: 9900000, grade: '6기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승9호(2018년신규출시)', price: 21000000, grade: '12기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승10호', price: 25000000, grade: '20기봉안', isRepresentative: false },
    { name: '가족봉안묘-경승11호', price: 25000000, grade: '16기봉안', isRepresentative: false }
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
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   총 ${rows봉안묘.length + rows매장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0604 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
