const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0033');
if (parkIndex === -1) {
    console.error('park-0033 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0033: 시안가족추모공원
// FIX:
// 1. 매장묘 제목 간결화
// 2. A단지(5,6,7,9,12단지) / B단지(11단지) 그룹(탭) 분리
// 3. 장례용품 feeType -> USAGE (안내규정 탈출)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            // A단지 (5,6,7,9,12단지)
            {
                name: "단장 사용료 (5,6,7,9,12단지)",
                description: "대지사용료",
                price: 10324000,
                feeType: "USAGE",
                grade: "단장",
                note: "",
                groupType: "A단지 (5,6,7,9,12단지)",
                isRepresentative: true
            },
            {
                name: "합장 사용료 (5,6,7,9,12단지)",
                description: "대지사용료",
                price: 15488000,
                feeType: "USAGE",
                grade: "합장",
                note: "",
                groupType: "A단지 (5,6,7,9,12단지)",
                isRepresentative: true
            },
            {
                name: "단장 석물비 (고급형)",
                description: "석물 종류에 따라 가격 변동",
                price: 5574000,
                feeType: "USAGE",
                grade: "단장",
                note: "석물 종류에 따라 변동",
                groupType: "A단지 (5,6,7,9,12단지)"
            },
            {
                name: "합장 석물비 (고급형)",
                description: "석물 종류에 따라 가격 변동",
                price: 8743000,
                feeType: "USAGE",
                grade: "합장",
                note: "석물 종류에 따라 변동",
                groupType: "A단지 (5,6,7,9,12단지)"
            },
            // B단지 (11단지)
            {
                name: "단장 사용료 (11단지)",
                description: "대지사용료",
                price: 6835000,
                feeType: "USAGE",
                grade: "단장",
                note: "",
                groupType: "B단지 (11단지)",
                isRepresentative: true
            },
            {
                name: "합장 사용료 (11단지)",
                description: "대지사용료",
                price: 10253000,
                feeType: "USAGE",
                grade: "합장",
                note: "",
                groupType: "B단지 (11단지)",
                isRepresentative: true
            },
            {
                name: "단장 석물비 (고급형)",
                description: "석물 종류에 따라 가격 변동",
                price: 5574000,
                feeType: "USAGE",
                grade: "단장",
                note: "석물 종류에 따라 변동",
                groupType: "B단지 (11단지)"
            },
            {
                name: "합장 석물비 (고급형)",
                description: "석물 종류에 따라 가격 변동",
                price: 8743000,
                feeType: "USAGE",
                grade: "합장",
                note: "석물 종류에 따라 변동",
                groupType: "B단지 (11단지)"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "장례용품 및 비품",
        rows: [
            {
                name: "장례식사",
                description: "밥, 국, 반찬 (1인 기준)",
                price: 12000,
                feeType: "USAGE",
                grade: "1인",
                note: "",
                groupType: "식사 및 제례"
            },
            {
                name: "일반식사 (두부찌개)",
                description: "1인 기준",
                price: 9000,
                feeType: "USAGE",
                grade: "1인",
                note: "",
                groupType: "식사 및 제례"
            },
            {
                name: "제사음식 (실속형)",
                description: "실속형 제사상",
                price: 150000,
                feeType: "USAGE",
                grade: "제사상",
                note: "",
                groupType: "식사 및 제례"
            },
            {
                name: "제사음식 (표준형)",
                description: "표준형 제사상",
                price: 300000,
                feeType: "USAGE",
                grade: "제사상",
                note: "",
                groupType: "식사 및 제례"
            },
            {
                name: "제사음식 (고급형)",
                description: "고급형 제사상",
                price: 500000,
                feeType: "USAGE",
                grade: "제사상",
                note: "",
                groupType: "식사 및 제례"
            },
            {
                name: "전주한지 유골함",
                description: "종교별 선택",
                price: 90000,
                feeType: "USAGE",
                grade: "유골함",
                note: "",
                groupType: "유골함"
            },
            {
                name: "안동한지 유골함",
                description: "종교별 선택",
                price: 220000,
                feeType: "USAGE",
                grade: "유골함",
                note: "",
                groupType: "유골함"
            },
            {
                name: "실크 유골함",
                description: "종교별 선택",
                price: 290000,
                feeType: "USAGE",
                grade: "유골함",
                note: "",
                groupType: "유골함"
            },
            {
                name: "실크벨벳 유골함",
                description: "종교 무관",
                price: 350000,
                feeType: "USAGE",
                grade: "유골함",
                note: "",
                groupType: "유골함"
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
console.log('park-0033 prices updated successfully.');
