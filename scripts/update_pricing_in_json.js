const fs = require('fs');
const path = require('path');

// facilities.json 경로
const facilitiesPath = path.join(__dirname, '../data/facilities.json');

// 1번 시설 가격 데이터
const pricingData = {
    'park-0001': {
        pricing: {
            'grave': {
                category: 'grave',
                categoryName: '매장묘',
                unit: '원',
                rows: [
                    {
                        name: '기본 매장묘 사용료',
                        price: 3000000,
                        description: '',
                        isRepresentative: false
                    },
                    {
                        name: '합장 매장묘 사용료',
                        price: 500000,
                        description: '',
                        isRepresentative: true
                    },
                    {
                        name: '대장작업비',
                        price: 1500000,
                        description: '',
                        isRepresentative: false
                    }
                ]
            }
        },
        priceRange: {
            min: 500000,
            max: 3000000
        }
    }
};

function updateFacilitiesJson() {
    console.log('🚀 facilities.json 업데이트 시작!\n');

    try {
        // 1. facilities.json 읽기
        const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));
        console.log(`📊 총 시설 수: ${facilities.length}\n`);

        // 2. 각 시설 업데이트
        let updateCount = 0;

        for (const [facilityId, data] of Object.entries(pricingData)) {
            const facility = facilities.find(f => f.id === facilityId);

            if (facility) {
                console.log(`✅ ${facilityId}: ${facility.name}\n`);

                // pricing 추가
                facility.pricing = data.pricing;
                facility.priceRange = data.priceRange;

                // 카테고리별 출력
                for (const [key, cat] of Object.entries(data.pricing)) {
                    console.log(`  💰 ${cat.categoryName}:`);
                    cat.rows.forEach(row => {
                        const star = row.isRepresentative ? '⭐' : '  ';
                        console.log(`    ${star} ${row.name}: ${row.price.toLocaleString()}${cat.unit}`);
                    });
                    console.log();
                }

                updateCount++;
            } else {
                console.log(`❌ ${facilityId}: 시설을 찾을 수 없습니다.\n`);
            }
        }

        // 3. 저장
        console.log('💾 저장 중...\n');
        fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf-8');

        console.log(`\n🎉 업데이트 완료! (${updateCount}개 시설)\n`);
        console.log('💡 웹에서 확인: http://localhost:3000/?id=park-0001\n');

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

// 실행
updateFacilitiesJson();
