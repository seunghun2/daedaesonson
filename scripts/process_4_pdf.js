const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function processImage4PDF() {
    console.log('🔍 4번 이미지 PDF로 재시도...\n');

    try {
        const pdfPath = path.join(__dirname, '../archive5/4.재단법인울산공원묘원_price_info.pdf');

        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF 파일을 찾을 수 없습니다');
        }

        // PDF 분석 (기존 analyze-pdf API 사용)
        console.log('📤 PDF 분석 API 호출 중...\n');
        const formData = new FormData();
        formData.append('file', fs.createReadStream(pdfPath));

        const analyzeRes = await fetch('http://localhost:3000/api/analyze-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!analyzeRes.ok) {
            const error = await analyzeRes.text();
            throw new Error(`분석 API Error: ${analyzeRes.status} - ${error}`);
        }

        const data = await analyzeRes.json();
        console.log('✅ 분석 완료!\n');
        console.log(`   시설: ${data.facilityName}\n`);

        // products를 카테고리별로 재구성
        const pricing = {};

        if (data.products) {
            Object.entries(data.products).forEach(([categoryName, categoryData]) => {
                // 매장묘, 봉안당, 수목장 등으로 분류
                let category;
                const name = categoryName.toLowerCase();

                if (name.includes('매장') || name.includes('묘지')) {
                    category = 'grave';
                } else if (name.includes('봉안')) {
                    category = 'charnel';
                } else if (name.includes('수목') || name.includes('자연')) {
                    category = 'natural';
                } else {
                    category = 'other';
                }

                const standardName = {
                    'grave': '매장묘',
                    'charnel': '봉안당',
                    'natural': '수목장',
                    'other': '기타'
                }[category];

                if (!pricing[standardName]) {
                    pricing[standardName] = {
                        category: category,
                        categoryName: standardName,
                        unit: '원',
                        rows: []
                    };
                }

                if (categoryData.rows) {
                    categoryData.rows.forEach(row => {
                        pricing[standardName].rows.push({
                            name: row.name,
                            price: row.price,
                            description: row.grade || ''
                        });
                    });
                }
            });
        }

        // DB 삽입
        console.log('📤 DB 삽입 중...\n');
        const insertPayload = {
            facilityId: 'park-0004',
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

processImage4PDF();
