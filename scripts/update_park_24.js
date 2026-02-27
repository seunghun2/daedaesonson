const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parkId = 'park-0024';
const parkIndex = data.findIndex(f => f.id === parkId);

if (parkIndex === -1) {
    console.error('Park not found');
    process.exit(1);
}

const park = data[parkIndex];

if (!park.priceInfo || !park.priceInfo.standardizedPrices) {
    console.error('No standardized prices found');
    process.exit(1);
}

const burialGroupIndex = park.priceInfo.standardizedPrices.findIndex(s => s.serviceType === 'BURIAL');

const newRows = [
    {
        name: "토지사용료(15년 사용)",
        price: 962000,
        feeType: "USAGE",
        grade: "평당",
        note: "매장묘 조성에 필요한 토지 사용 비용입니다. (✅ 15년 단위로 계약 및 별도 연장 갱신 필요)",
        isRepresentative: true,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: 15,
        durationType: "YEAR",
        residency: "ALL"
    },
    {
        name: "시신매장작업비",
        price: 1900000,
        feeType: "USAGE",
        grade: "1기당",
        note: "화장하지 않은 시신을 온전하게 관째로 모실 때 발생하는 묘지 굴착 및 하관 작업 비용입니다.",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: null,
        durationType: null,
        residency: "ALL"
    },
    {
        name: "유골매장작업비",
        price: 800000,
        feeType: "USAGE",
        grade: "유골합장1기당",
        note: "화장한 유골을 매장묘 형태의 기존 묘역에 추가로 합장하여 모시는 작업 비용입니다.",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: null,
        durationType: null,
        residency: "ALL"
    },
    {
        name: "분상보수작업비",
        price: 180000,
        feeType: "MAINTENANCE",
        grade: "평당",
        note: "무너진 봉분이나 떼(잔디)를 재정비하고 단정하게 보수하는 작업 비용입니다.",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: null,
        durationType: null,
        residency: "ALL"
    },
    {
        name: "축대작업비",
        price: 1000000,
        feeType: "INSTALLATION",
        grade: "평당",
        note: "비탈진 묘역의 흙이 무너지지 않도록 경계면에 돌이나 블록으로 축대를 쌓는 기초 공사 비용입니다.",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: null,
        durationType: null,
        residency: "ALL"
    },
    {
        name: "공동관리비",
        price: 14700,
        feeType: "MAINTENANCE",
        grade: "평당",
        note: "벌초, 진입로 및 외곽 조경 유지보수 등 묘역 전체 관리를 위해 발생하는 비용입니다. (✅ 1년 단위 필수 항목)",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: 1,
        durationType: "YEAR",
        residency: "ALL"
    },
    {
        name: "재래식유골매장비",
        price: 1900000,
        feeType: "USAGE",
        grade: "재래식유골합장1기당",
        note: "전통 재래식 방식으로 조성된 묘역에 유골을 합장하는 공사 및 작업 비용입니다.",
        isRepresentative: false,
        groupType: "토지 분양 및 기본 매장 작업비 (필수)",
        duration: null,
        durationType: null,
        residency: "ALL"
    }
];

if (burialGroupIndex !== -1) {
    park.priceInfo.standardizedPrices[burialGroupIndex].rows = newRows;
    park.priceInfo.standardizedPrices[burialGroupIndex].subType = "매장묘";
} else {
    park.priceInfo.standardizedPrices.unshift({
        serviceType: 'BURIAL',
        subType: '매장묘',
        unit: '원',
        rows: newRows
    });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated park-0024 in facilities.json');
