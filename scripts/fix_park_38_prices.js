const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0038');
if (parkIndex === -1) { console.error('park-0038 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0038: (재)진달래문화재단
// 이미지 분석:
// - 전부 패키지 분양 (비석,상석,화병,향로 + 5년 관리비 포함, 각자비 별도)
// - 매장묘: 단장6평 2145만 / 합장8평 2775만 / 쌍분12평 3997만
// - 복합묘: 2+16위 8평 4044만 / 2+24위 8평 4164만
// - 평장묘: 6위6평 1950만 / 8위6평 2193만 / 12위8평 2574만 / 16위8평 3034만
// - 봉안묘: 2위3평 1031.5만 / 4위4평 1692만 / 8위6평 2113만 / 12위6평 2513만 / 16위6평 2813만 / 32위8평 3954만
// - 관리비: 평당/년 21,000원
// 모두 야외 시설 → BURIAL

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘 분양금액",
        rows: [
            {
                name: "단장형 (6평)",
                price: 21450000,
                feeType: "USAGE",
                grade: "6평 / 1인",
                note: "3단소묘테, 비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "매장묘 분양금액",
                isRepresentative: true
            },
            {
                name: "합장형 (8평)",
                price: 27750000,
                feeType: "USAGE",
                grade: "8평 / 2인 합장",
                note: "4단대묘테, 비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "매장묘 분양금액"
            },
            {
                name: "쌍분형 (12평)",
                price: 39970000,
                feeType: "USAGE",
                grade: "12평 / 2기 나란히",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "매장묘 분양금액"
            },
            {
                name: "관리비 (5년 이후)",
                price: 21000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "분양가에 5년 관리비 포함, 이후 연납",
                groupType: "매장묘 분양금액"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "복합묘 분양금액",
        rows: [
            {
                name: "복합묘 2+16위 (8평)",
                price: 40440000,
                feeType: "USAGE",
                grade: "8평 / 매장2 + 봉안16위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "복합묘 분양금액",
                isRepresentative: true
            },
            {
                name: "복합묘 2+24위 (8평)",
                price: 41640000,
                feeType: "USAGE",
                grade: "8평 / 매장2 + 봉안24위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "복합묘 분양금액"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "평장묘 분양금액",
        rows: [
            {
                name: "평장 6위 (6평)",
                price: 19500000,
                feeType: "USAGE",
                grade: "6평 / 6위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "평장묘 분양금액",
                isRepresentative: true
            },
            {
                name: "평장 8위 (6평)",
                price: 21930000,
                feeType: "USAGE",
                grade: "6평 / 8위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "평장묘 분양금액"
            },
            {
                name: "평장 12위 (8평)",
                price: 25740000,
                feeType: "USAGE",
                grade: "8평 / 12위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "평장묘 분양금액"
            },
            {
                name: "평장 16위 (8평)",
                price: 30340000,
                feeType: "USAGE",
                grade: "8평 / 16위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "평장묘 분양금액"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘 분양금액",
        rows: [
            {
                name: "봉안묘 2위 (3평)",
                price: 10315000,
                feeType: "USAGE",
                grade: "3평 / 2위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "봉안묘 4위 (4평)",
                price: 16920000,
                feeType: "USAGE",
                grade: "4평 / 4위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "봉안묘 8위 (6평)",
                price: 21130000,
                feeType: "USAGE",
                grade: "6평 / 8위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "봉안묘 12위 (6평)",
                price: 25130000,
                feeType: "USAGE",
                grade: "6평 / 12위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "봉안묘 16위 (6평)",
                price: 28130000,
                feeType: "USAGE",
                grade: "6평 / 16위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "봉안묘 32위 (8평)",
                price: 39540000,
                feeType: "USAGE",
                grade: "8평 / 32위",
                note: "비석, 상석, 화병, 향로, 5년 관리비 포함 (각자비 별도)",
                groupType: "봉안묘 분양금액"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0038 prices updated successfully.');
