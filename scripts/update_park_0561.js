const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0561');

if (!facility) {
    console.log('❌ park-0561 not found');
    process.exit(1);
}

// 이미지 기준으로 개인/부부 그룹화
const rows봉안당 = [
    // 개인 (1위)
    { name: '1단 (최고단)', price: 1000000, grade: '1(위)', groupType: '개인', isRepresentative: true },
    { name: '2단', price: 2500000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '3단', price: 3500000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '4단', price: 5000000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '5단', price: 5000000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '6단', price: 5000000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '7단', price: 3000000, grade: '1(위)', groupType: '개인', isRepresentative: false },
    { name: '8단 (최고단)', price: 2500000, grade: '1(위)', groupType: '개인', isRepresentative: false },

    // 부부 (1-2위)
    { name: '1단 (최고단)', price: 2000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '2단', price: 5000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '3단', price: 7000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '4단', price: 10000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '5단', price: 10000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '6단', price: 10000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '7단', price: 6000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },
    { name: '8단 (최고단)', price: 5000000, grade: '1-2(위)', groupType: '부부', isRepresentative: false },

    // 유골보관단
    { name: '1단 (유골보관단)', price: 1500000, grade: '1(위)', groupType: '유골보관단', isRepresentative: false },
    { name: '1단 (유골보관단)', price: 2000000, grade: '1-2(위)', groupType: '유골보관단', isRepresentative: false },

    // 관리비
    { name: '관리비 (10년선납)', price: 50000, grade: '단/1년', groupType: null, isRepresentative: false }
];

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            봉안당: { unit: '원', rows: rows봉안당 }
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
            console.log(`✅ park-0561: ${facility.name}`);
            console.log(`   봉안당: ${rows봉안당.length}개 행`);
            console.log(`   그룹: 개인(8) + 부부(8) + 유골보관단(2) + 관리비(1)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0561 개인/부부 그룹화...\n');
update().then(() => console.log('\n✨ Done!'));
