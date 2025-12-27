const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0014');

if (!facility) {
    console.log('❌ park-0014 not found');
    process.exit(1);
}

// 이미지 기준으로 전체 데이터 업데이트
const rows매장묘 = [
    { name: '매장묘, 봉안묘', price: 1950000, grade: '사용료(평당)', isRepresentative: true },
    { name: '매장묘, 봉안묘', price: 27000, grade: '1년 관리비(평당)', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장 2기 자연장', price: 14500000, grade: '사용료(3,900,000원,5년관리비270,000원)', isRepresentative: true },
    { name: '평장 4기 자연장 (서향)', price: 19000000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '평장 4기 자연장 (동향)', price: 18000000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 2기 탑형', price: 17500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 2기 탑형', price: 19500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 4기 탑형', price: 19500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 4기 탑형', price: 21500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '평장 6기 자연장 (남향)', price: 26500000, grade: '사용료(7,800,000원,5년관리비540,000원)', isRepresentative: false },
    { name: '평장 6기 자연장 (북향)', price: 24500000, grade: '사용료(7,800,000원,5년관리비540,000원)', isRepresentative: false },
    { name: '봉안6위(자연장)', price: 24000000, grade: '사용료(7,800,000원,5년관리비540,000원)', isRepresentative: false },
    { name: '봉안8위', price: 32500000, grade: '사용료(9,750,000원,5년관리비675,000원)', isRepresentative: false },
    { name: '봉안12위', price: 35500000, grade: '사용료(11,700,000원,5년관리비810,000원)', isRepresentative: false }
];

const rows봉안담 = [
    { name: '봉안담 개인단(1단)', price: 2500000, grade: '사용료(200만원,5년관리비135,000원)', isRepresentative: true },
    { name: '봉안담 개인단(2단)', price: 4000000, grade: '사용료(200만원,5년관리비135,000원)', isRepresentative: false },
    { name: '봉안담 개인단(3단)', price: 4500000, grade: '사용료(200만원,5년관리비135,000원)', isRepresentative: false },
    { name: '봉안담 개인단(4단)', price: 4500000, grade: '사용료(200만원,5년관리비135,000원)', isRepresentative: false },
    { name: '봉안담 개인단(5단)', price: 4000000, grade: '사용료(200만원,5년관리비135,000원)', isRepresentative: false },
    { name: '봉안담 개인단(6단)', price: 2000000, grade: '사용료(180만원,5년관리비135,000원)', isRepresentative: false },
    { name: '봉안담 부부단(1단)', price: 4000000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false },
    { name: '봉안담 부부단(2단)', price: 5500000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false },
    { name: '봉안담 부부단(3단)', price: 7000000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false },
    { name: '봉안담 부부단(4단)', price: 7000000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false },
    { name: '봉안담 부부단(5단)', price: 5500000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false },
    { name: '봉안담 부부단(6단)', price: 3000000, grade: '사용료(200만원,5년관리비271만원)', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안16위', price: 39000000, grade: '사용료(13,650,000원,5년관리비945,000원)', isRepresentative: true },
    { name: '봉안8위(자연장)', price: 30000000, grade: '사용료(9,750,000원,5년관리비675,000원)', isRepresentative: false }
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
            평장묘: { unit: '원', rows: rows평장묘 },
            봉안담: { unit: '원', rows: rows봉안담 },
            봉안묘: { unit: '원', rows: rows봉안묘 }
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
            console.log(`✅ park-0014 (Item 657): ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   봉안담: ${rows봉안담.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows평장묘.length + rows봉안담.length + rows봉안묘.length}개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0014 (자하연 일산) 전체 데이터 업데이트 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
