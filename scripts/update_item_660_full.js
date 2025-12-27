const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0013');

if (!facility) {
    console.log('❌ park-0013 not found');
    process.exit(1);
}

// CSV 기준으로 전체 27개 행 분류
const rows매장묘 = [
    { name: '매장묘(단분)', price: 14100000, grade: '단분/묘지사용료:평당 200만원/매장작업비150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: true },
    { name: '매장묘(합장)', price: 18300000, grade: '합장/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: false },
    { name: '매장묘(쌍분)', price: 22500000, grade: '쌍분/묘지사용료:평당 200만원/매장작업비 150만원포함/5년관리비포함/석물비별도/각자료별도', isRepresentative: false },
    { name: '매장묘,평장묘 관리비', price: 20000, grade: '평당관리비 : 20,000원/년 (물가상승률 등에 따라 인상될 수 있음)', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장2기-4기', price: 8900000, grade: '2기평장/묘지사용료:평당200만원/평장작업비: 50만원/석물비별도/5년관리비포함/각자비별도', isRepresentative: true },
    { name: '평장8기', price: 13100000, grade: '8기평장/묘지사용료:평당200만원/평장작업비 50만원/석물비별도/5년관리비포함/각자비별도', isRepresentative: false }
];

const rows봉안담 = [
    { name: '봉안담(개인단)-1단', price: 2160000, grade: '1단 사용료 2,000,000원 / 5년관리비포함', isRepresentative: true },
    { name: '봉안담(개인단)-2단', price: 3160000, grade: '2단 사용료 3,000,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(개인단)-3단', price: 4160000, grade: '3단 사용료 4,000,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(개인단)-4단', price: 5260000, grade: '4단 사용료 5,100,000원/ 5년 관리비 포함', isRepresentative: false },
    { name: '봉안담(개인단)-5단', price: 5760000, grade: '5단 사용료 5,600,000원/ 5년 관리비 포함', isRepresentative: false },
    { name: '봉안담(개인단)-6단', price: 4660000, grade: '6단 사용료 4,500,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(개인단)-7단', price: 3660000, grade: '7단 사용료 3,500,000원 / 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(개인단)-8단', price: 2660000, grade: '8단 사용료 2,500,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-1단', price: 3355000, grade: '1단 사용료 3,100,000원/ 5년관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-2단', price: 5455000, grade: '2단 사용료 5,200,000원 / 5년관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-3단', price: 6855000, grade: '3단 사용료 6,600,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-4단', price: 8155000, grade: '4단 사용료 7,900,000원 /5년 관리비 포함', isRepresentative: false },
    { name: '봉안담(부부단)-5단', price: 8555000, grade: '5단 사용료 8,300,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-6단', price: 7555000, grade: '6단 사용료 7,300,000원 / 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-7단', price: 6455000, grade: '7단 사용료 6,200,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(부부단)-8단', price: 4355000, grade: '8단 사용료 4,100,000원/ 5년 관리비포함', isRepresentative: false },
    { name: '봉안담(개인단) 관리비', price: 32000, grade: '32,000원/년 (물가상승률 등에 따라 인상될 수 있음)', isRepresentative: false },
    { name: '봉안담(부부단) 관리비', price: 51000, grade: '51,000원/년 (물가상승률 등에 따라 인상될 수 있음)', isRepresentative: false }
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
            console.log(`✅ Item 660 (park-0013): ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   봉안담: ${rows봉안담.length}개 행`);
            console.log(`   총 ${rows매장묘.length + rows평장묘.length + rows봉안담.length}개 행 업데이트 완료`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 660 전체 데이터 업데이트 (CSV 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
