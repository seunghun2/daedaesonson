const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0034');
if (parkIndex === -1) {
    console.error('park-0034 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0034
// FIX:
// 1. 매장 작업비를 매장묘 아코디언 안으로 이동 (필수 비용이라 함께 보여야 함)
// 2. 석물비 아코디언에 "필수" 표기

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            // 2평형
            {
                name: "사용료 (30년)",
                description: "30년 사용료",
                price: 572000,
                feeType: "USAGE",
                grade: "2평형 (6.75㎡)",
                note: "",
                groupType: "2평형 (6.75㎡)",
                isRepresentative: true
            },
            {
                name: "사용료 (국가유공자)",
                description: "1종 수급 국가유공자 전액 감면",
                price: 0,
                feeType: "USAGE",
                grade: "2평형 (국가유공자)",
                note: "전액 감면",
                groupType: "2평형 (6.75㎡)"
            },
            {
                name: "관리비 (30년 선납)",
                description: "30년 관리비",
                price: 480000,
                feeType: "MAINTENANCE",
                grade: "2평형",
                note: "30년 선납",
                groupType: "2평형 (6.75㎡)"
            },
            {
                name: "관리비 (국가유공자)",
                description: "1종 수급 국가유공자 전액 감면",
                price: 0,
                feeType: "MAINTENANCE",
                grade: "2평형 (국가유공자)",
                note: "전액 감면",
                groupType: "2평형 (6.75㎡)"
            },
            {
                name: "[필수] 매장 작업비 (2평형)",
                description: "하절기/동절기 동일요금",
                price: 370000,
                feeType: "USAGE",
                grade: "2평형",
                note: "",
                groupType: "2평형 (6.75㎡)"
            },
            // 3평형
            {
                name: "사용료 (30년)",
                description: "30년 사용료",
                price: 839000,
                feeType: "USAGE",
                grade: "3평형 (9.9㎡)",
                note: "",
                groupType: "3평형 (9.9㎡)",
                isRepresentative: true
            },
            {
                name: "사용료 (국가유공자)",
                description: "1종 수급 국가유공자 전액 감면",
                price: 0,
                feeType: "USAGE",
                grade: "3평형 (국가유공자)",
                note: "전액 감면",
                groupType: "3평형 (9.9㎡)"
            },
            {
                name: "관리비 (30년 선납)",
                description: "30년 관리비",
                price: 720000,
                feeType: "MAINTENANCE",
                grade: "3평형",
                note: "30년 선납",
                groupType: "3평형 (9.9㎡)"
            },
            {
                name: "관리비 (국가유공자)",
                description: "1종 수급 국가유공자 전액 감면",
                price: 0,
                feeType: "MAINTENANCE",
                grade: "3평형 (국가유공자)",
                note: "전액 감면",
                groupType: "3평형 (9.9㎡)"
            },
            {
                name: "[필수] 매장 작업비 (3평형 1구)",
                description: "하절기/동절기 동일요금",
                price: 370000,
                feeType: "USAGE",
                grade: "3평형 (1구)",
                note: "",
                groupType: "3평형 (9.9㎡)"
            },
            {
                name: "[필수] 매장 작업비 (3평형 2구)",
                description: "합장 매장시",
                price: 740000,
                feeType: "USAGE",
                grade: "3평형 (2구)",
                note: "",
                groupType: "3평형 (9.9㎡)"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "석물비 (필수)",
        rows: [
            {
                name: "석물비 2평형 (화강암)",
                description: "장사용품 분류 단가표 기준",
                price: 940000,
                feeType: "USAGE",
                grade: "2평형 화강암",
                note: "",
                groupType: "석물비 (필수)"
            },
            {
                name: "석물비 2평형 (오석)",
                description: "장사용품 분류 단가표 기준",
                price: 1118000,
                feeType: "USAGE",
                grade: "2평형 오석",
                note: "",
                groupType: "석물비 (필수)"
            },
            {
                name: "석물비 3평형 (화강암)",
                description: "장사용품 분류 단가표 기준",
                price: 982000,
                feeType: "USAGE",
                grade: "3평형 화강암",
                note: "",
                groupType: "석물비 (필수)"
            },
            {
                name: "석물비 3평형 (오석)",
                description: "장사용품 분류 단가표 기준",
                price: 1160000,
                feeType: "USAGE",
                grade: "3평형 오석",
                note: "",
                groupType: "석물비 (필수)"
            }
        ]
    }
];

if (!park.priceInfo) {
    park.priceInfo = {};
}
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0034 prices updated successfully.');
