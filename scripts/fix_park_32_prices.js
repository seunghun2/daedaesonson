const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0032');
if (parkIndex === -1) {
    console.error('park-0032 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0032
// 고객 친화적 네이밍 + 아코디언 분리

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "묘지사용료 (㎡당 참고단가)",
                description: "㎡당 기준 단가",
                price: 820030,
                feeType: "USAGE",
                grade: "㎡당",
                note: "참고용 단위 단가",
                groupType: "매장묘"
            },
            {
                name: "연간 관리비 (㎡당)",
                description: "㎡당 기준 단가",
                price: 6290,
                feeType: "MAINTENANCE",
                grade: "㎡당/1년",
                note: "참고용 단위 단가",
                groupType: "매장묘"
            },
            {
                name: "단장형 매장묘 분양가",
                description: "묘지사용료, 석물비, 작업비 포함 (안장비 별도)",
                price: 15500000,
                feeType: "USAGE",
                grade: "단장",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "1단형 매장묘 분양가",
                description: "묘지사용료, 석물비, 작업비 포함 (안장비 별도)",
                price: 18050000,
                feeType: "USAGE",
                grade: "1단",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "2단형 매장묘 분양가",
                description: "묘지사용료, 석물비, 작업비 포함 (안장비 별도)",
                price: 19550000,
                feeType: "USAGE",
                grade: "2단",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘",
                isRepresentative: true
            },
            {
                name: "특수묘 매장묘 분양가",
                description: "묘지사용료, 석물비, 작업비 포함 (안장비 별도)",
                price: 22950000,
                feeType: "USAGE",
                grade: "특",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "매장 작업비",
        rows: [
            {
                name: "시신 매장 작업비",
                description: "화장하지 않은 시신을 관째로 매장하는 작업비",
                price: 3000000,
                feeType: "USAGE",
                grade: "시신 매장",
                note: "",
                groupType: "매장 작업비"
            },
            {
                name: "유골 매장 작업비",
                description: "화장 후 유골함에 담아 매장하는 작업비",
                price: 1500000,
                feeType: "USAGE",
                grade: "유골 매장",
                note: "",
                groupType: "매장 작업비"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "장례용품 및 부대비용",
        rows: [
            {
                name: "횡대 (매장용 목재 받침)",
                description: "매장시 관 위에 덮는 목재",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "장례용품 및 부대비용"
            },
            {
                name: "화강석관 (석재 관)",
                description: "화강석 재질 석관",
                price: 500000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "장례용품 및 부대비용"
            },
            {
                name: "화병 (묘지용 돌꽃병)",
                description: "묘지 장식용 돌꽃병",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "장례용품 및 부대비용"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "수리 및 기타",
        rows: [
            {
                name: "분상보수 수리",
                description: "봉분 및 묘지 보수 작업",
                price: 300000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "수리 및 기타"
            },
            {
                name: "1단묘테 수리",
                description: "1단 묘테 보수 작업",
                price: 300000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "수리 및 기타"
            },
            {
                name: "2단/특묘테 수리",
                description: "2단 또는 특수 묘테 보수 작업",
                price: 400000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "수리 및 기타"
            },
            {
                name: "각자비 (대)",
                description: "비석 글씨 새기기 (자당)",
                price: 130000,
                feeType: "USAGE",
                grade: "대",
                note: "자당 단가",
                groupType: "수리 및 기타"
            },
            {
                name: "각자비 (중)",
                description: "비석 글씨 새기기 (자당)",
                price: 8000,
                feeType: "USAGE",
                grade: "중",
                note: "자당 단가",
                groupType: "수리 및 기타"
            },
            {
                name: "각자비 (소)",
                description: "비석 글씨 새기기 (자당)",
                price: 2000,
                feeType: "USAGE",
                grade: "소",
                note: "자당 단가",
                groupType: "수리 및 기타"
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
console.log('park-0032 prices updated successfully.');
