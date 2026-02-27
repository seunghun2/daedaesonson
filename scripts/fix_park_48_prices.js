const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0048');
if (parkIndex === -1) { console.error('park-0048 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0048: 대정공원묘원
// 사용료: 1평 70만 / 관리비: 1평/1년 1.6만 / 매장작업비: 1기 170만
// 석물: 오석비석 242만 / 오석상석 242만 / 향로 49.5만 / 꽃병 49.5만
// 둘레석 1단+월석 132만 / 3단화강암 385만
// 석주 35만 / 경계석 35만 / 비석 조각대(글새김) 66만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 700000,
                feeType: "USAGE",
                grade: "1평 기준",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "[필수] 매장 작업비",
                price: 1700000,
                feeType: "USAGE",
                grade: "1기",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 16000,
                feeType: "MAINTENANCE",
                grade: "1평 / 1년",
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
                name: "오석 비석",
                price: 2420000,
                feeType: "USAGE",
                grade: "",
                note: "3.5(105×35×15cm) / 인도산",
                groupType: "비석·상석",
                isRepresentative: true
            },
            {
                name: "오석 상석",
                price: 2420000,
                feeType: "USAGE",
                grade: "",
                note: "3.0(90×60×18cm) / 인도산",
                groupType: "비석·상석"
            },
            {
                name: "비석 조각대 (글새김)",
                price: 660000,
                feeType: "USAGE",
                grade: "",
                note: "가족비석 기준",
                groupType: "비석·상석"
            },
            {
                name: "둘레석 (1단+월석)",
                price: 1320000,
                feeType: "USAGE",
                grade: "",
                note: "중국산",
                groupType: "둘레석",
                isRepresentative: true
            },
            {
                name: "둘레석 (3단 화강암)",
                price: 3850000,
                feeType: "USAGE",
                grade: "",
                note: "국내산 화강암",
                groupType: "둘레석"
            },
            {
                name: "향로",
                price: 495000,
                feeType: "USAGE",
                grade: "",
                note: "중국산",
                groupType: "부속 석물"
            },
            {
                name: "꽃병",
                price: 495000,
                feeType: "USAGE",
                grade: "2개",
                note: "중국산",
                groupType: "부속 석물"
            },
            {
                name: "석주",
                price: 350000,
                feeType: "USAGE",
                grade: "",
                note: "중국산",
                groupType: "부속 석물"
            },
            {
                name: "경계석",
                price: 350000,
                feeType: "USAGE",
                grade: "1m",
                note: "중국산",
                groupType: "부속 석물"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0048 prices updated successfully.');
