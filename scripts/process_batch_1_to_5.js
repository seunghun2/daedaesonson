const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

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

async function processImage(imageNum) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 [${imageNum}번] 이미지 분석 시작...`);
    console.log('='.repeat(60));

    try {
        // 이미지 파일 찾기
        const imagesDir = path.join(__dirname, '../archive5_images');
        const files = fs.readdirSync(imagesDir);
        const imageFile = files.find(f => f.startsWith(`${imageNum}.`));

        if (!imageFile) {
            throw new Error(`${imageNum}번 이미지를 찾을 수 없습니다`);
        }

        const imagePath = path.join(imagesDir, imageFile);
        console.log(`📁 파일: ${imageFile}\n`);

        // 1. 이미지 분석
        console.log('📤 Gemini Vision API 호출 중...');
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
        console.log(`✅ 분석 완료! 시설: ${analyzeResult.data.facility}\n`);

        // 2. 재분류
        const categorized = {
            grave: [],
            charnel: [],
            natural: [],
            cremation: [],
            other: []
        };

        let excludedCount = 0;

        analyzeResult.data.categories.forEach((category) => {
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

        const pricing = {};
        Object.entries(categorized).forEach(([key, items]) => {
            if (items.length > 0) {
                pricing[getCategoryName(key)] = {
                    category: key,
                    categoryName: getCategoryName(key),
                    unit: '원',
                    rows: items
                };
            }
        });

        // 3. DB 삽입
        console.log('📤 DB 삽입 중...');

        const insertPayload = {
            facilityId: `park-${String(imageNum).padStart(4, '0')}`,
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

        console.log('✅ 삽입 완료!');
        console.log(`   - 매장묘: ${categorized.grave.length}개`);
        console.log(`   - 봉안당: ${categorized.charnel.length}개`);
        console.log(`   - 수목장: ${categorized.natural.length}개`);
        console.log(`   - 기타: ${categorized.other.length}개`);
        console.log(`   - 제외: ${excludedCount}개\n`);

        return { success: true, facility: analyzeResult.data.facility };

    } catch (error) {
        console.error(`❌ [${imageNum}번] 에러:`, error.message);
        return { success: false, error: error.message };
    }
}

async function processBatch() {
    console.log('🚀 1~5번 이미지 일괄 처리 시작!\n');

    const results = [];

    for (let i = 1; i <= 5; i++) {
        const result = await processImage(i);
        results.push({ num: i, ...result });

        // API 부하 방지를 위한 짧은 대기
        if (i < 5) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 최종 결과');
    console.log('='.repeat(60));

    results.forEach(r => {
        if (r.success) {
            console.log(`✅ ${r.num}번: ${r.facility}`);
        } else {
            console.log(`❌ ${r.num}번: ${r.error}`);
        }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`\n총 ${successCount}/5개 성공!`);
    console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');
}

processBatch();
