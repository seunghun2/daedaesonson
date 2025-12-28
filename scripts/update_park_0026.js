const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0026');

if (!facility) {
    console.log('❌ park-0026 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '묘지사용료', price: 1300000, grade: '3.3㎡기준(1평)/사용료 소멸', isRepresentative: true },
    { name: '관리비', price: 18000, grade: '3.3㎡기준(1평/1년)', isRepresentative: false },
    { name: '매장작업비', price: 1000000, grade: '1구매장기준', isRepresentative: false },
    { name: '금자 각인비용/비석금각재비용', price: 8000, grade: '외부업체 별도비(x8000, x17000)', isRepresentative: false },
    { name: '매장묘(2단)', price: 9000000, grade: '2기', isRepresentative: false },
    { name: '매장묘(3단)', price: 12000000, grade: '2기', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안가족묘-경승1', price: 40000000, grade: '40기', isRepresentative: true },
    { name: '봉안가족묘-경승2', price: 33000000, grade: '46기', isRepresentative: false },
    { name: '봉안가족묘-경승3', price: 22500000, grade: '20기', isRepresentative: false },
    { name: '봉안가족묘-경승4', price: 22500000, grade: '22기', isRepresentative: false },
    { name: '봉안가족묘-경승5', price: 21500000, grade: '매화+봉안12기', isRepresentative: false },
    { name: '봉안가족묘-경승6', price: 29000000, grade: '44기', isRepresentative: false },
    { name: '봉안가족묘-경승7', price: 16000000, grade: '20기', isRepresentative: false },
    { name: '봉안가족묘-경승8', price: 15000000, grade: '8기', isRepresentative: false },
    { name: '봉안가족묘-경승9', price: 16500000, grade: '12기', isRepresentative: false },
    { name: '부부형봉안모', price: 6500000, grade: '2기', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장형치유실', price: 6900000, grade: '6기', isRepresentative: true }
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
            console.log(`✅ park-0026: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows봉안묘.length + rows평장묘.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0026 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
