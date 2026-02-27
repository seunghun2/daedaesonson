const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0029');
if (parkIndex === -1) {
    console.error('park-0029 not found');
    process.exit(1);
}

const park = data[parkIndex];

// park-0029
// FIX:
// 1. 시신/유골 설명 보강 (차이점 명확히)
// 2. 단장/합장 그룹화 유지
// 3. 석물 아코디언 유지

const newPrices = [
    {
        serviceType: "BURIAL",
        subType: "매장묘",
        rows: [
            {
                name: "시신 매장묘 (단장)",
                description: "화장하지 않은 시신을 관째로 매장 (잔디, 봉분비 포함)",
                price: 1300000,
                feeType: "USAGE",
                grade: "단장",
                note: "",
                groupType: "매장묘 사용료 및 작업비",
                isRepresentative: true
            },
            {
                name: "시신 매장묘 (합장)",
                description: "화장하지 않은 시신을 관째로 매장 (잔디, 봉분비 포함)",
                price: 1400000,
                feeType: "USAGE",
                grade: "합장",
                note: "",
                groupType: "매장묘 사용료 및 작업비",
                isRepresentative: true
            },
            {
                name: "유골 매장묘 (단장)",
                description: "화장 후 유골함에 담아 매장 (잔디, 봉분비 포함)",
                price: 900000,
                feeType: "USAGE",
                grade: "단장",
                note: "",
                groupType: "매장묘 사용료 및 작업비"
            },
            {
                name: "유골 매장묘 (합장)",
                description: "화장 후 유골함에 담아 매장 (잔디, 봉분비 포함)",
                price: 1000000,
                feeType: "USAGE",
                grade: "합장",
                note: "",
                groupType: "매장묘 사용료 및 작업비"
            },
            {
                name: "시설 이용료",
                description: "편의시설 등 외",
                price: 100000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "매장묘 사용료 및 작업비"
            },
            {
                name: "매장묘 관리비",
                description: "1년 (평당)",
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
        subType: "평장묘",
        rows: [
            {
                name: "가족평장묘지 분양",
                description: "최대 안치 위수 : 8위",
                price: 15000000,
                feeType: "USAGE",
                grade: "8위 기준",
                note: "",
                groupType: "가족 평장묘 분양",
                isRepresentative: true
            },
            {
                name: "가족평장묘 안치비",
                description: "1위 안치비",
                price: 400000,
                feeType: "USAGE",
                grade: "1위당",
                note: "",
                groupType: "가족 평장묘 분양"
            },
            {
                name: "가족평장묘 관리비",
                description: "1년 기준",
                price: 80000,
                feeType: "MAINTENANCE",
                grade: "1년",
                note: "",
                groupType: "가족 평장묘 분양"
            }
        ]
    },
    {
        serviceType: "BURIAL",
        subType: "석물 및 설치 옵션",
        rows: [
            {
                name: "상석 2.5척 (화병, 설치비 포함)",
                description: "76cm x 51.5cm x 15cm",
                price: 550000,
                feeType: "USAGE",
                grade: "2.5척",
                note: "화병, 설치비 포함",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "상석 3.0척",
                description: "90cm x 60cm x 18cm",
                price: 750000,
                feeType: "USAGE",
                grade: "3.0척",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "비석 (단장용/외장용)",
                description: "60cm x 43cm x 12cm",
                price: 650000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "비석 (합장용)",
                description: "70cm x 45cm x 12cm",
                price: 750000,
                feeType: "USAGE",
                grade: null,
                note: "",
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
                name: "1단 묘테 (단장)",
                description: "150cm x 213cm x 25cm (설치비 포함)",
                price: 750000,
                feeType: "USAGE",
                grade: "1단 단장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "1단 묘테 (합장)",
                description: "167cm x 213cm x 25cm (설치비 포함)",
                price: 850000,
                feeType: "USAGE",
                grade: "1단 합장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "2단 묘테 (단장)",
                description: "151cm x 197cm x 50cm (설치비 포함)",
                price: 1400000,
                feeType: "USAGE",
                grade: "2단 단장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "2단 묘테 (합장)",
                description: "167cm x 197cm x 50cm (설치비 포함)",
                price: 1500000,
                feeType: "USAGE",
                grade: "2단 합장",
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "가족평장묘 동판 비문 (이름)",
                description: "25cm x 7cm",
                price: 350000,
                feeType: "USAGE",
                grade: null,
                note: "",
                groupType: "석물 및 설치 옵션"
            },
            {
                name: "가족평장묘 비문",
                description: "동판 외 기타",
                price: 400000,
                feeType: "USAGE",
                grade: null,
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
console.log('park-0029 prices updated successfully.');
