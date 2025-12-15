const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 카테고리 분류 함수
function categorizeItem(itemName) {
    const name = itemName.toLowerCase();

    // 매장묘
    if (name.includes('매장') || name.includes('묘지') || name.includes('단장') || name.includes('합장')) {
        return 'grave';
    }

    // 봉안당/봉안묘
    if (name.includes('봉안') || name.includes('납골') || name.includes('안치')) {
        return 'charnel';
    }

    // 수목장
    if (name.includes('수목') || name.includes('자연장') || name.includes('잔디') || name.includes('화초')) {
        return 'natural';
    }

    // 화장
    if (name.includes('화장')) {
        return 'cremation';
    }

    // 기타
    return 'other';
}

function getCategoryName(category) {
    const names = {
        'grave': '매장묘',
        'charnel': '봉안당',
        'natural': '수목장',
        'cremation': '화장',
        'other': '기타'
    };
    return names[category] || '기타';
}

async function reclassifyAndInsert() {
    console.log('🔄 가격 데이터 재분류 및 삽입 시작!\n');

    try {
        // 1. 분석된 JSON 읽기
        const jsonPath = path.join(__dirname, '../data/analyzed_pricing_1.json');
        const analyzedData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        console.log('📊 원본 데이터:', analyzedData.facility);
        console.log(`   카테고리 수: ${analyzedData.categories.length}\n`);

        // 2. 재분류
        const categorized = {
            grave: [],
            charnel: [],
            natural: [],
            cremation: [],
            other: []
        };

        // 모든 카테고리의 모든 항목을 순회하며 재분류
        analyzedData.categories.forEach((category) => {
            console.log(`📂 처리 중: ${category.name} (${category.items.length}개)`);

            category.items.forEach((item) => {
                const newCategory = categorizeItem(item.name);
                categorized[newCategory].push({
                    name: item.name,
                    price: item.price,
                    description: item.description || '',
                    isRepresentative: item.isRepresentative || false
                });
            });
        });

        // 3. API 형식으로 변환
        const pricing = {};

        Object.entries(categorized).forEach(([key, items]) => {
            if (items.length > 0) {
                pricing[getCategoryName(key)] = {
                    category: key,
                    categoryName: getCategoryName(key),
                    unit: '원',
                    rows: items
                };
                console.log(`✅ ${getCategoryName(key)}: ${items.length}개 항목`);
            }
        });

        const payload = {
            facilityId: 'park-0001',
            pricing: pricing
        };

        console.log('\n📤 API 호출 중...\n');

        // 4. API 호출
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

reclassifyAndInsert();
