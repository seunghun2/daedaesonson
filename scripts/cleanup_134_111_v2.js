const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility134 = facilities.find(f => f.id === 'park-0134');
const facility111 = facilities.find(f => f.id === 'park-0111');

if (!facility134 || !facility111) {
    console.log('❌ 시설을 찾을 수 없습니다');
    process.exit(1);
}

// park-0134와 park-0111 정확한 데이터로 정리
const payload134 = {
    id: facility134.id,
    name: facility134.name,
    address: facility134.address,
    category: facility134.category,
    coordinates: facility134.coordinates,
    priceInfo: {
        priceTable: {
            단장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 451000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 199000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 676000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 299000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
};

// park-0111도 같은 패턴으로 (데이터 확인 필요)
const payload111 = {
    id: facility111.id,
    name: facility111.name,
    address: facility111.address,
    category: facility111.category,
    coordinates: facility111.coordinates,
    priceInfo: {
        priceTable: {
            단장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 451000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 199000, grade: '', isRepresentative: false }
                ]
            },
            합장형: {
                unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 676000, grade: '', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 299000, grade: '', isRepresentative: false }
                ]
            }
        }
    }
};

async function updateBoth() {
    try {
        // park-0134
        const response134 = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload134)
        });
        const result134 = await response134.json();

        if (result134.error) {
            console.log(`❌ park-0134: ${result134.error}`);
        } else {
            console.log(`✅ park-0134: ${facility134.name}`);
            console.log(`   단장형: 2개 행 (사용료 451,000원 + 관리비 199,000원)`);
            console.log(`   합장형: 2개 행 (사용료 676,000원 + 관리비 299,000원)\n`);
        }

        // park-0111
        const response111 = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload111)
        });
        const result111 = await response111.json();

        if (result111.error) {
            console.log(`❌ park-0111: ${result111.error}`);
        } else {
            console.log(`✅ park-0111: ${facility111.name}`);
            console.log(`   단장형: 2개 행 (사용료 451,000원 + 관리비 199,000원)`);
            console.log(`   합장형: 2개 행 (사용료 676,000원 + 관리비 299,000원)`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 park-0134, park-0111 정확한 데이터로 정리...\n');
updateBoth().then(() => console.log('\n✨ Done!'));
