const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0028');
if (parkIndex === -1) {
    console.error('park-0028 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0028: (재)화신공원묘원
// 아코디언 분리 패턴:
// 1. 매장묘 사용료 (기본 단가 + 관리비)
// 2. 매장묘 분양금액 (사용료+관리비+용역비+석물 포함 토탈)
// 3. 봉안묘 분양금액 (봉안묘 종류별 + 관리비)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘 사용료",
        rows: [
            {
                name: "A형 매장묘 사용료",
                description: "구 4평형 / 공원조성비, 석축및조경비, 법인운영비 포함",
                price: 1800000,
                feeType: "USAGE",
                grade: "4평형",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "B형 매장묘 사용료",
                description: "구 6평형 / 공원조성비, 석축및조경비, 법인운영비 포함",
                price: 2700000,
                feeType: "USAGE",
                grade: "6평형",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "C형 매장묘 사용료",
                description: "구 8평형 / 공원조성비, 석축및조경비, 법인운영비 포함",
                price: 3600000,
                feeType: "USAGE",
                grade: "8평형",
                note: "",
                groupType: "매장묘 사용료"
            },
            {
                name: "A형 매장묘 관리비",
                description: "구 4평형 / 10년 기준",
                price: 660000,
                feeType: "MAINTENANCE",
                grade: "4평형",
                note: "제초비 10년분(33만원) 포함, 매장일부터 적용",
                groupType: "매장묘 사용료"
            },
            {
                name: "B형 매장묘 관리비",
                description: "구 6평형 / 10년 기준",
                price: 770000,
                feeType: "MAINTENANCE",
                grade: "6평형",
                note: "제초비 10년분(33만원) 포함, 매장일부터 적용",
                groupType: "매장묘 사용료"
            },
            {
                name: "C형 매장묘 관리비",
                description: "구 8평형 / 10년 기준",
                price: 880000,
                feeType: "MAINTENANCE",
                grade: "8평형",
                note: "제초비 10년분(33만원) 포함, 매장일부터 적용",
                groupType: "매장묘 사용료"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "매장묘 분양금액",
        rows: [
            {
                name: "A형 매장묘 분양금액",
                description: "구 4평형 / 사용료, 관리비 10년(제초비 포함), 용역비, 석물비용 포함",
                price: 4800000,
                feeType: "USAGE",
                grade: "4평형",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘 분양금액",
                isRepresentative: true
            },
            {
                name: "B형 매장묘 분양금액",
                description: "구 6평형 / 사용료, 관리비 10년(제초비 포함), 용역비, 석물비용 포함",
                price: 6800000,
                feeType: "USAGE",
                grade: "6평형",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘 분양금액",
                isRepresentative: true
            },
            {
                name: "C형 매장묘 분양금액",
                description: "구 8평형 / 사용료, 관리비 10년(제초비 포함), 용역비, 석물비용 포함",
                price: 8500000,
                feeType: "USAGE",
                grade: "8평형",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘 분양금액",
                isRepresentative: true
            },
            {
                name: "D형 매장묘 분양금액",
                description: "구 8평형 특수묘 / 사용료, 관리비 10년(제초비 포함), 용역비, 석물비용 포함",
                price: 13500000,
                feeType: "USAGE",
                grade: "8평형 특수",
                note: "합장사용시 100만원 추가",
                groupType: "매장묘 분양금액",
                isRepresentative: true
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "봉안묘 분양금액",
        rows: [
            {
                name: "평장형 봉안묘",
                description: "사용료, 15년관리비, 봉안석물 포함",
                price: 2700000,
                feeType: "USAGE",
                grade: null,
                note: "합장시 100만원 추가",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "부부형 봉안묘",
                description: "A형 구4평형 / 사용료, 10년관리비, 봉안석물 포함",
                price: 5000000,
                feeType: "USAGE",
                grade: "구4평형",
                note: "평형 변경시 비용 추가",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "10기형 가족 봉안묘",
                description: "A형 구4평형 / 사용료, 10년관리비, 봉안석물 포함",
                price: 8000000,
                feeType: "USAGE",
                grade: "10기",
                note: "평형 및 기수 변경 가능",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "개방형 봉안묘 18기형",
                description: "사용료, 10년관리비, 봉안석물 포함",
                price: 13000000,
                feeType: "USAGE",
                grade: "18기",
                note: "",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "개방형 봉안묘 24기형",
                description: "사용료, 10년관리비, 봉안석물 포함",
                price: 16000000,
                feeType: "USAGE",
                grade: "24기",
                note: "",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            {
                name: "24기형 봉안묘",
                description: "구 16평형 / 사용료, 10년관리비, 봉안석물 포함",
                price: 25000000,
                feeType: "USAGE",
                grade: "24기 / 16평형",
                note: "",
                groupType: "봉안묘 분양금액",
                isRepresentative: true
            },
            // 관리비
            {
                name: "평장형 납골묘 관리비",
                description: "15년 기준 / 1년 33,000원",
                price: 495000,
                feeType: "MAINTENANCE",
                grade: null,
                note: "",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "개방형 납골묘 18기형 관리비",
                description: "10년 기준 / 1년 72,000원",
                price: 720000,
                feeType: "MAINTENANCE",
                grade: "18기",
                note: "",
                groupType: "봉안묘 분양금액"
            },
            {
                name: "개방형 납골묘 24기형 관리비",
                description: "10년 기준 / 1년 96,000원",
                price: 960000,
                feeType: "MAINTENANCE",
                grade: "24기",
                note: "",
                groupType: "봉안묘 분양금액"
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
console.log('park-0028 prices updated successfully.');
