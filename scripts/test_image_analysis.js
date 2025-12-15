const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function analyzeImage() {
    console.log('🔍 이미지 분석 시작...\n');

    try {
        const imagePath = path.join(__dirname, '../archive5_images/1.(재)낙원추모공원_price_info.png');

        if (!fs.existsSync(imagePath)) {
            throw new Error('이미지 파일을 찾을 수 없습니다: ' + imagePath);
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));

        console.log('📤 API 호출 중...\n');

        const response = await fetch('http://localhost:3000/api/analyze-pricing-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const result = await response.json();

        console.log('✅ 분석 완료!\n');
        console.log(JSON.stringify(result, null, 2));

        // 결과를 파일로 저장
        const outputPath = path.join(__dirname, '../data/analyzed_pricing_1.json');
        fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2), 'utf-8');
        console.log(`\n💾 결과 저장: ${outputPath}`);

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

analyzeImage();
