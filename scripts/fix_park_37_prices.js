const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0037');
if (parkIndex === -1) {
    console.error('park-0037 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0037: (재)지평선전북공원묘원(묘지)
// 이미지 분석:
// - 묘역별 1평당 단가: 장미 120만 / 개나리 130만,140만 / 매화 150만
// - 패키지 분양가: 1호(소형) 단장4평 480만 ~ 쌍장8평 960만
//                   4호(대형) 단장8평 960만~ ~ 쌍장14평 1680만~
//   → 상석, 비석, 1회 설치비 포함
// - 관리비: 1평/1년 15,000원
// - 추가매장비/재설치비: 75만
// - 장사용품: 석관 20만, 유골함(한지) 25만

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘 사용료",
        rows: [
            {
                name: "묘지 사용료 (장미묘역)",
                price: 1200000,
                feeType: "USAGE",
                grade: "1평당 (3.3㎡)",
                note: "",
                groupType: "매장묘 사용료",
                isRepresentative: true
            },
            {
                name: "묘지 사용료 (개나리묘역 일반)",
                price: 1300000,
                feeType: "USAGE",
                grade: "1평당 (3.3㎡)",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "묘지 사용료 (개나리묘역 상급)",
                price: 1400000,
                feeType: "USAGE",
                grade: "1평당 (3.3㎡)",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "묘지 사용료 (매화묘역)",
                price: 1500000,
                feeType: "USAGE",
                grade: "1평당 (3.3㎡)",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "관리비",
                price: 15000,
                feeType: "MAINTENANCE",
                grade: "1평당 / 1년",
                note: "",
                groupType: "매장묘 사용료"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "매장묘 분양금액",
        rows: [
            // 1호 (소형)
            {
                name: "매장 1호 단장 (4평)",
                price: 4800000,
                feeType: "USAGE",
                grade: "4평 / 1인",
                note: "상석, 비석, 1회 설치비 포함",
                groupType: "1호 (소형)",
                isRepresentative: true
            },
            {
                name: "매장 1호 합장 (5평)",
                price: 6000000,
                feeType: "USAGE",
                grade: "5평 / 2인 합장",
                note: "상석, 비석, 1회 설치비 포함",
                groupType: "1호 (소형)"
            },
            {
                name: "매장 1호 쌍장 (8평)",
                price: 9600000,
                feeType: "USAGE",
                grade: "8평 / 2기 나란히",
                note: "상석, 비석, 1회 설치비 포함",
                groupType: "1호 (소형)"
            },
            // 4호 (대형)
            {
                name: "매장 4호 단장 (8평~)",
                price: 9600000,
                feeType: "USAGE",
                grade: "8평~ / 1인",
                note: "상석, 비석, 1회 설치비 포함 / 9,600,000원~",
                groupType: "4호 (대형)",
                isRepresentative: true
            },
            {
                name: "매장 4호 합장 (10평~)",
                price: 12000000,
                feeType: "USAGE",
                grade: "10평~ / 2인 합장",
                note: "상석, 비석, 1회 설치비 포함 / 12,000,000원~",
                groupType: "4호 (대형)"
            },
            {
                name: "매장 4호 쌍장 (14평~)",
                price: 16800000,
                feeType: "USAGE",
                grade: "14평~ / 2기 나란히",
                note: "상석, 비석, 1회 설치비 포함 / 16,800,000원~",
                groupType: "4호 (대형)"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "추가 비용 및 장사용품",
        rows: [
            {
                name: "추가매장비 / 재설치비",
                price: 750000,
                feeType: "USAGE",
                grade: "",
                note: "2차 매장 또는 석물 재설치 시",
                groupType: "추가 비용 및 장사용품"
            },
            {
                name: "석관",
                price: 200000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "추가 비용 및 장사용품"
            },
            {
                name: "유골함 (한지)",
                price: 250000,
                feeType: "USAGE",
                grade: "",
                note: "",
                groupType: "추가 비용 및 장사용품"
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
console.log('park-0037 prices updated successfully.');
