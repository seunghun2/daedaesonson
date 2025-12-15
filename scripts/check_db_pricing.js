const fetch = require('node-fetch');

async function checkPricing() {
    console.log('🔍 DB 데이터 확인 중...\n');

    try {
        const response = await fetch('http://localhost:3000/api/facilities/park-0001/prices', {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log('📊 조회 결과:\n');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

checkPricing();
