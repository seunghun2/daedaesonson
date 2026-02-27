const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0046');
if (parkIndex === -1) { console.error('park-0046 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0046: 동화경모공원(묘지)
// 사용료: 평당 1,333,333 / 관리비: 평당/년간 124,670
// 매장료: 건당 110만 / 휴일추가 18만 / 동시합장 20만
// 석물세트: 198만 / 석물해체: 99만
// 6기석실: 150만 / 석관: 기당 40만 / 석실: 기당 30만
// 비문각자비: 글자당 20만 / 휴일추가비(석물): 12만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 1333333,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "[필수] 매장료",
                price: 1100000,
                feeType: "USAGE",
                grade: "1건당",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "매장료 휴일 추가비",
                price: 180000,
                feeType: "USAGE",
                grade: "",
                note: "휴일 매장 시 추가",
                groupType: "매장묘"
            },
            {
                name: "동시 합장 시 추가비",
                price: 200000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 124670,
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
                name: "석물 세트",
                price: 1980000,
                feeType: "USAGE",
                grade: "",
                note: "대리석 등",
                groupType: "석물",
                isRepresentative: true
            },
            {
                name: "석물 해체비",
                price: 990000,
                feeType: "USAGE",
                grade: "",
                note: "대리석 등",
                groupType: "석물"
            },
            {
                name: "비문 각자비",
                price: 200000,
                feeType: "USAGE",
                grade: "글자당",
                note: "글자 당 비용 추가",
                groupType: "석물"
            },
            {
                name: "석물 휴일 추가비",
                price: 120000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "석물"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "장사용품",
        rows: [
            {
                name: "6기 석실",
                price: 1500000,
                feeType: "USAGE",
                grade: "",
                note: "대리석 등",
                groupType: "장사용품"
            },
            {
                name: "석관",
                price: 400000,
                feeType: "USAGE",
                grade: "1기당",
                note: "대리석 등",
                groupType: "장사용품"
            },
            {
                name: "석실",
                price: 300000,
                feeType: "USAGE",
                grade: "1기당",
                note: "대리석 등",
                groupType: "장사용품"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0046 prices updated successfully.');
