const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function processImage2() {
    console.log('🔍 2번 이미지 분석 시작...\n');

    try {
        const imagePath = path.join(__dirname, '../archive5_images/2.(재)실로암공원묘원_price_info.png');

        if (!fs.existsSync(imagePath)) {
            throw new Error('이미지 파일을 찾을 수 없습니다: ' + imagePath);
        }

        // 1. 이미지 분석
        console.log('📤 이미지 분석 API 호출 중...\n');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));

        const analyzeRes = await fetch('http://localhost:3000/api/analyze-pricing-image', {
            method: 'POST',
            body: formData,
        });

        if (!analyzeRes.ok) {
            const error = await analyzeRes.text();
            throw new Error(`분석 API Error: ${analyzeRes.status} - ${error}`);
        }

        const analyzeResult = await analyzeRes.json();
        console.log('✅ 분석 완료!\n');
        console.log(`   시설: ${analyzeResult.data.facility}`);
        console.log(`   카테고리 수: ${analyzeResult.data.categories.length}\n`);

        // 결과 저장
        const outputPath = path.join(__dirname, '../data/analyzed_pricing_2.json');
        fs.writeFileSync(outputPath, JSON.stringify(analyzeResult.data, null, 2), 'utf-8');

        // 2. 재분류
        const categorized = {
            grave: [],
            charnel: [],
            natural: [],
            cremation: [],
            other: []
        };

        const EXCLUDE_KEYWORDS = [
            '석물', '비석', '상석', '방석', '외비', '표석', '각자', '메탈포토',
            '식당', '식사', '천막', '대여', '나무', '전지', '조경',
            '작업비', '개장', '봉분', '수선', '설치비', '정리',
            '유골함', '외전', '영안당', '제사', '산신제', '장례',
            '사용료 반환', '관리비 반환', '건관리'
        ];

        function categorizeItem(itemName) {
            const name = itemName.toLowerCase();

            for (const keyword of EXCLUDE_KEYWORDS) {
                if (name.includes(keyword.toLowerCase())) return 'exclude';
            }

            if (name.includes('매장') || name.includes('평형') || name.includes('평장') ||
                name.includes('묘') && !name.includes('봉안') && !name.includes('수목')) {
                return 'grave';
            }

            if (name.includes('봉안') || name.includes('납골') ||
                name.match(/\d+위/) || name.includes('정려') || name.includes('정원형')) {
                return 'charnel';
            }

            if (name.includes('수목') || name.includes('자연장') ||
                name.includes('플라타너스') || name.includes('아이리스') ||
                name.includes('클로버') || name.includes('다알리아') ||
                name.includes('경계석') || name.includes('철쭉')) {
                return 'natural';
            }

            if (name.includes('화장')) return 'cremation';
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

        let excludedCount = 0;

        analyzeResult.data.categories.forEach((category) => {
            console.log(`📂 처리 중: ${category.name} (${category.items.length}개)`);

            category.items.forEach((item) => {
                const newCategory = categorizeItem(item.name);

                if (newCategory === 'exclude') {
                    excludedCount++;
                    return;
                }

                categorized[newCategory].push({
                    name: item.name,
                    price: item.price,
                    description: item.description || ''
                });
            });
        });

        console.log(`\n🗑️  총 ${excludedCount}개 항목 제외됨\n`);

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

        // 3. DB 삽입
        console.log('\n📤 DB 삽입 API 호출 중...\n');

        const insertPayload = {
            facilityId: 'park-0002',
            pricing: pricing
        };

        const insertRes = await fetch('http://localhost:3000/api/bulk-insert-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(insertPayload)
        });

        if (!insertRes.ok) {
            const error = await insertRes.text();
            throw new Error(`삽입 API Error: ${insertRes.status} - ${error}`);
        }

        const insertResult = await insertRes.json();

        console.log('✅ 삽입 완료!\n');
        console.log(JSON.stringify(insertResult, null, 2));
        console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

processImage2();
