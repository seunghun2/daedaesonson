const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0035');
if (parkIndex === -1) {
    console.error('park-0035 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0035: (재)동산공원묘원
// 패턴 적용:
// 1. 매장묘 (사용료 + 관리비 + [필수]설치비 + 묘지 유형)
// 2. 평장묘 (평장 1구/2구)
// 3. 봉안묘 (1기/2기/가족) - serviceType: BURIAL
// 4. 봉안담 - serviceType: BURIAL (야외)
// 5. 석물 및 부대비용 (글자대, 석등, 사자상, 고령토)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지 사용료 (1평당)",
                description: "1평당 기준 단가",
                price: 900000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "관리비 (1평당/년)",
                description: "1년 (1평당)",
                price: 15000,
                feeType: "MAINTENANCE",
                grade: "1평당/1년",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "[필수] 설치비 (1평당)",
                description: "매장 시 필수 설치 작업비",
                price: 400000,
                feeType: "USAGE",
                grade: "1평당",
                note: "",
                groupType: "매장묘"
            },
            {
                name: "사각묘 (3.6평)",
                description: "사각형 매장묘",
                price: 3500000,
                feeType: "USAGE",
                grade: "3.6평",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "원형 합장묘 (5.4평)",
                description: "원형 합장 매장묘",
                price: 3700000,
                feeType: "USAGE",
                grade: "5.4평",
                note: "",
                groupType: "매장묘",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "평장묘",
        rows: [
            {
                name: "평장묘 1구 (0.7평)",
                description: "봉분 없이 평평하게 조성",
                price: 1050000,
                feeType: "USAGE",
                grade: "0.7평 / 1구",
                note: "",
                groupType: "평장묘",
                isRepresentative: true
            },
            {
                name: "평장묘 2구 (1.5평)",
                description: "봉분 없이 평평하게 조성",
                price: 2100000,
                feeType: "USAGE",
                grade: "1.5평 / 2구",
                note: "",
                groupType: "평장묘",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘",
        rows: [
            {
                name: "봉안묘 1기 (0.7평)",
                description: "화장 후 유골을 묘지 형태로 안치",
                price: 2000000,
                feeType: "USAGE",
                grade: "0.7평 / 1기",
                note: "",
                groupType: "봉안묘",
                isRepresentative: true
            },
            {
                name: "봉안묘 2기 (1.5평)",
                description: "화장 후 유골을 묘지 형태로 안치",
                price: 2800000,
                feeType: "USAGE",
                grade: "1.5평 / 2기",
                note: "",
                groupType: "봉안묘",
                isRepresentative: true
            },
            {
                name: "가족 봉안묘 (5.8평/8기)",
                description: "최대 8기까지 안치 가능한 가족형",
                price: 7500000,
                feeType: "USAGE",
                grade: "5.8평 / 8기",
                note: "",
                groupType: "봉안묘",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안담",
        rows: [
            {
                name: "봉안담 사용료",
                description: "설치비, 관리비(10년) 포함",
                price: 1300000,
                feeType: "USAGE",
                grade: "10년 사용",
                note: "설치비, 관리비 포함",
                groupType: "봉안담",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "석물 및 부대비용",
        rows: [
            {
                name: "고령토 (포당)",
                description: "사각묘/원형묘 명당토 20포 사용",
                price: 20000,
                feeType: "USAGE",
                grade: "1포당",
                note: "사각묘/원형묘 약 20포 필요",
                groupType: "석물 및 부대비용"
            },
            {
                name: "글자대 (大)",
                description: "비석 글씨 새기기",
                price: 7000,
                feeType: "USAGE",
                grade: "大 / 자당",
                note: "",
                groupType: "석물 및 부대비용"
            },
            {
                name: "글자대 (小)",
                description: "비석 글씨 새기기",
                price: 1500,
                feeType: "USAGE",
                grade: "小 / 자당",
                note: "",
                groupType: "석물 및 부대비용"
            },
            {
                name: "석등 (개당)",
                description: "묘지 장식용 돌등",
                price: 750000,
                feeType: "USAGE",
                grade: "1개",
                note: "",
                groupType: "석물 및 부대비용"
            },
            {
                name: "사자상 (한쌍)",
                description: "묘지 장식용 석조 사자상",
                price: 1200000,
                feeType: "USAGE",
                grade: "한쌍",
                note: "",
                groupType: "석물 및 부대비용"
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
console.log('park-0035 prices updated successfully.');
