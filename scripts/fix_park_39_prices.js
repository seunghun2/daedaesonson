const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0039');
if (parkIndex === -1) { console.error('park-0039 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0039: (재)석계공원묘원
// 이미지 분석:
// - 묘지사용료: 평당 135만
// - 관리비: 평당/년 2만
// - 개장정리비: 1.5평 40만 / 1.5~4평 50만 / 4평이상 60만
// - 봉분잔디교체: 40만 (1년 무상AS)
// - 평장형 납골묘(봉안묘): 2기 기본 385만 / 고급 650만 / 최고급 990만
// - 가족 납골묘: 4기 825만 / 4기고급 1650만 / 12기 1870만
// - 매장묘 set: 1.5평기본 440만 / 1.5평고급 550만 / 3평고급 770만
// 납골묘 = 야외 봉안묘 → BURIAL

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 1350000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "매장묘 1.5평 기본형 세트",
                price: 4400000,
                feeType: "USAGE",
                grade: "1.5평",
                note: "석물 포함 기본형 세트",
                groupType: "매장묘"
            },
            {
                name: "매장묘 1.5평 고급형 세트",
                price: 5500000,
                feeType: "USAGE",
                grade: "1.5평",
                note: "석물 포함 고급형 세트",
                groupType: "매장묘"
            },
            {
                name: "매장묘 3평 고급형 세트",
                price: 7700000,
                feeType: "USAGE",
                grade: "3평",
                note: "석물 포함 고급형 세트",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 20000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘 (납골묘)",
        rows: [
            {
                name: "평장형 납골묘 2기 (기본형)",
                price: 3850000,
                feeType: "USAGE",
                grade: "2기",
                note: "",
                groupType: "평장형",
                isRepresentative: true
            },
            {
                name: "평장형 납골묘 2기 (고급형)",
                price: 6500000,
                feeType: "USAGE",
                grade: "2기",
                note: "",
                groupType: "평장형"
            },
            {
                name: "평장형 납골묘 2기 (최고급형)",
                price: 9900000,
                feeType: "USAGE",
                grade: "2기",
                note: "",
                groupType: "평장형"
            },
            {
                name: "가족 납골묘 4기",
                price: 8250000,
                feeType: "USAGE",
                grade: "4기",
                note: "",
                groupType: "가족형",
                isRepresentative: true
            },
            {
                name: "가족 납골묘 4기 (고급형)",
                price: 16500000,
                feeType: "USAGE",
                grade: "4기",
                note: "고급 석물",
                groupType: "가족형"
            },
            {
                name: "가족 납골묘 12기",
                price: 18700000,
                feeType: "USAGE",
                grade: "12기 / 대형",
                note: "",
                groupType: "가족형"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "개장 및 부대비용",
        rows: [
            {
                name: "개장정리비 (1.5평)",
                price: 400000,
                feeType: "USAGE",
                grade: "1.5평",
                note: "",
                groupType: "개장 및 부대비용"
            },
            {
                name: "개장정리비 (1.5평 초과 ~ 4평 미만)",
                price: 500000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "개장 및 부대비용"
            },
            {
                name: "개장정리비 (4평 이상)",
                price: 600000,
                feeType: "USAGE",
                grade: "4평 이상",
                note: "",
                groupType: "개장 및 부대비용"
            },
            {
                name: "봉분 잔디교체",
                price: 400000,
                feeType: "USAGE",
                grade: "",
                note: "1년 무상 A/S",
                groupType: "개장 및 부대비용"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0039 prices updated successfully.');
