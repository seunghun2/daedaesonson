const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0605');

if (!facility) {
    console.log('❌ park-0605 not found');
    process.exit(1);
}

// 이미지 기준으로 데이터 입력
const rows매장묘 = [
    { name: '사용료', price: 1577000, grade: '3.3m2', isRepresentative: true },
    { name: '관리비', price: 18400, grade: '3.3m2', isRepresentative: false },
    { name: '안치비 (강도 포함) 2시부터 화장', price: 300000, grade: '', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '봉안단 남한강 1호(특)', price: 25260000, grade: '24기 + 외석', groupType: '남한강', isRepresentative: true },
    { name: '봉안단 남한강 1호(특)', price: 22260000, grade: '24기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단 남한강 2호', price: 19480000, grade: '16기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단 남한강 신1호', price: 17080000, grade: '12기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단 남한강 신2호', price: 15180000, grade: '8기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단 남한강 신3호', price: 13280000, grade: '6기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단 남한강 신4호', price: 10120000, grade: '4기', groupType: '남한강', isRepresentative: false },
    { name: '봉안단지 충북 2단목 남한강 2호', price: 23142000, grade: '16기', groupType: '충북 2단목', isRepresentative: false },
    { name: '봉안단지 충북 2단목 남한강 신 1호', price: 20291000, grade: '12기', groupType: '충북 2단목', isRepresentative: false },
    { name: '봉안단지 충북 2단목 남한강 신 2호', price: 18033000, grade: '8기', groupType: '충북 2단목', isRepresentative: false },
    { name: '봉안단지 충북 2단목 남한강 신 4호', price: 12022000, grade: '4기', groupType: '충북 2단목', isRepresentative: false },
    { name: '설치비', price: 1500000, grade: '계약후 석물 설치', groupType: null, isRepresentative: false }
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
            console.log(`✅ park-0605: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행 (남한강 7 + 충북 2단목 4 + 설치비 1)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 park-0605 데이터 입력 (이미지 기준)...\n');
update().then(() => console.log('\n✨ Done!'));
