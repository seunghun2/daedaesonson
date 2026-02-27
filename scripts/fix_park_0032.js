/**
 * fix_park_0032.js
 * 호정공원 (park-0032) 가격 데이터 세팅
 * 출처: 호정공원 공식 홈페이지 (www.hjcloud9.com)
 * 
 * 서비스타입:
 * - BURIAL: 매장묘 (합장/단장)
 * - BURIAL: 봉안묘 (야외형이므로 BURIAL)
 * - NATURAL: 자연장 (수목장, 화초·잔디장)
 * - BONGSAN: 봉안담 (벽체형)
 */

const fs = require('fs');
const path = require('path');

const FACILITIES_PATH = path.join(__dirname, '..', 'data', 'facilities.json');

function main() {
    const data = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));
    const park = data.find(f => f.id === 'park-0032');

    if (!park) {
        console.error('park-0032 not found!');
        process.exit(1);
    }

    console.log('현재 이름:', park.name);
    console.log('현재 가격 수:', park.standardizedPrices?.length || 0);

    park.standardizedPrices = [
        // ========================================
        // 매장묘 (BURIAL) - 합장 5평
        // ========================================
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            groupType: '합장 (5평)',
            rows: [
                {
                    name: '매장 1단',
                    price: 18050000,
                    grade: '5평, 30년 사용',
                    note: '포함: 묘지사용료, 석물(묘대·비석) 비용',
                    feeType: 'USAGE',
                    isRepresentative: true
                },
                {
                    name: '매장 2단',
                    price: 19550000,
                    grade: '5평, 30년 사용',
                    note: '포함: 묘지사용료, 석물(묘대·비석) 비용',
                    feeType: 'USAGE'
                },
                {
                    name: '매장 특',
                    price: 22950000,
                    grade: '5평, 30년 사용',
                    note: '포함: 묘지사용료, 석물(묘대·비석) 비용',
                    feeType: 'USAGE'
                },
                {
                    name: '호정(B)',
                    price: 24550000,
                    grade: '5평, 30년 사용',
                    note: '포함: 묘지사용료, 석물(묘대·비석) 비용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비, 관리비, 각자비 (최초 안치시부터 적용)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        // 매장묘 - 단장 3평
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            groupType: '단장 (3평)',
            rows: [
                {
                    name: '호정(A)',
                    price: 15500000,
                    grade: '3평, 30년 사용',
                    note: '포함: 묘지사용료, 석물(묘대·비석) 비용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비, 관리비, 각자비 (최초 안치시부터 적용)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        // ========================================
        // 봉안묘 (BURIAL) - 야외형이므로 BURIAL
        // ========================================
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            rows: [
                {
                    name: '부부 봉안 2기',
                    price: 9300000,
                    grade: '2평, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '가족 봉안 4기',
                    price: 17300000,
                    grade: '4평, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '가족 봉안 8기',
                    price: 22800000,
                    grade: '5평, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '가족 봉안 평장 4기',
                    price: 14400000,
                    grade: '2평, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비, 관리비, 각자비 (최초 안치시부터 적용)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        // ========================================
        // 자연장 - 수목장 (NATURAL)
        // ========================================
        {
            serviceType: 'NATURAL',
            subType: '수목장',
            rows: [
                {
                    name: '개인목 1기',
                    price: 3900000,
                    grade: '에메랄드 골드, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '부부목 2기',
                    price: 7100000,
                    grade: '작은 둥근 소나무·분재형 소나무, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '가족목 4기',
                    price: 11900000,
                    grade: '반송·황금소나무·소나무, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '가족목 8기',
                    price: 21500000,
                    grade: '반송·황금소나무·소나무, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '공동수목',
                    price: 2900000,
                    grade: '조형소나무, 영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비(30만원), 관리비, 수목표지석(15만원) (최초 안치시부터 적용)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        // ========================================
        // 자연장 - 화초·잔디장 (NATURAL)
        // ========================================
        {
            serviceType: 'NATURAL',
            subType: '화초·잔디장',
            rows: [
                {
                    name: '화초장 1기',
                    price: 2500000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '잔디장 1기',
                    price: 2000000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비, 관리비 (최초 안치시부터 적용)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        // ========================================
        // 봉안담 (BONGSAN) - 벽체형
        // ========================================
        {
            serviceType: 'BONGSAN',
            subType: '봉안담',
            groupType: '개인단',
            rows: [
                {
                    name: '4, 5단',
                    price: 3500000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '3, 6단',
                    price: 3300000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '2, 7단',
                    price: 2900000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '1단',
                    price: 2300000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비(20만원), 관리비(별도문의), 명패비(개인3만원)',
                    feeType: 'MAINTENANCE'
                }
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안담',
            groupType: '부부단',
            rows: [
                {
                    name: '4, 5단',
                    price: 6300000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '3, 6단',
                    price: 5900000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '2, 7단',
                    price: 5300000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '1단',
                    price: 4100000,
                    grade: '영구 사용',
                    feeType: 'USAGE'
                },
                {
                    name: '관리비',
                    price: null,
                    grade: '5년 단위 선납',
                    note: '별도비용: 안장비(20만원), 관리비(별도문의), 명패비(부부5만원)',
                    feeType: 'MAINTENANCE'
                }
            ]
        }
    ];

    // 대표 가격 확인
    const repRow = park.standardizedPrices
        .flatMap(g => g.rows)
        .find(r => r.isRepresentative);
    console.log('대표가격:', repRow?.name, repRow?.price);

    // 저장
    fs.writeFileSync(FACILITIES_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ park-0032 호정공원 가격 데이터 저장 완료!');
    console.log('총 그룹 수:', park.standardizedPrices.length);
    console.log('총 항목 수:', park.standardizedPrices.reduce((sum, g) => sum + g.rows.length, 0));
}

main();
