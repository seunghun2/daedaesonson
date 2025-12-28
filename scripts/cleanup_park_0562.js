const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0562');

if (!facility) {
    console.log('❌ park-0562 not found');
    process.exit(1);
}

// 카테고리별로 재배치
const rows매장묘 = [
    { name: '혼합묘(매장+봉안16위)', price: 36745000, grade: '', isRepresentative: true }
];

const rows평장묘 = [
    { name: '가족평장묘(4위형)', price: 14795000, grade: '', isRepresentative: true },
    { name: '수목형평장묘(2위형)', price: 15339000, grade: '', isRepresentative: false },
    { name: '수목형평장묘(4위형)', price: 21109000, grade: '', isRepresentative: false },
    { name: '가족평장묘(8위형)', price: 21562000, grade: '', isRepresentative: false },
    { name: '가족평장묘(8위형B)', price: 22055000, grade: '', isRepresentative: false },
    { name: '가족평장묘(12위형B)', price: 34450000, grade: '', isRepresentative: false }
];

const rows수목형 = [
    { name: '수목장(1위형)', price: 2764000, grade: '', isRepresentative: true },
    { name: '수목장(6위형)', price: 15088000, grade: '', isRepresentative: false },
    { name: '수목장(12위형)', price: 23501000, grade: '', isRepresentative: false }
];

const rows봉안담 = [
    { name: '봉안담(1위형)', price: 3634000, grade: '', isRepresentative: true },
    { name: '봉안담(2위형)', price: 5670000, grade: '', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '개인봉안묘(1위형)', price: 9344000, grade: '', isRepresentative: true },
    { name: '개인봉안묘(2위형)', price: 10567000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(6위형)', price: 13049000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(4위형B)', price: 16255000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(4위형C)', price: 16831000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(8위형)', price: 20403000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(8위형C)', price: 21929000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(8위형B)', price: 22665000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(12위형A고급)', price: 25532000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(16위형고급)', price: 32332000, grade: '', isRepresentative: false },
    { name: '가족봉안묘(24위형고급)', price: 34256000, grade: '', isRepresentative: false }
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
            수목형: { unit: '원', rows: rows수목형 },
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
            console.log(`✅ park-0562: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   수목형: ${rows수목형.length}개 행`);
            console.log(`   봉안담: ${rows봉안담.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`\n   재구성: 카테고리 정리 (봉안당 제거)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0562 카테고리 재배치...\n');
update().then(() => console.log('\n✨ Done!'));
