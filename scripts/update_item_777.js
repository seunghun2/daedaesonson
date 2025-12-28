const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0077');

if (!facility) {
    console.log('❌ park-0077 not found');
    process.exit(1);
}

// Item 777 데이터 입력
const rows평장묘 = [
    { name: '재외동포묘역 이용료', price: 30000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: true },
    { name: '재외동포묘역 관리비', price: 170000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: false },
    { name: '재외동포묘역 이용료', price: 50000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: false },
    { name: '재외동포묘역 관리비', price: 250000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '재외동포묘역 이용료', price: 50000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: true },
    { name: '재외동포묘역 관리비', price: 250000, grade: '제주 출생 재외동포 및 배우자', isRepresentative: false }
];

const rows기타 = [
    { name: '이북도민묘역 이용료', price: 50000, grade: '제주 거주 이북도민 및 배우자', isRepresentative: true }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            평장묘: { unit: '원', rows: rows평장묘 },
            봉안묘: { unit: '원', rows: rows봉안묘 },
            기타: { unit: '원', rows: rows기타 }
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
            console.log(`✅ park-0077: ${facility.name} (Item 777)`);
            console.log(`   평장묘: ${rows평장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   기타: ${rows기타.length}개 행`);
            console.log(`   총 ${rows평장묘.length + rows봉안묘.length + rows기타.length}개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 777 (park-0077: 애향묘지) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
