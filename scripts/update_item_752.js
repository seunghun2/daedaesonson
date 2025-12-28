const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0028');

if (!facility) {
    console.log('❌ park-0028 not found');
    process.exit(1);
}

// 카테고리별로 구분
const rows매장묘 = [
    // 사용료
    { name: 'A형(구 4평형) 사용료', price: 1800000, grade: '공원조성비,석축및조경비,법인운영비 포함', isRepresentative: true },
    { name: 'B형(구 6평형) 사용료', price: 2700000, grade: '공원조성비,석축및조경비,법인운영비 포함', isRepresentative: false },
    { name: 'C형(구 8평형) 사용료', price: 3600000, grade: '공원조성비,석축및조경비,법인운영비 포함', isRepresentative: false },

    // 관리비
    { name: 'A형(구 4평형) 관리비', price: 660000, grade: '10년기준, 제초비 10년분 포함', isRepresentative: false },
    { name: 'B형(구 6평형) 관리비', price: 770000, grade: '10년기준, 제초비 10년분 포함', isRepresentative: false },
    { name: 'C형(구 8평형) 관리비', price: 880000, grade: '10년기준, 제초비 10년분 포함', isRepresentative: false },

    // 분양금액 (사용료+관리비+용역+석물)
    { name: 'A형(구 4평형) 분양금액', price: 4800000, grade: '사용료+관리비10년+용역비+석물 (합장시 100만원 추가)', isRepresentative: false },
    { name: 'B형(구 6평형) 분양금액', price: 6800000, grade: '사용료+관리비10년+용역비+석물 (합장시 100만원 추가)', isRepresentative: false },
    { name: 'C형(구 8평형) 분양금액', price: 8500000, grade: '사용료+관리비10년+용역비+석물 (합장시 100만원 추가)', isRepresentative: false },
    { name: 'D형(구 8평형 특수묘) 분양금액', price: 13500000, grade: '사용료+관리비10년+용역비+석물 (합장시 100만원 추가)', isRepresentative: false }
];

const rows평장묘 = [
    { name: '평장형봉안묘', price: 2700000, grade: '사용료+15년관리비+봉안석물 (합장시 100만원 추가)', isRepresentative: true },
    { name: '평장형납골묘 관리비', price: 495000, grade: '15년기준(1년 33,000원)', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '부부형봉안묘(A형-구4평형)', price: 5000000, grade: '사용료+10년관리비+봉안석물', isRepresentative: true },
    { name: '10기형 봉안묘(A형-구4평형)', price: 8000000, grade: '사용료+10년관리비+봉안석물 (평형/기수 변경 가능)', isRepresentative: false },
    { name: '개방형 봉안묘(18기형)', price: 13000000, grade: '사용료+10년관리비+봉안석물', isRepresentative: false },
    { name: '개방형 봉안묘(24기형)', price: 16000000, grade: '사용료+10년관리비+봉안석물', isRepresentative: false },
    { name: '24기형 봉안묘(구 16평형)', price: 25000000, grade: '사용료+10년관리비+봉안석물', isRepresentative: false },
    { name: '개방형납골묘(18기형) 관리비', price: 720000, grade: '10년 기준(1년 72,000원)', isRepresentative: false },
    { name: '개방형납골묘(24기형) 관리비', price: 960000, grade: '10년 기준(1년 96,000원)', isRepresentative: false }
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
            console.log(`✅ park-0028: ${facility.name} (Item 752)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 19개 행 (CSV 완전 반영)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 752 (park-0028: 화신공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
