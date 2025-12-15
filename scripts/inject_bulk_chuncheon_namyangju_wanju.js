const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

function updateFacilityByName(nameHint, pricingData) {
    const fIndex = facilities.findIndex(f => f.name.includes(nameHint));

    if (fIndex === -1) {
        console.error(`❌ Facility containing "${nameHint}" not found!`);
        return;
    }

    facilities[fIndex].pricing = pricingData;
    console.log(`✅ ${facilities[fIndex].name} (ID: ${facilities[fIndex].id}) updated.`);
}

console.log("💎 Injecting Gold Standard Data for Chuncheon, Namyangju, Gangneung, Wanju...");

// 1. 춘천안식공원(묘지)
updateFacilityByName("춘천안식", {
    '매장묘': {
        rows: [
            { name: "묘지 단장 1단", price: 3619280, description: "사용료 및 관리비 포함 추정", isRepresentative: true },
            { name: "묘지 단장 2단", price: 3919280, description: "2단", isRepresentative: false },
            { name: "묘지 합장 1단", price: 4878420, description: "합장 1단", isRepresentative: false },
            { name: "묘지 합장 2단", price: 5318420, description: "합장 2단", isRepresentative: false }
        ]
    }
});

// 2. 화도공설묘지(만장)
updateFacilityByName("화도공설", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 15400, description: "1기당 기준면적", isRepresentative: true },
            { name: "묘지사용료 (9.9㎡)", price: 23100, description: "1기당 기준면적", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (6.6㎡)", price: 16300, description: "1기당", isRepresentative: false },
            { name: "묘지관리비 (9.9㎡)", price: 24400, description: "1기당", isRepresentative: false }
        ]
    }
});

// 3. 청솔공원
updateFacilityByName("청솔공원", {
    '매장묘': {
        rows: [
            { name: "매장묘지 (단장/관내)", price: 2506000, description: "6개월 이상 거주", isRepresentative: true },
            { name: "매장묘지 (합장/관내)", price: 3141000, description: "6개월 이상 거주", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "가족봉안묘 (12기/관내)", price: 4491000, description: "추가안치 시 신분확인", isRepresentative: false },
            { name: "가족봉안묘 (24기/관내)", price: 4216000, description: "가격 확인 필요 (오타 가능성)", isRepresentative: false } // 표기된 대로 입력
        ]
    }
});

// 4. 완주군 공설공원묘지
updateFacilityByName("완주군 공설", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (30년)", price: 684000, description: "6.6㎡ 기준", isRepresentative: true }
        ]
    },
    '봉안당': {
        rows: [
            { name: "봉안당 (10년)", price: 100000, description: "2회 연장 가능", isRepresentative: false }
        ]
    },
    '수목장': { // 자연장지
        rows: [
            { name: "자연장지 (40년)", price: 500000, description: "50x50 / 연장불가", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (30년)", price: 1100000, description: "1회 연장가능", isRepresentative: false }
        ]
    }
});

// 5. 수동공설묘지(만장)
updateFacilityByName("수동공설", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (6.6㎡)", price: 15400, description: "1기당 기준면적", isRepresentative: true },
            { name: "묘지사용료 (9.9㎡)", price: 23100, description: "1기당 기준면적", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (6.6㎡)", price: 16300, description: "1기당", isRepresentative: false },
            { name: "묘지관리비 (9.9㎡)", price: 24400, description: "1기당", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities updated by NAME matching.");
