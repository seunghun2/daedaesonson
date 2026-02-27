const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0045');
if (parkIndex === -1) { console.error('park-0045 not found'); process.exit(1); }
const park = data[parkIndex];

// park-0045: 충주공원묘원
// - 사용료: 평당 65만 / 관리비: 평당/년 1.2만 (5년분 부과)
// - 매장비: 일반 140만 / 특수 170만
// - 묘테석 88만 / 상석 88만 / 사초비 일반 40만 / 사초비 특수 50만
// - 개장청소비: 일반 50만 / 특수묘 60만 (폐기물 본인처리시 비용없음)
// - 식당사용료: 12만 (음식제공 안함)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료",
                price: 650000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "[필수] 매장비 (일반)",
                price: 1400000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "[필수] 매장비 (특수)",
                price: 1700000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "사초비 (일반)",
                price: 400000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "사초비 (특수)",
                price: 500000,
                feeType: "USAGE",
                grade: "",
                note: "일반 사초 외 특수한 경우",
                groupType: "매장묘"
            },
            {
                name: "관리비",
                price: 12000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "5년분 부과",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물비",
        rows: [
            {
                name: "묘테석",
                price: 880000,
                feeType: "USAGE",
                grade: "일반",
                note: "",
                groupType: "[필수] 석물비",
                isRepresentative: true
            },
            {
                name: "상석",
                price: 880000,
                feeType: "USAGE",
                grade: "일반",
                note: "",
                groupType: "[필수] 석물비"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "기타 비용",
        rows: [
            {
                name: "개장청소비 (일반)",
                price: 500000,
                feeType: "USAGE",
                grade: "",
                note: "본인 폐기물 처리 시 비용 없음",
                groupType: "기타 비용"
            },
            {
                name: "개장청소비 (특수묘)",
                price: 600000,
                feeType: "USAGE",
                grade: "",
                note: "본인 폐기물 처리 시 비용 없음",
                groupType: "기타 비용"
            },
            {
                name: "식당 사용료",
                price: 120000,
                feeType: "USAGE",
                grade: "",
                note: "음식 제공 없음 (장소 대여)",
                groupType: "기타 비용"
            }
        ]
    }
];

if (!park.priceInfo) park.priceInfo = {};
park.priceInfo.standardizedPrices = newPrices;
park.priceInfo.priceVerified = true;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0045 prices updated successfully.');
