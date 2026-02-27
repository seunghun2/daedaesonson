const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0043');
if (parkIndex === -1) { console.error('park-0043 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0043: (재)경맥백합공원
// 이미지:
// - 사용료: 1m²당 303,000원, 관리비: 1m²당 4,500원
// - 서비스 항목 (석물 등):
//   상석셋트(소) 81x51x18cm: 200만 / 상석셋트(대) 91x60x21cm: 210만
//   기본비석 70x24x11cm: 60만 / 기본상석 67x36x12cm: 45만
//   기본화월석 67x35x4cm: 20만
//   사각둘레석 227x133x54cm: 240만 / 원둘레석 260cm: 220만
//   납골분묘 2기형 100x63x60cm: 370만 / 4기형 106x106x69cm: 620만
//   평장 2기형 90x50x50cm: 165만
//   꽃병 1쌍: 16만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 303000,
                feeType: "USAGE",
                grade: "1m²당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "관리비",
                price: 4500,
                feeType: "MAINTENANCE",
                grade: "1m²당",
                note: "",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘 (납골분묘)",
        rows: [
            {
                name: "납골분묘 2기형",
                price: 3700000,
                feeType: "USAGE",
                grade: "2기",
                note: "규격: 100 × 63 × 60cm",
                groupType: "봉안묘 (납골분묘)",
                isRepresentative: true
            },
            {
                name: "납골분묘 4기형",
                price: 6200000,
                feeType: "USAGE",
                grade: "4기",
                note: "규격: 106 × 106 × 69cm",
                groupType: "봉안묘 (납골분묘)"
            },
            {
                name: "평장형 2기",
                price: 1650000,
                feeType: "USAGE",
                grade: "2기",
                note: "규격: 90 × 50 × 50cm",
                groupType: "봉안묘 (납골분묘)"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물비",
        rows: [
            {
                name: "상석 셋트 (소형)",
                price: 2000000,
                feeType: "USAGE",
                grade: "",
                note: "애석 / 81 × 51 × 18cm",
                groupType: "상석",
                isRepresentative: true
            },
            {
                name: "상석 셋트 (대형)",
                price: 2100000,
                feeType: "USAGE",
                grade: "",
                note: "애석 / 91 × 60 × 21cm",
                groupType: "상석"
            },
            {
                name: "기본 비석",
                price: 600000,
                feeType: "USAGE",
                grade: "",
                note: "70 × 24 × 11cm",
                groupType: "개별 석물"
            },
            {
                name: "기본 상석",
                price: 450000,
                feeType: "USAGE",
                grade: "",
                note: "67 × 36 × 12cm",
                groupType: "개별 석물"
            },
            {
                name: "기본 화월석",
                price: 200000,
                feeType: "USAGE",
                grade: "",
                note: "67 × 35 × 4cm",
                groupType: "개별 석물"
            },
            {
                name: "사각 둘레석",
                price: 2400000,
                feeType: "USAGE",
                grade: "",
                note: "227 × 133 × 54cm",
                groupType: "둘레석"
            },
            {
                name: "원 둘레석",
                price: 2200000,
                feeType: "USAGE",
                grade: "",
                note: "지름 260cm",
                groupType: "둘레석"
            },
            {
                name: "꽃병",
                price: 160000,
                feeType: "USAGE",
                grade: "1쌍",
                note: "",
                groupType: "개별 석물"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0043 prices updated successfully.');
