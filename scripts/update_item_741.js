const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0007');

if (!facility) {
    console.log('❌ park-0007 not found');
    process.exit(1);
}

// CSV 기준으로 단장묘, 합장묘(1회차), 봉안묘로 분류하고 groupType으로 3년이상/3년미만/관외 구분
const rows단장형 = [
    // 3년이상
    { name: '사용료', price: 1419000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: true },
    { name: '관리비', price: 552000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '조경비', price: 30000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '기타비용', price: 2050000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    // 3년미만
    { name: '사용료', price: 3618000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '관리비', price: 1407000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '조경비', price: 30000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '기타비용', price: 2050000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    // 관외
    { name: '관리비', price: 2623000, grade: '30년', groupType: '관외 (예산군 이외)', isRepresentative: false }
];

const rows합장형 = [
    // 1회차1구 - 3년이상
    { name: '1회차1구 사용료', price: 2394000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: true },
    { name: '1회차1구 관리비', price: 930000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '1회차1구 조경비', price: 30000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '1회차1구 기타비용', price: 2215000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    // 1회차1구 - 3년미만
    { name: '1회차1구 사용료', price: 6103000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차1구 관리비', price: 2371000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차1구 조경비', price: 30000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차1구 기타비용', price: 2215000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    // 1회차1구 - 관외
    { name: '1회차1구 관리비', price: 3831000, grade: '30년', groupType: '관외 (예산군 이외)', isRepresentative: false },

    // 1회차2구 - 3년이상
    { name: '1회차2구 사용료', price: 2394000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '1회차2구 관리비', price: 930000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '1회차2구 조경비', price: 30000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '1회차2구 기타비용', price: 2290000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    // 1회차2구 - 3년미만
    { name: '1회차2구 사용료', price: 6103000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차2구 관리비', price: 2371000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차2구 조경비', price: 30000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '1회차2구 기타비용', price: 2290000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    // 1회차2구 - 관외
    { name: '1회차2구 관리비', price: 3831000, grade: '30년', groupType: '관외 (예산군 이외)', isRepresentative: false },

    // 2회차
    { name: '2회차 1구 기타비용', price: 715000, grade: '', groupType: null, isRepresentative: false }
];

const rows봉안묘 = [
    // 3년이상
    { name: '가족봉안묘 사용료', price: 2394000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: true },
    { name: '가족봉안묘 관리비', price: 930000, grade: '30년', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '가족봉안묘 조경비', price: 30000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    { name: '가족봉안묘 기타비용', price: 5460000, grade: '', groupType: '3년이상 주민등록', isRepresentative: false },
    // 3년미만
    { name: '가족봉안묘 사용료', price: 7180000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '가족봉안묘 관리비', price: 2790000, grade: '30년', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '가족봉안묘 조경비', price: 30000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    { name: '가족봉안묘 기타비용', price: 5460000, grade: '', groupType: '6월~3년미만 주민등록', isRepresentative: false },
    // 관외
    { name: '가족봉안묘 사용료', price: 9481000, grade: '30년', groupType: '관외 (예산군 이외)', isRepresentative: false },
    { name: '가족봉안묘 관리비', price: 3879000, grade: '30년', groupType: '관외 (예산군 이외)', isRepresentative: false },
    { name: '가족봉안묘 조경비', price: 30000, grade: '', groupType: '관외 (예산군 이외)', isRepresentative: false },
    { name: '가족봉안묘 기타비용', price: 5460000, grade: '', groupType: '관외 (예산군 이외)', isRepresentative: false }
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
            console.log(`✅ park-0007: ${facility.name} (Item 741)`);
            console.log(`   단장형: ${rows단장형.length}개 행`);
            console.log(`   합장형: ${rows합장형.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   총 40개 행 (CSV 완전 반영)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 741 (park-0007: 예산군추모공원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
