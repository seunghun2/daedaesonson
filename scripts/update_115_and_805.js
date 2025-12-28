const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility115 = facilities.find(f => f.id === 'park-0115');
const facility71 = facilities.find(f => f.id === 'park-0071');

if (!facility115 || !facility71) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// park-0115: 단장형/합장형으로 재분류
const payload115 = {
    id: facility115.id,
    name: facility115.name,
    address: facility115.address,
    category: facility115.category,
    coordinates: facility115.coordinates,
    priceInfo: {
        priceTable: {
            단장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 60000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 30000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 90000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 45000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
};

// park-0071: Item 805 데이터 입력
const payload71 = {
    id: facility71.id,
    name: facility71.name,
    address: facility71.address,
    category: facility71.category,
    coordinates: facility71.coordinates,
    priceInfo: {
        priceTable: {
            매장묘: {
                unit: '원',
                rows: [
                    { name: '묘지사용료', price: 800000, grade: '평당가(3.3㎡/평)', isRepresentative: true },
                    { name: '관리비', price: 11000, grade: '년/평당가(3.3㎡/평)', isRepresentative: false }
                ]
            },
            봉안묘: {
                unit: '원',
                rows: [
                    { name: '봉안묘(부부단)', price: 6900000, grade: '시설비 및 사용료(관리비,각자비별도)', isRepresentative: true }
                ]
            },
            평장묘: {
                unit: '원',
                rows: [
                    { name: '평장묘(1기)', price: 3000000, grade: '시설비 및 관리비5년선납, 봉안비', isRepresentative: true }
                ]
            }
        }
    }
};

async function updateBoth() {
    try {
        // park-0115 정리
        const response115 = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload115)
        });
        const result115 = await response115.json();

        if (result115.error) {
            console.log(`❌ park-0115: ${result115.error}`);
        } else {
            console.log(`✅ park-0115: ${facility115.name} (정리)`);
            console.log(`   단장형: 2개 행`);
            console.log(`   합장형: 2개 행\n`);
        }

        // park-0071 업데이트
        const response71 = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload71)
        });
        const result71 = await response71.json();

        if (result71.error) {
            console.log(`❌ park-0071: ${result71.error}`);
        } else {
            console.log(`✅ park-0071: ${facility71.name} (Item 805)`);
            console.log(`   매장묘: 2개 행`);
            console.log(`   봉안묘: 1개 행`);
            console.log(`   평장묘: 1개 행`);
            console.log(`   총 4개 행`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0115 정리 + Item 805 → park-0071 업데이트...\n');
updateBoth().then(() => console.log('\n✨ Done!'));
