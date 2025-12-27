const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0074');

if (!facility) {
    console.log('❌ park-0074 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 2700000, grade: '1평기준', isRepresentative: true },
    { name: '관리비', price: 20000, grade: '1평/1년기준', isRepresentative: false },
    { name: '매장묘 (일체형)', price: 6517900, grade: '사용료/관리비|1년/석물일체/작업비|간지비|흙몰드 포함 (6,517,900원~46,733,900원)', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안묘 (일체형)', price: 9044000, grade: '사용료/관리비|1년/석물일체/작업비|간지비|흙몰드 포함 (9,044,000원~44,610,000원)', isRepresentative: true }
];

const rows평장묘 = [
    { name: '평장묘 (일체형)', price: 3680000, grade: '사용료/관리비|1년/석물일체/작업비|간지비|흙몰드 포함 (3,680,000원~29,206,800원)', isRepresentative: true }
];

const rows수목형 = [
    { name: '수목형 (일체형)', price: 3170000, grade: '사용료/관리비|1년/석물일체/작업비|간지비|흙몰드 포함 (3,170,000원~23,842,000원)', isRepresentative: true }
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
            평장묘: { unit: '원', rows: rows평장묘 },
            수목형: { unit: '원', rows: rows수목형 }
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
            console.log(`✅ park-0074: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   수목형: ${rows수목형.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0074 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
