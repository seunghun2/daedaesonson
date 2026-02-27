const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0031');
if (parkIndex === -1) {
    console.error('park-0031 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0031: 청파동성당 평화묘원
// 아코디언 패턴:
// 1. 매장묘 (사용료/작업비 + 관리비)
// 2. 가족 평장묘 (안치료 + 관리비)
// 3. 개장 관련 비용 (feeType: USAGE로 변경!)
// 4. 석물 및 설치 옵션 (feeType: USAGE로 변경!)

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "시신 매장묘 (단*합장)",
                description: "화장하지 않은 시신을 관째로 매장하는 작업비 (비석조각 포함)",
                price: 1600000,
                feeType: "USAGE",
                grade: "단/합장",
                note: "단/합장 동일",
                groupType: "매장묘 사용료 및 작업비",
                isRepresentative: true
            },
            {
                name: "유골 매장묘 (단*합장)",
                description: "화장 후 유골함에 담아 매장하는 작업비 (비석조각 포함)",
                price: 1200000,
                feeType: "USAGE",
                grade: "단/합장",
                note: "단/합장 동일",
                groupType: "매장묘 사용료 및 작업비"
            },
            {
                name: "시설이용료",
                description: "편의시설외 (개*매장 작업시 적용)",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "매장묘 사용료 및 작업비"
            },
            {
                name: "매장묘 관리비",
                description: "1년(평당)",
                price: 10000,
                feeType: "MAINTENANCE",
                grade: "평당/1년",
                note: "",
                groupType: "매장묘 사용료 및 작업비"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "가족 평장묘",
        rows: [
            {
                name: "가족 평장 묘지 1인 안치료",
                description: "묘지작업비 (비문조각, 신주비문제작 포함)",
                price: 1250000,
                feeType: "USAGE",
                grade: "1인 안치",
                note: "비문조각, 신주 포함",
                groupType: "가족평장묘 분양 안내",
                isRepresentative: true
            },
            {
                name: "가족평장묘 4위 관리비",
                description: "1년",
                price: 40000,
                feeType: "MAINTENANCE",
                grade: "4위/1년",
                note: "",
                groupType: "가족평장묘 분양 안내"
            },
            {
                name: "가족평장묘 8위 관리비",
                description: "1년",
                price: 80000,
                feeType: "MAINTENANCE",
                grade: "8위/1년",
                note: "",
                groupType: "가족평장묘 분양 안내"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "개장 관련 비용",
        rows: [
            {
                name: "시신개장 (단장)",
                description: "화장하지 않은 시신을 이장하는 작업비",
                price: 700000,
                feeType: "USAGE",
                grade: "단장",
                note: "합장시 40만원 추가, 폐기물처리 별도",
                groupType: "개장 관련 비용"
            },
            {
                name: "유골개장 (단장)",
                description: "화장 후 유골을 이장하는 작업비",
                price: 600000,
                feeType: "USAGE",
                grade: "단장",
                note: "합장시 30만원 추가, 폐기물처리 별도",
                groupType: "개장 관련 비용"
            },
            {
                name: "개장 폐기물",
                description: "석물(묘테, 비석, 상석) 폐기 비용",
                price: 500000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "개장 관련 비용"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "석물 및 설치 옵션",
        rows: [
            {
                name: "상석 2.5척 (화병, 설치비 포함)",
                description: "750cm*450cm*150cm / 중국산",
                price: 550000,
                feeType: "USAGE",
                grade: "2.5척",
                note: "화병, 설치비 포함",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "비석 외장 2.0척 (글씨, 설치비 포함)",
                description: "600cm*420cm*100cm / 국내산",
                price: 650000,
                feeType: "USAGE",
                grade: "2.0척 (외장)",
                note: "글씨, 설치비 포함",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "비석 합장 2.3척 (글씨, 설치비 포함)",
                description: "700cm*450cm*150cm / 국내산",
                price: 750000,
                feeType: "USAGE",
                grade: "2.3척 (합장)",
                note: "글씨, 설치비 포함",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "기존비석 묘비명 추가",
                description: "합장, 단장 구분없이 회당",
                price: 300000,
                feeType: "USAGE",
                grade: "명각추가",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "1단 묘테 단장 (설치비 포함)",
                description: "1350cm*2160cm*240cm / 국내산",
                price: 750000,
                feeType: "USAGE",
                grade: "1단 단장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "1단 묘테 합장 (설치비 포함)",
                description: "1650cm*2160cm*240cm / 국내산",
                price: 850000,
                feeType: "USAGE",
                grade: "1단 합장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "2단 묘테 단장 (설치비 포함)",
                description: "1350cm*2160cm*450cm / 국내산",
                price: 1400000,
                feeType: "USAGE",
                grade: "2단 단장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "2단 묘테 합장 (설치비 포함)",
                description: "1650cm*2160cm*450cm / 국내산",
                price: 1500000,
                feeType: "USAGE",
                grade: "2단 합장",
                note: "",
                groupType: "석물 및 설치 옵션"
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
console.log('park-0031 prices updated successfully.');
