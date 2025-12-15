const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// Google Vision API 클라이언트 생성 (API 키 방식)
const client = new vision.ImageAnnotatorClient({
    apiKey: 'AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE'
});

async function analyzePriceImage(imagePath) {
    console.log(`\n🔍 이미지 분석 중: ${imagePath}\n`);

    try {
        // 이미지에서 텍스트 추출
        const [result] = await client.textDetection(imagePath);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            console.log('❌ 텍스트를 찾을 수 없습니다.\n');
            return null;
        }

        const fullText = detections[0].description;
        console.log('📄 추출된 텍스트:\n');
        console.log('─'.repeat(60));
        console.log(fullText);
        console.log('─'.repeat(60));
        console.log();

        // 가격 데이터 파싱
        const parsed = parsePriceData(fullText);

        console.log('✅ 파싱 결과:\n');
        console.log(JSON.stringify(parsed, null, 2));
        console.log();

        return parsed;

    } catch (error) {
        console.error('❌ 에러:', error.message);
        if (error.message.includes('API key not valid')) {
            console.log('\n💡 해결 방법: google-vision-key.json 파일이 필요합니다.\n');
        }
        return null;
    }
}

function parsePriceData(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const pricing = {};
    let currentCategory = '미분류';
    const rows = [];

    lines.forEach(line => {
        // 카테고리 감지
        if (line.includes('매장묘') && !line.match(/\d/)) {
            currentCategory = '매장묘';
            return;
        }
        if (line.includes('봉안') && !line.match(/\d/)) {
            currentCategory = '봉안';
            return;
        }
        if (line.includes('수목장') || line.includes('자연장')) {
            if (!line.match(/\d/)) {
                currentCategory = '수목장';
                return;
            }
        }

        // 가격 추출 패턴
        const pricePatterns = [
            /(\d{1,3}(?:,\d{3})*)\s*원/,  // "3,000,000원"
            /(\d+)\s*만\s*원/,             // "300만원"
            /(\d{1,3}(?:,\d{3})*)/         // "3000000"
        ];

        let price = null;
        let matchedPattern = null;

        for (const pattern of pricePatterns) {
            const match = line.match(pattern);
            if (match) {
                let numStr = match[1].replace(/,/g, '');
                price = parseInt(numStr);

                // "만원" 단위 처리
                if (line.includes('만')) {
                    price = price * 10000;
                }

                matchedPattern = pattern;
                break;
            }
        }

        if (price && price > 0) {
            // 항목명 추출 (가격 앞부분)
            let name = line;
            if (matchedPattern) {
                name = line.replace(matchedPattern, '').trim();
            }

            // 불필요한 특수문자 제거
            name = name.replace(/[●○■□▶▷※]/g, '').trim();

            if (name.length > 0 && name.length < 100) {
                rows.push({
                    name: name,
                    price: price,
                    description: '',
                    category: currentCategory
                });
            }
        }
    });

    // 카테고리별로 그룹화
    rows.forEach(row => {
        const cat = row.category || '미분류';
        if (!pricing[cat]) {
            pricing[cat] = {
                category: cat === '매장묘' ? 'grave' : cat === '봉안' ? 'charnel' : cat === '수목장' ? 'natural' : 'other',
                unit: '원',
                rows: []
            };
        }

        const { category, ...rowData } = row;
        pricing[cat].rows.push(rowData);
    });

    return pricing;
}

// 메인 실행
async function main() {
    console.log('🚀 Google Vision API 테스트 시작!\n');

    const testImage = path.join(__dirname, '../archive5_images/1.(재)낙원추모공원_price_info.png');

    if (!fs.existsSync(testImage)) {
        console.log(`❌ 이미지를 찾을 수 없습니다: ${testImage}\n`);
        return;
    }

    const result = await analyzePriceImage(testImage);

    if (result) {
        console.log('\n✅ 분석 완료!\n');
        console.log('💾 다음 단계: 이 데이터를 /admin/upload에 자동 입력\n');
    }
}

main();
