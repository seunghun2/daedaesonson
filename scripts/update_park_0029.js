const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0029');

if (!facility) {
    console.log('❌ park-0029 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력 - 단장형/합장형 구분
const rows단장형 = [
    // 시신매장묘
    { name: '시신 매장묘 사용료', price: 1300000, grade: '묘지 작업비(간단,봉분비)', isRepresentative: true },
    { name: '매장묘 관리비', price: 10000, grade: '1년(평당)', isRepresentative: false },
    // 유골매장묘
    { name: '유골매장묘 사용료', price: 900000, grade: '묘지 작업비(간단,봉분비)', isRepresentative: false }
];

const rows합장형 = [
    // 시신매장묘
    { name: '시신매장묘 사용료', price: 1400000, grade: '묘지 작업비(간단,봉분비)', isRepresentative: true },
    { name: '매장묘 관리비', price: 10000, grade: '1년(평당)', isRepresentative: false },
    // 유골매장묘
    { name: '유골매장묘 사용료', price: 1000000, grade: '묘지 작업비(간단,봉분비)', isRepresentative: false }
];

const rows평장묘 = [
    { name: '가족평장묘지분양', price: 15000000, grade: '최대안치위수:8위', isRepresentative: true },
    { name: '가족평장안치비', price: 400000, grade: '1위안치비', isRepresentative: false },
    { name: '가족평장묘 관리비', price: 80000, grade: '1년', isRepresentative: false }
];

const rows부대시설 = [
    { name: '시설이용료', price: 100000, grade: '편의시설이', isRepresentative: true }
];

const rows석물 = [
    // 상석
    { name: '상석 2.5척', price: 550000, grade: '76cm x 51.5cm x 15cm', isRepresentative: true },
    { name: '상석 3.0척', price: 750000, grade: '90cm x 60cm x 18cm', isRepresentative: false },

    // 비석
    { name: '비석 와장묘', price: 650000, grade: '60cm x 43cm x 12cm', isRepresentative: false },
    { name: '비석 합장묘', price: 750000, grade: '70cm x 45cm x 12cm', isRepresentative: false },

    // 모대 단장
    { name: '1단모대 단장(4면비포함)', price: 750000, grade: '150cm x 213cm x 25cm', isRepresentative: false },
    { name: '2단모대 단장(4면비포함)', price: 1400000, grade: '151cm x 197cm x 50cm', isRepresentative: false },

    // 모대 합장
    { name: '1단모대 합장(4면비포함)', price: 850000, grade: '167cm x 213cm x 25cm', isRepresentative: false },
    { name: '2단모대 합장(4면비포함)', price: 1500000, grade: '167cm x 197cm x 50cm', isRepresentative: false },

    // 가족평장묘
    { name: '가족평장묘 묘판 비문(이름)', price: 350000, grade: '25cm x 7cm', isRepresentative: false },
    { name: '가족평장묘 비문', price: 400000, grade: '', isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            단장형: { unit: '원', rows: rows단장형 },
            합장형: { unit: '원', rows: rows합장형 },
            평장묘: { unit: '원', rows: rows평장묘 },
            부대시설: { unit: '원', rows: rows부대시설 },
            석물: { unit: '원', rows: rows석물 }
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
            console.log(`✅ park-0029: ${facility.name}`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   부대시설: ${rows부대시설.length}개 행`);
            console.log(`   석물: ${rows석물.length}개 행`);
            console.log(`   총 ${rows단장형.length + rows합장형.length + rows평장묘.length + rows부대시설.length + rows석물.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0029 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
