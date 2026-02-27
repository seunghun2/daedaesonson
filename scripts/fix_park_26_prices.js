const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0026');
if (parkIndex === -1) {
    console.error('park-0026 not found');
    process.exit(1);
}

const park = data[parkIndex];

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        groupType: "사용료 및 관리비",
        rows: [
            {
                name: "묘지사용료",
                description: "3.3㎡ (1평) 기준 토지 사용료",
                price: 1300000,
                feeType: "USAGE",
                grade: "1평(3.3㎡)단위",
                note: "계약 해지 시 가묘는 분양대금 전액 반환"
            },
            {
                name: "매장작업비",
                description: "1구 매장 기준 기본 작업비",
                price: 1000000,
                feeType: "USAGE",
                grade: "1구기준",
                note: ""
            },
            {
                name: "관리비",
                description: "3.3㎡ (1평) 기준 1년 관리비",
                price: 18000,
                feeType: "MAINTENANCE",
                grade: "1평(3.3㎡)단위",
                note: ""
            },
            {
                name: "매장묘(2단)",
                description: "2기 매장묘 (2단형)",
                price: 9000000,
                feeType: "USAGE",
                grade: "2기",
                note: ""
            },
            {
                name: "매장묘(3단)",
                description: "2기 매장묘 (3단형)",
                price: 12000000,
                feeType: "USAGE",
                grade: "2기",
                note: ""
            },
            {
                name: "글자 각인비용",
                description: "비석 글자 각인",
                price: 8000,
                feeType: "USAGE",
                grade: null,
                note: "대(大) 8,000원 / 소(小) 1,700원 추정"
            }
        ]
    },
    {
        serviceType: "BURIAL", // 봉안가족묘 -> 봉안묘 -> 매장묘지 탭
        subType: "봉안묘",
        groupType: "봉안가족묘 분양",
        rows: [
            {
                name: "부부형 봉안묘",
                description: "부부형 2기",
                price: 6500000,
                feeType: "USAGE",
                grade: "2기",
                note: ""
            },
            {
                name: "봉안가족묘 8기",
                description: "모델명: 경춘8",
                price: 15000000,
                feeType: "USAGE",
                grade: "8기",
                note: ""
            },
            {
                name: "봉안가족묘 12기",
                description: "모델명: 경춘9",
                price: 16500000,
                feeType: "USAGE",
                grade: "12기",
                note: ""
            },
            {
                name: "봉안가족묘 20기",
                description: "모델명: 경춘7",
                price: 16000000,
                feeType: "USAGE",
                grade: "20기",
                note: ""
            },
            {
                name: "봉안가족묘 20기 (프리미엄)",
                description: "모델명: 경춘3",
                price: 22500000,
                feeType: "USAGE",
                grade: "20기",
                note: ""
            },
            {
                name: "봉안가족묘 22기",
                description: "모델명: 경춘4",
                price: 22500000,
                feeType: "USAGE",
                grade: "22기",
                note: ""
            },
            {
                name: "봉안가족묘 40기",
                description: "모델명: 경춘1",
                price: 40000000,
                feeType: "USAGE",
                grade: "40기",
                note: ""
            },
            {
                name: "봉안가족묘 44기",
                description: "모델명: 경춘6 (44기)",
                price: 29000000,
                feeType: "USAGE",
                grade: "44기",
                note: ""
            },
            {
                name: "봉안가족묘 46기",
                description: "모델명: 경춘2",
                price: 33000000,
                feeType: "USAGE",
                grade: "46기",
                note: ""
            },
            {
                name: "복합가족묘 (매장 2기+봉안 12기)",
                description: "모델명: 경춘6 (복합형)",
                price: 21500000,
                feeType: "USAGE",
                grade: "복합형",
                note: "매장 2기 + 봉안 12기 혼합"
            }
        ]
    },
    {
        serviceType: "NATURAL",
        subType: "평장형 자연장",
        groupType: "자연장 분양",
        rows: [
            {
                name: "자연장 6기",
                description: "평장형",
                price: 6900000,
                feeType: "USAGE",
                grade: "6기",
                note: ""
            }
        ]
    }
];

park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0026 prices updated successfully.');
