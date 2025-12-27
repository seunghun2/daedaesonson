const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0030');

if (!facility) {
    console.log('❌ park-0030 not found');
    process.exit(1);
}

// 제대로 분류
const rows매장묘 = [
    { name: '묘지사용료', price: 222122, grade: '㎡당', isRepresentative: true },
    { name: '단장형 사용료', price: 4398000, grade: '19.8㎡, 15년', isRepresentative: false },
    { name: '합장형 사용료', price: 5131000, grade: '23.1㎡, 15년', groupType: '소형', isRepresentative: false },
    { name: '합장형 사용료', price: 6597000, grade: '29.7㎡, 15년', groupType: '대형', isRepresentative: false },
    { name: '연간 관리비', price: 5364, grade: '', isRepresentative: false },
    { name: '단장형 재단운영관리비(15년)', price: 1593000, grade: '', isRepresentative: false },
    { name: '합장형 재단운영관리비(15년)', price: 1858500, grade: '소형', isRepresentative: false },
    { name: '합장형 재단운영관리비(15년)', price: 2389500, grade: '대형', isRepresentative: false }
];

const rows봉안묘 = [
    { name: '풍산8호', price: 6000000, grade: '6.6㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '2위', isRepresentative: true },
    { name: '풍산7호', price: 8000000, grade: '9.9㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '4위', isRepresentative: false },
    { name: '풍산6호', price: 11000000, grade: '13.2㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '8위', isRepresentative: false },
    { name: '풍산4호', price: 12000000, grade: '16.5㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '12위', isRepresentative: false },
    { name: '풍산3호', price: 16000000, grade: '23.1㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '24위', isRepresentative: false },
    { name: '풍산5호', price: 17000000, grade: '23.1㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '24위', isRepresentative: false },
    { name: '풍산2호', price: 22000000, grade: '33㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '36위', isRepresentative: false },
    { name: '풍산1호', price: 33000000, grade: '33㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '36위', isRepresentative: false },
    { name: '풍산특2호', price: 42000000, grade: '39.6㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '36위', isRepresentative: false },
    { name: '풍산특1호', price: 64000000, grade: '49.5㎡, 사용료,15년관리비, 조경비, 방습공사,봉안석물', groupType: '52위', isRepresentative: false }
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
            console.log(`✅ park-0030: ${facility.name}`);
            console.log(`   매장묘: ${rows매장묘.length}개 행 (묘지사용료, 단장/합장형)`);
            console.log(`   봉안묘: ${rows봉안묘.length}개 행 (풍산1~8호, 특1~2호)`);
            console.log(`\n   ❌ 제거: 합장형 카테고리 (봉안묘로 이동)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0030 (풍산공원묘원) 카테고리 재분류...\n');
update().then(() => console.log('\n✨ Done!'));
