const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function reprocessPark0001() {
    console.log('🔄 park-0001 데이터 재처리 시작!\n');

    try {
        // 1. 기존 데이터 삭제
        console.log('🗑️  기존 데이터 삭제 중...');

        const deletePayload = {
            facilityId: 'park-0001',
            pricing: {}  // 빈 객체로 전달하면 삭제됨
        };

        await fetch('http://localhost:3000/api/bulk-insert-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deletePayload)
        });

        console.log('✅ 기존 데이터 삭제 완료!\n');

        // 2. PDF 재분석
        const pdfPath = path.join(__dirname, '../archive5/1.(재)낙원추모공원_price_info.pdf');

        console.log('📤 PDF 재분석 중...');
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

        // 결과 저장
        fs.writeFileSync(
            path.join(__dirname, '../data/park_0001_raw.json'),
            JSON.stringify(data, null, 2),
            'utf-8'
        );

        // 3. 정확한 카테고리 분류
        console.log('🔍 카테고리 정확하게 재분류 중...\n');

        const pricing = {
            '매장묘': { category: 'grave', categoryName: '매장묘', unit: '원', rows: [] },
            '봉안당': { category: 'charnel', categoryName: '봉안당', unit: '원', rows: [] },
            '수목장': { category: 'natural', categoryName: '수목장', unit: '원', rows: [] }
        };

        // products 처리
        if (data.products) {
            Object.entries(data.products).forEach(([categoryName, categoryData]) => {
                console.log(`📂 처리 중: ${categoryName}`);

                if (!categoryData.rows) return;

                categoryData.rows.forEach(row => {
                    const itemName = row.name.toLowerCase();

                    // 매장묘 판별
                    if (itemName.includes('매장') || itemName.includes('평형') ||
                        itemName.includes('평장') || itemName.includes('묘') &&
                        !itemName.includes('봉안') && !itemName.includes('수목')) {
                        pricing['매장묘'].rows.push({
                            name: row.name,
                            price: row.price,
                            description: row.grade || ''
                        });
                        console.log(`  ✅ 매장묘: ${row.name}`);
                    }
                    // 봉안당 판별
                    else if (itemName.includes('봉안') || itemName.includes('납골') ||
                        itemName.match(/\d+위/) || itemName.includes('정려')) {
                        pricing['봉안당'].rows.push({
                            name: row.name,
                            price: row.price,
                            description: row.grade || ''
                        });
                        console.log(`  ✅ 봉안당: ${row.name}`);
                    }
                    // 수목장 판별
                    else if (itemName.includes('수목') || itemName.includes('자연장') ||
                        itemName.includes('플라타너스') || itemName.includes('아이리스') ||
                        itemName.includes('클로버') || itemName.includes('다알리아') ||
                        itemName.includes('철쭉')) {
                        pricing['수목장'].rows.push({
                            name: row.name,
                            price: row.price,
                            description: row.grade || ''
                        });
                        console.log(`  ✅ 수목장: ${row.name}`);
                    }
                    else {
                        console.log(`  ⚠️  제외: ${row.name}`);
                    }
                });
            });
        }

        // 빈 카테고리 제거
        Object.keys(pricing).forEach(key => {
            if (pricing[key].rows.length === 0) {
                delete pricing[key];
            }
        });

        // 4. DB 재삽입
        console.log('\n📤 DB에 재삽입 중...\n');

        const insertPayload = {
            facilityId: 'park-0001',
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

        console.log('✅ 재삽입 완료!\n');
        console.log('📊 최종 결과:');
        Object.entries(pricing).forEach(([name, data]) => {
            console.log(`   - ${name}: ${data.rows.length}개`);
        });

        console.log('\n💡 어드민 패널에서 확인: http://localhost:3000/admin/upload\n');

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

reprocessPark0001();
