const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-0872');

if (!facility) {
    console.log('❌ park-0872 not found');
    process.exit(1);
}

const payload = {
    id: facility.id,
    name: facility.name,
    address: facility.address,
    category: facility.category,
    coordinates: facility.coordinates,
    priceInfo: {
        priceTable: {
            봉안당: {
                unit: '원',
                rows: [{
                    name: '15년 사용',
                    price: 800000,
                    grade: '15년 사용료+관리비',
                    isRepresentative: true
                }]
            }
        }
    }
};

async function fixCategory() {
    try {
        const response = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            console.log(`❌ 수정 실패: ${result.error}`);
        } else {
            console.log(`✅ Item 528 (park-0872): 도봉구추모의집`);
            console.log('   "제외됨" → "봉안당"으로 이동 완료');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

console.log('🔧 Fixing Item 528 category...\n');
fixCategory().then(() => console.log('\n✨ Done!'));
