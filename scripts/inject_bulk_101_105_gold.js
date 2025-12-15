const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacility(idNum, nameHint, pricingData) {
    let fIndex = facilities.findIndex(f => f.id === `park-0${idNum}`); // park-0101 형식
    if (fIndex === -1) fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility ID ${idNum} not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ID ${facilities[fIndex].id} (${facilities[fIndex].name}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for 101~105 (Public Cemeteries)...");

// 101. 홍천군공설묘원
updateFacility(101, "홍천군", {
    '매장묘': {
        rows: [
            { name: "분묘 사용료 (단장)", price: 1125000, description: "단장 기준", isRepresentative: true },
            { name: "분묘 사용료 (합장)", price: 1500000, description: "합장 기준", isRepresentative: false },
            { name: "분묘 사용료 (국가유공자)", price: 0, description: "사용료 면제", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "봉안묘 사용료", price: 375000, description: "1기 기준", isRepresentative: false }
        ]
    }
});

// 102. 이천시대월공설공원묘지
updateFacility(102, "이천시대월", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 200000, description: "1기당 기준면적", isRepresentative: true },
            { name: "연장 사용료", price: 200000, description: "연장 시 동일", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비", price: 250000, description: "1기당", isRepresentative: false },
            { name: "연장 관리비", price: 250000, description: "연장 시", isRepresentative: false }
        ]
    }
});

// 103. 진리공설묘지
updateFacility(103, "진리", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (단장/15년)", price: 60000, description: "옹진군민 기준", isRepresentative: true },
            { name: "묘지 사용료 (합장/15년)", price: 90000, description: "옹진군민 기준", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 30000, description: "15년 관리비", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 45000, description: "15년 관리비", isRepresentative: false }
        ]
    }
});

// 104. 이천시백사공설공원묘지
updateFacility(104, "이천시백사", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 200000, description: "1기당 기준면적", isRepresentative: true },
            { name: "연장 사용료", price: 200000, description: "연장 시", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비", price: 250000, description: "1기당", isRepresentative: false },
            { name: "연장 관리비", price: 250000, description: "연장 시", isRepresentative: false }
        ]
    }
});

// 105. 점봉동 공원묘지
updateFacility(105, "점봉동", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 150000, description: "여주시민", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 225000, description: "여주시민", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 150000, description: "여주시민", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 225000, description: "여주시민", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Public Facilities (101-105) updated.");
