const fs = require('fs');
const path = require('path');

// 1번 시설 가격 데이터
const testData = {
    facilityId: 'park-0001',
    pricing: {
        'grave': {
            category: 'grave',
            categoryName: '매장묘',
            unit: '원',
            rows: [
                {
                    name: '기본 매장묘 사용료',
                    price: 3000000,
                    description: '',
                    isRepresentative: false
                },
                {
                    name: '합장 매장묘 사용료',
                    price: 500000,
                    description: '',
                    isRepresentative: true
                },
                {
                    name: '대장작업비',
                    price: 1500000,
                    description: '',
                    isRepresentative: false
                }
            ]
        }
    }
};

async function insertToDatabase() {
    console.log('🚀 DB 가격 데이터 삽입 시작!\n');

    try {
        console.log(`📌 시설: park-0001\n`);

        const response = await fetch('http://localhost:3000/api/bulk-insert-pricing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
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
        console.error('\n❌ 에러:', error.message);
    }
}

// 실행
insertToDatabase();
