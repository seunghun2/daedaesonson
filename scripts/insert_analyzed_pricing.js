const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function insertAnalyzedPricing() {
    console.log('🚀 분석된 가격 데이터 DB 삽입 시작!\n');

    try {
        // 1. 분석된 JSON 읽기
        const jsonPath = path.join(__dirname, '../data/analyzed_pricing_1.json');
        const analyzedData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        console.log('📊 분석된 데이터:', analyzedData.facility);
        console.log(`   카테고리 수: ${analyzedData.categories.length}\n`);

        // 2. API 형식으로 변환
        const pricing = {};

        analyzedData.categories.forEach((category, index) => {
            const categoryKey = category.name;

            pricing[categoryKey] = {
                category: categoryKey.toLowerCase().replace(/\s+/g, '_'),
                categoryName: category.name,
                unit: '원',
                rows: category.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    description: item.description || '',
                    isRepresentative: item.isRepresentative || false
                }))
            };

            console.log(`✅ ${category.name}: ${category.items.length}개 항목`);
        });

        const payload = {
            facilityId: 'park-0001',
            pricing: pricing
        };

        console.log('\n📤 API 호출 중...\n');

        // 3. API 호출
        const response = await fetch('http://localhost:3000/api/bulk-insert-pricing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const result = await response.json();

        console.log('✅ 삽입 완료!\n');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

insertAnalyzedPricing();
