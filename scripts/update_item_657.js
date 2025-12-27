const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0014');

if (!facility) {
    console.log('❌ park-0014 not found');
    process.exit(1);
}

// 33개 행을 카테고리별로 분류
const rows매장묘 = [
    { name: '사용료', price: 1950000, grade: '평당', isRepresentative: true },
    { name: '1년 관리비', price: 27000, grade: '평당', isRepresentative: false },
    { name: '매장묘(합장)', price: 37000000, grade: '사용료(13,650,000원,5년관리비945,000원)', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장 2기 자연장', price: 12500000, grade: '사용료(3,900,000원,5년관리비270,000원)', isRepresentative: true },
    { name: '평장 4기 자연장 (서향)', price: 17000000, grade: '사용료(4,875,000원,5년관리비337,500원)', isRepresentative: false },
    { name: '평장 4기 자연장 (동향)', price: 16000000, grade: '사용료(4,875,000원,5년관리비337,500원)', isRepresentative: false },
    { name: '평장 6기 자연장 (남향)', price: 25500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '평장 6기 자연장 (북향)', price: 21500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안 2기 탑형', price: 12500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: true },
    { name: '봉안 2기 탑형', price: 14500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 4기 탑형', price: 14500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 4기 탑형', price: 16500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안 4기 탑형', price: 17500000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안6위(자연장)', price: 19000000, grade: '사용료(7,800,000원,5년관리비540,000원)', isRepresentative: false },
    { name: '봉안6위(자연장)', price: 17000000, grade: '사용료(5,850,000원,5년관리비405,000원)', isRepresentative: false },
    { name: '봉안8위', price: 23500000, grade: '사용료(9,750,000원,5년관리비675,000원)', isRepresentative: false },
    { name: '봉안8위', price: 24500000, grade: '사용료(9,750,000원,5년관리비675,000원)', isRepresentative: false },
    { name: '봉안8위', price: 25500000, grade: '사용료(11,700,000원,5년관리비810,000원)', isRepresentative: false },
    { name: '봉안12위', price: 29500000, grade: '사용료(11,700,000원,5년관리비810,000원)', isRepresentative: false },
    { name: '봉안16위', price: 35000000, grade: '사용료(13,650,000원,5년관리비945,000원)', isRepresentative: false }
];

const rows봉안담 = [
    { name: '봉안담 개인단(1단)', price: 2000000, grade: '사용료(150만원,5년관리비12만원)', isRepresentative: true },
    { name: '봉안담 개인단(2단)', price: 3500000, grade: '사용료(150만원,5년관리비12만원)', isRepresentative: false },
    { name: '봉안담 개인단(3단)', price: 4000000, grade: '사용료(150만원,5년관리비12만원)', isRepresentative: false },
    { name: '봉안담 개인단(4단)', price: 4000000, grade: '사용료(150만원,5년관리비12만원)', isRepresentative: false },
    { name: '봉안담 개인단(5단)', price: 3500000, grade: '사용료(150만원,5년관리비12만원)', isRepresentative: false },
    { name: '봉안담 개인단(6단)', price: 1500000, grade: '사용료(130만원,5년관리비12만원)', isRepresentative: false },
    { name: '봉안담 부부단(1단)', price: 3500000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false },
    { name: '봉안담 부부단(2단)', price: 5000000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false },
    { name: '봉안담 부부단(3단)', price: 6500000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false },
    { name: '봉안담 부부단(4단)', price: 6500000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false },
    { name: '봉안담 부부단(5단)', price: 5000000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false },
    { name: '봉안담 부부단(6단)', price: 2500000, grade: '사용료(150만원,5년관리비24만원)', isRepresentative: false }
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
            봉안묘: { unit: '원', rows: rows봉안묘 },
            봉안담: { unit: '원', rows: rows봉안담 }
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
            console.log(`✅ Item 657 (park-0014): ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   봉안담: ${rows봉안담.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows평장묘.length + rows봉안묘.length + rows봉안담.length}개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Updating Item 657...\n');
update().then(() => console.log('\n✨ Done!'));
