const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0049');
if (parkIndex === -1) { console.error('park-0049 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0049: 천주교혜화동성당 포천묘원
// 사용료: 1평당 100만 (9.9x9.9=1평) / 관리비: 1평당 1만
// 석물(서비스항목):
//   상석(화병포함): 71.5만 / 피와비석(각인포함): 88만 / 비석글씨: 50만
//   묘테석: 1단 단장 110만 / 1단 합장 132만 / 2단 단장 220만 / 2단 합장 231만
//   잔디: 봉분당 35만
//   묘테석보수: 현장실사 후 / 추가인건비: 별도

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 1000000,
                feeType: "USAGE",
                grade: "1평당 (9.9×9.9m)",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
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
                name: "상석 (화병 포함)",
                price: 715000,
                feeType: "USAGE",
                grade: "",
                note: "2.5尺 × 750mm × 480mm",
                groupType: "상석·비석",
                isRepresentative: true
            },
            {
                name: "피와 비석 (각인 포함)",
                price: 880000,
                feeType: "USAGE",
                grade: "",
                note: "2.3尺 × 700mm × 450mm",
                groupType: "상석·비석"
            },
            {
                name: "비석 글씨 추가",
                price: 500000,
                feeType: "USAGE",
                grade: "",
                note: "기존 비석에 글씨만 추가할 경우",
                groupType: "상석·비석"
            },
            {
                name: "1단 단장 묘테석",
                price: 1100000,
                feeType: "USAGE",
                grade: "",
                note: "5.0尺 × 7.2尺 × 0.8尺",
                groupType: "묘테석",
                isRepresentative: true
            },
            {
                name: "1단 합장 묘테석",
                price: 1320000,
                feeType: "USAGE",
                grade: "",
                note: "5.5尺 × 7.2尺 × 0.8尺",
                groupType: "묘테석"
            },
            {
                name: "2단 단장 묘테석",
                price: 2200000,
                feeType: "USAGE",
                grade: "",
                note: "5.0尺 × 7.2尺 × 1.9尺",
                groupType: "묘테석"
            },
            {
                name: "2단 합장 묘테석",
                price: 2310000,
                feeType: "USAGE",
                grade: "",
                note: "5.5尺 × 7.2尺 × 1.9尺",
                groupType: "묘테석"
            },
            {
                name: "잔디",
                price: 350000,
                feeType: "USAGE",
                grade: "봉분당",
                note: "",
                groupType: "기타"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0049 prices updated successfully.');
