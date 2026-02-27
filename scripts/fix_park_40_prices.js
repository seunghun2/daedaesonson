const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0040');
if (parkIndex === -1) { console.error('park-0040 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0040: 영락공원묘원
// 이미지 + CSV 분석:
// 시설사용료 테이블 해석:
//  - 년/평 32만 (사용료), 년/평 1만 (관리비) → 연납 기준 단가
//  - 사용료 평/년 32만, 관리비 평/년 1만 → 같은 내용 중복
//  - 1평/평 35만 (사용료), 1평/1년 1.1만 (관리비) → 봉안묘 또는 다른 구역
//  → 두 가지 사용료 구조가 혼재. 32만 vs 35만은 구역 차이로 추정
//  - 작업비: 1기 50만
//  - 석물: 2평 둘레석 160만 / 2평 상석외 127만 / 3평 둘레석 200만 / 3평 상석외 175.5만
//  - 각자대: 1기 10만
//  - 묘지사용료(하단): 1평 35만, 관리비 1평 1.1만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 320000,
                feeType: "USAGE",
                grade: "1평당 / 1년",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "묘지 사용료 (일부 구역)",
                price: 350000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "[필수] 매장 작업비",
                price: 500000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 10000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물비",
        rows: [
            {
                name: "2평 둘레석",
                price: 1600000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "2평형",
                isRepresentative: true
            },
            {
                name: "2평 상석외 석물",
                price: 1270000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "2평형"
            },
            {
                name: "3평 둘레석",
                price: 2000000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "3평형",
                isRepresentative: true
            },
            {
                name: "3평 상석외 석물",
                price: 1755000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "3평형"
            },
            {
                name: "각자대",
                price: 100000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "공통"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0040 prices updated successfully.');
