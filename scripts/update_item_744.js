const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0009');

if (!facility) {
    console.log('❌ park-0009 not found');
    process.exit(1);
}

// 카테고리별로 구분
const rows매장묘 = [
    { name: '묘지사용료', price: 1500000, grade: '영구사용계약', isRepresentative: true },
    { name: '묘지사용료', price: 2500000, grade: '영구사용계약(전체묘역의 10%)', isRepresentative: false },
    { name: '묘지사용료', price: 3000000, grade: '영구사용계약(전체묘역의 7%)', isRepresentative: false },
    { name: '묘지사용료', price: 5000000, grade: '영구사용계약(전체묘역의 3%)', isRepresentative: false },
    { name: '묘지관리비', price: 13000, grade: '평당 관리비(년납)', isRepresentative: false },
    { name: '묘지관리비', price: 780000, grade: '평당 관리비(영구납)60년납 기준', isRepresentative: false },
    { name: '분묘설치비', price: 1300000, grade: '3평묘 (합장시 500,000 추가)', isRepresentative: false },
    { name: '분묘설치비', price: 1500000, grade: '4평묘 (합장시 500,000 추가)', isRepresentative: false },
    { name: '분묘설치비', price: 1700000, grade: '5평묘 (합장시 500,000 추가)', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '납골묘 장례비', price: 430000, grade: '매장식 (1위기준)', isRepresentative: true },
    { name: '납골묘 장례비', price: 300000, grade: '안치식 (1위기준)', isRepresentative: false },
    { name: '1위용 납골묘 석물', price: 1090000, grade: '', isRepresentative: false },
    { name: '2위용 납골묘 석물', price: 2040000, grade: '', isRepresentative: false },
    { name: '1위용 납골묘 설치공사비', price: 950000, grade: '', isRepresentative: false },
    { name: '2위용 납골묘 설치공사비', price: 1340000, grade: '', isRepresentative: false }
];

const rows자연장 = [
    { name: '화초장', price: 1200000, grade: '1위기준 연산홍 10주포함', isRepresentative: true },
    { name: '잔디장', price: 1000000, grade: '1위기준', isRepresentative: false },
    { name: '산골장', price: 600000, grade: '1위기준', isRepresentative: false }
];

const rows봉안당 = [
    { name: '선산납골당 사용료', price: 1000000, grade: '유연고/30년', isRepresentative: true },
    { name: '선산납골당 사용료', price: 300000, grade: '무연고/10년', isRepresentative: false }
];

const rows석물 = [
    { name: '기본형set', price: 1000000, grade: '비석,상석,향로석,화병1', isRepresentative: true },
    { name: 'A형둘레석(단분형)', price: 2300000, grade: '영주석,수연마', isRepresentative: false },
    { name: 'A형둘레석(합장형)', price: 2500000, grade: '영주석,수연마', isRepresentative: false },
    { name: 'B형둘레석', price: 1500000, grade: '영주석,수연마', isRepresentative: false },
    { name: 'C형둘레석', price: 1300000, grade: '영주석,수연마', isRepresentative: false },
    { name: '상석', price: 1000000, grade: '90cm,영주석,수연마,고급향로석', isRepresentative: false },
    { name: '비석', price: 600000, grade: '90cm,오석,수연마', isRepresentative: false },
    { name: '석등', price: 1000000, grade: '치등롱1쌍,영주석,수연마', isRepresentative: false },
    { name: '경계석', price: 75000, grade: '1M,영주석,무광', isRepresentative: false },
    { name: '화병', price: 100000, grade: '고급형,수연마', isRepresentative: false },
    { name: '해미석', price: 35000, grade: '1Kg', isRepresentative: false },
    { name: '와비(中)', price: 500000, grade: '45cm,오석,대석포함', isRepresentative: false },
    { name: '와비(大)', price: 700000, grade: '60cm,오석,대석포함', isRepresentative: false },
    { name: '각자비', price: 80000, grade: '기본 80,000원 추가시 별도', isRepresentative: false }
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
            봉안묘: { unit: '원', rows: rows봉안묘 },
            자연장: { unit: '원', rows: rows자연장 },
            봉안당: { unit: '원', rows: rows봉안당 },
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
            console.log(`✅ park-0009: ${facility.name} (Item 744)`);
            console.log(`   매장묘: ${rows매장묘.length}개 행`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행`);
            console.log(`   자연장: ${rows자연장.length}개 행`);
            console.log(`   봉안당: ${rows봉안당.length}개 행`);
            console.log(`   석물: ${rows석물.length}개 행`);
            console.log(`   총 34개 행 (CSV 완전 반영)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🚀 Item 744 (park-0009: 선산공원묘원) 데이터 입력...\n');
update().then(() => console.log('\n✨ Done!'));
