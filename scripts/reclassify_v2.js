const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 삭제할 항목 키워드 (부가서비스, 석물, 관리비 등)
const EXCLUDE_KEYWORDS = [
    '석물', '비석', '상석', '방석', '외비', '표석', '각자', '메탈포토',
    '식당', '식사', '천막', '대여', '나무', '전지', '조경',
    '작업비', '개장', '봉분', '수선', '설치비', '정리',
    '유골함', '외전', '영안당', '제사', '산신제', '장례',
    '사용료 반환', '관리비 반환', '건관리'
];

// 카테고리 분류 함수
function categorizeItem(itemName) {
    const name = itemName.toLowerCase();

    // 삭제 대상 체크
    for (const keyword of EXCLUDE_KEYWORDS) {
        if (name.includes(keyword.toLowerCase())) {
            return 'exclude';
        }
    }

    // 매장묘 - 평형, 평장, 매장 포함
    if (name.includes('매장') || name.includes('평형') || name.includes('평장') ||
        name.includes('묘') && !name.includes('봉안') && !name.includes('수목')) {
        return 'grave';
    }

    // 봉안당 - "봉안", "위" (1위, 2위 등), "납골"
    if (name.includes('봉안') || name.includes('납골') ||
        name.match(/\d+위/) || name.includes('정려') || name.includes('정원형')) {
        return 'charnel';
    }

    // 수목장 - 나무 이름들
    if (name.includes('수목') || name.includes('자연장') ||
        name.includes('플라타너스') || name.includes('아이리스') ||
        name.includes('클로버') || name.includes('다알리아') ||
        name.includes('경계석') || name.includes('철쭉')) {
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

async function reclassifyAndInsertV2() {
    console.log('🔄 정확한 가격 데이터 재분류 및 삽입 시작!\n');

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

        let excludedCount = 0;

        // 모든 카테고리의 모든 항목을 순회하며 재분류
        analyzedData.categories.forEach((category) => {
            console.log(`📂 처리 중: ${category.name} (${category.items.length}개)`);

            category.items.forEach((item) => {
                const newCategory = categorizeItem(item.name);

                if (newCategory === 'exclude') {
                    excludedCount++;
                    console.log(`  ❌ 삭제: ${item.name}`);
                    return;
                }

                categorized[newCategory].push({
                    name: item.name,
                    price: item.price,
                    description: item.description || '',
                    isRepresentative: item.isRepresentative || false
                });

                console.log(`  ✅ ${getCategoryName(newCategory)}: ${item.name}`);
            });
        });

        console.log(`\n🗑️  총 ${excludedCount}개 항목 제외됨\n`);

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
                console.log(`📋 ${getCategoryName(key)}: ${items.length}개 항목`);
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

reclassifyAndInsertV2();
