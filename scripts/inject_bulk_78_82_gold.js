const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-000${idNum}`);
    if (fIndex === -1 && idNum < 100) fIndex = facilities.findIndex(f => f.id === `park-00${idNum}`);

    if (fIndex === -1) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 78, 79, 80, 81, 82...");

// 78. 신당동성당 소화묘원
updateFacility(78, "신당동", {
    '매장묘': {
        rows: [
            { name: "매장 사용료 (3.3㎡)", price: 800000, description: "20년 사용료 (조성비 별도)", isRepresentative: true },
            { name: "관리비 (20년 선납)", price: 10000, description: "3.3㎡ 기준", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안 시설 (1기)", price: 3000000, description: "1기(2구, 부부일치) 20년 사용", isRepresentative: false },
            { name: "묘원 운영 유지비", price: 1000000, description: "도로보수, 벌초 등 (20년 선납)", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': {
        rows: []
    }
});

// 79. 오창장미공원
updateFacility(79, "오창", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 1302600, description: "15년 사용료", isRepresentative: true },
            { name: "관리비 (단장/15년)", price: 153750, description: "15년 관리비", isRepresentative: false },
            { name: "매장비 (단장)", price: 158900, description: "15년", isRepresentative: false },
            { name: "사용료 (합장/15년)", price: 1702350, description: "15년 사용료", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "매장비 (합장)", price: 198620, description: "15년", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 208200, description: "15년", isRepresentative: false }
        ]
    }
});

// 80. 평창군 공설묘지
updateFacility(80, "평창", {
    '매장묘': {
        rows: [
            { name: "공설묘원 사용료 (단장)", price: 2000000, description: "분묘 단장 사용료", isRepresentative: true },
            { name: "공설묘원 사용료 (합장)", price: 3000000, description: "분묘 합장 사용료", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "석물 및 마짓비 (단장/하절기)", price: 1970000, description: "3월~11월", isRepresentative: false },
            { name: "석물 및 마짓비 (단장/동절기)", price: 2016000, description: "12월~2월", isRepresentative: false },
            { name: "석물 및 마짓비 (합장/하절기)", price: 2140000, description: "3월~11월", isRepresentative: false },
            { name: "석물 및 마짓비 (합장/동절기)", price: 2216000, description: "12월~2월", isRepresentative: false }
        ]
    }
});

// 81. 충현동산 (무료/자선)
updateFacility(81, "충현", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 0, description: "사용료 없음", isRepresentative: true }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비", price: 0, description: "없음", isRepresentative: false },
            { name: "비석/묘테석", price: 0, description: "무상 설치 (중국산)", isRepresentative: false }
        ]
    }
});

// 82. 세종시공설묘지
updateFacility(82, "세종시", {
    '매장묘': {
        rows: [
            { name: "일반묘지 사용료", price: 90000, description: "사용료", isRepresentative: true },
            { name: "국가유공자묘지 사용료", price: 0, description: "무료", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "일반묘지 관리비", price: 110000, description: "관리비", isRepresentative: false },
            { name: "일반묘지 비석대", price: 805000, description: "비석 설치 비용", isRepresentative: false },
            { name: "국가유공자 비석대", price: 805000, description: "비석 설치 비용", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (78-82) updated with Gold Standard Data.");
