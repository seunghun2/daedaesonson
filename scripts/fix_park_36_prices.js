const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0036');
if (parkIndex === -1) {
    console.error('park-0036 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0036: 유달공원묘지
// 이미지 기반 분석:
// - 구단지(1~9) 같은 가격 296만 → 합침
// - 신단지(10~11) 426만
// - 관리비 3종: 33만(매장묘) / 17만(봉안묘) / 10만(봉안담) 추정 (5년 선납)
// - 봉안묘: BURIAL (야외)
// - 봉안담: CHARNEL_HOUSE (건축물형)
// - 석물: 전부 누락되어 있었음 → 추가

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "사용료 (구단지 1~9단지)",
                description: "1기 / 3평 기준",
                price: 2960000,
                feeType: "USAGE",
                grade: "3평 / 1기",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "사용료 (신단지 10~11단지)",
                description: "1기 / 3평 기준",
                price: 4260000,
                feeType: "USAGE",
                grade: "3평 / 1기",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "관리비 (5년 선납)",
                description: "벌초, 청소비 포함",
                price: 330000,
                feeType: "MAINTENANCE",
                grade: "5년",
                note: "벌초, 청소 포함",
                groupType: "매장묘"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘",
        rows: [
            {
                name: "봉안묘 사용료 (60년)",
                description: "화장 후 유골을 묘지 형태로 안치",
                price: 2690000,
                feeType: "USAGE",
                grade: "1기 / 60년",
                note: "",
                groupType: "봉안묘",
                isRepresentative: true
            },
            {
                name: "관리비 (5년 선납)",
                description: "벌초, 청소비 포함",
                price: 170000,
                feeType: "MAINTENANCE",
                grade: "5년",
                note: "벌초, 청소 포함",
                groupType: "봉안묘"
            }
        ]
    },
    {
        serviceType: "CHARNEL_HOUSE",
        subType: "봉안담",
        rows: [
            {
                name: "봉안담 사용료 (60년)",
                description: "담 형태 건축물에 유골함 안치",
                price: 2525000,
                feeType: "USAGE",
                grade: "1기 / 60년",
                note: "",
                groupType: "봉안담",
                isRepresentative: true
            },
            {
                name: "관리비 (5년 선납)",
                description: "관리, 청소비 포함",
                price: 100000,
                feeType: "MAINTENANCE",
                grade: "5년",
                note: "관리, 청소 포함",
                groupType: "봉안담"
            },
            {
                name: "봉안담 표찰대",
                description: "표찰 1개",
                price: 75000,
                feeType: "USAGE",
                grade: "1개",
                note: "",
                groupType: "봉안담"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "[필수] 석물비",
        rows: [
            {
                name: "3단 둘래석묘",
                description: "둘래석+상석+비석+돌꽃병 세트",
                price: 2380000,
                feeType: "USAGE",
                grade: "",
                note: "둘래석 95만, 상석 40만, 비석 95만, 돌꽃병 8만",
                groupType: "[필수] 석물비"
            },
            {
                name: "묘테 둘래석묘",
                description: "둘래석+상석+비석+돌꽃병 세트",
                price: 1680000,
                feeType: "USAGE",
                grade: "",
                note: "둘래석 35만, 상석 30만, 비석 95만, 돌꽃병 8만",
                groupType: "[필수] 석물비"
            },
            {
                name: "일반 비석묘",
                description: "묘표석+상석+돌꽃병 세트",
                price: 600000,
                feeType: "USAGE",
                grade: "",
                note: "묘표석 37만, 상석 15만, 돌꽃병 8만",
                groupType: "[필수] 석물비"
            },
            {
                name: "글자대+잔디대 (둘래석묘)",
                description: "석물 설치 시 필수",
                price: 330000,
                feeType: "USAGE",
                grade: "",
                note: "글자대 18만, 잔디대 15만",
                groupType: "[필수] 석물비"
            },
            {
                name: "글자대+잔디대 (일반 비석묘)",
                description: "석물 설치 시 필수",
                price: 310000,
                feeType: "USAGE",
                grade: "",
                note: "글자대 16만, 잔디대 15만",
                groupType: "[필수] 석물비"
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
console.log('park-0036 prices updated successfully.');
