const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0042');
if (parkIndex === -1) { console.error('park-0042 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0042: 별그리다(THE HILL) 
// 프리미엄 공원묘원. 일반 구역 / THE PROUD 구역
// 단장형(3평), 합장형(4.5평)
// 토지사용료 + [필수] 석물설치비 구조
// 서비스: 식사, 제사상, 조화

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘 분양금액",
        rows: [
            // 일반 구역
            {
                name: "토지사용료 (단장형)",
                price: 10000000,
                feeType: "USAGE",
                grade: "3평 / 1인",
                note: "",
                groupType: "일반 구역",
                isRepresentative: true
            },
            {
                name: "토지사용료 (합장형)",
                price: 15000000,
                feeType: "USAGE",
                grade: "4.5평 / 2인 합장",
                note: "",
                groupType: "일반 구역"
            },
            {
                name: "관리비 (단장형)",
                price: 260000,
                feeType: "MAINTENANCE",
                grade: "1년 기준",
                note: "3년, 5년 선납 시 할인율 적용",
                groupType: "일반 구역"
            },
            {
                name: "관리비 (합장형)",
                price: 390000,
                feeType: "MAINTENANCE",
                grade: "1년 기준",
                note: "3년, 5년 선납 시 할인율 적용",
                groupType: "일반 구역"
            },
            // THE PROUD 구역
            {
                name: "토지사용료 (단장형)",
                price: 13000000,
                feeType: "USAGE",
                grade: "3평 / 1인",
                note: "",
                groupType: "THE PROUD",
                isRepresentative: true
            },
            {
                name: "토지사용료 (합장형)",
                price: 19500000,
                feeType: "USAGE",
                grade: "4.5평 / 2인 합장",
                note: "",
                groupType: "THE PROUD"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물설치비",
        rows: [
            {
                name: "석물설치비 (단장형 3평)",
                price: 15400000,
                feeType: "USAGE",
                grade: "",
                note: "상세금액 별도",
                groupType: "일반 구역",
                isRepresentative: true
            },
            {
                name: "석물설치비 (합장형 4.5평)",
                price: 19800000,
                feeType: "USAGE",
                grade: "",
                note: "상세금액 별도",
                groupType: "일반 구역"
            },
            {
                name: "석물설치비 (단장형 3평)",
                price: 17820000,
                feeType: "USAGE",
                grade: "",
                note: "상세금액 별도",
                groupType: "THE PROUD",
                isRepresentative: true
            },
            {
                name: "석물설치비 (합장형 4.5평)",
                price: 21120000,
                feeType: "USAGE",
                grade: "",
                note: "상세금액 별도",
                groupType: "THE PROUD"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "부대 서비스",
        rows: [
            {
                name: "식사",
                price: 12000,
                feeType: "USAGE",
                grade: "1인",
                note: "우거지국, 육개장, 북어국 중 택1 / 기본찬 4종",
                groupType: "부대 서비스"
            },
            {
                name: "제사상",
                price: 230000,
                feeType: "USAGE",
                grade: "",
                note: "37만원, 60만원 상도 주문 가능",
                groupType: "부대 서비스"
            },
            {
                name: "조화",
                price: 5000,
                feeType: "USAGE",
                grade: "",
                note: "5,000 ~ 12,000원",
                groupType: "부대 서비스"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0042 prices updated successfully.');
