const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function processPDF(pdfNum) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 [${pdfNum}번] PDF 분석 시작...`);
    console.log('='.repeat(60));

    try {
        // PDF 파일 찾기
        const pdfDir = path.join(__dirname, '../archive5');
        const files = fs.readdirSync(pdfDir);
        const pdfFile = files.find(f => f.startsWith(`${pdfNum}.`) && f.endsWith('.pdf'));

        if (!pdfFile) {
            throw new Error(`${pdfNum}번 PDF를 찾을 수 없습니다`);
        }

        const pdfPath = path.join(pdfDir, pdfFile);
        console.log(`📁 파일: ${pdfFile}\n`);

        // 1. PDF 분석
        console.log('📤 PDF 분석 API 호출 중...');
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
        console.log(`✅ 분석 완료! 시설: ${data.facilityName}\n`);

        // 2. products를 카테고리별로 재구성
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

        // 3. DB 삽입
        console.log('📤 DB 삽입 중...');

        const insertPayload = {
            facilityId: `park-${String(pdfNum).padStart(4, '0')}`,
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

        // 카테고리별 개수 출력
        Object.entries(pricing).forEach(([name, data]) => {
            console.log(`   - ${name}: ${data.rows.length}개`);
        });

        return { success: true, facility: data.facilityName };

    } catch (error) {
        console.error(`❌ [${pdfNum}번] 에러:`, error.message);
        return { success: false, error: error.message };
    }
}

async function processBatchPDF() {
    console.log('🚀 1~5번 PDF 일괄 처리 시작!\n');

    const results = [];

    for (let i = 1; i <= 5; i++) {
        const result = await processPDF(i);
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

processBatchPDF();
