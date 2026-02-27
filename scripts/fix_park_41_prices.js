const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0041');
if (parkIndex === -1) { console.error('park-0041 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0041: (재)자하연포천(묘지)
// 이미지 분석:
// - 매장묘,봉안묘 사용료: 평당 150만
// - 관리비: 1년 평당 2.5만
// - 합장묘(기존): 3000만 (묘테,비석,상석,화병,작업비 포함)
// - 봉안묘 1위: 300만 / 2위: 850만 / 4위: 1350만 / 6위: 1650만
// - 봉안묘 8위 탑형: 2150만 / 8위 와형: 1042만
// - 봉안묘 12위 탑형: 938.8만 / 12위 와형: 2350만
//   ⚠ 12위 탑형 938.8만이 8위보다 싼 건 이상 → CSV 원본에 (탑형)이라 표기되어있으니 원본 따름
// - 봉안묘 16위 와형: 2650만
// - 봉안묘 24위 탑형: 3050만
// 모든 봉안묘 → BURIAL (야외)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "매장묘 사용료",
                price: 1500000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "합장묘 분양금액 (기존형)",
                price: 30000000,
                feeType: "USAGE",
                grade: "",
                note: "묘테, 비석, 상석, 화병, 작업비 포함",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 25000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘",
        rows: [
            {
                name: "봉안묘 1위",
                price: 3000000,
                feeType: "USAGE",
                grade: "1위",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "소형 (1~6위)",
                isRepresentative: true
            },
            {
                name: "봉안묘 2위",
                price: 8500000,
                feeType: "USAGE",
                grade: "2위",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "소형 (1~6위)"
            },
            {
                name: "봉안묘 4위",
                price: 13500000,
                feeType: "USAGE",
                grade: "4위",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "소형 (1~6위)"
            },
            {
                name: "봉안묘 6위",
                price: 16500000,
                feeType: "USAGE",
                grade: "6위",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "소형 (1~6위)"
            },
            {
                name: "봉안묘 8위 (탑형)",
                price: 21500000,
                feeType: "USAGE",
                grade: "8위 / 탑형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)",
                isRepresentative: true
            },
            {
                name: "봉안묘 8위 (와형)",
                price: 10420000,
                feeType: "USAGE",
                grade: "8위 / 와형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)"
            },
            {
                name: "봉안묘 12위 (탑형)",
                price: 9388000,
                feeType: "USAGE",
                grade: "12위 / 탑형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)"
            },
            {
                name: "봉안묘 12위 (와형)",
                price: 23500000,
                feeType: "USAGE",
                grade: "12위 / 와형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)"
            },
            {
                name: "봉안묘 16위 (와형)",
                price: 26500000,
                feeType: "USAGE",
                grade: "16위 / 와형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)"
            },
            {
                name: "봉안묘 24위 (탑형)",
                price: 30500000,
                feeType: "USAGE",
                grade: "24위 / 탑형",
                note: "봉안묘본체, 비석, 상석, 화병, 석물조립비 포함",
                groupType: "대형 (8위~)"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0041 prices updated successfully.');
