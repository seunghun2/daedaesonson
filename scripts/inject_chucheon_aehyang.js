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

console.log("💎 Injecting Gold Standard Data for Chuncheon, Changwon, Hakmyung, Baekran, Aehyang...");

// 1. 재단법인 춘천공원묘원
updateFacilityByName("춘천공원", {
    '매장묘': {
        rows: [
            { name: "권재 묘지 (관리비)", price: 15000, description: "평당 15,000원", isRepresentative: false },
            { name: "2024년부터 (관리비)", price: 17000, description: "평당 17,000원", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': {
        rows: [
            { name: "입석형 (3.3㎡)", price: 0, description: "가격 확인 필요 (이미지에 0원)", isRepresentative: false }
        ]
    },
    '옵션': { rows: [] }
});

// 2. 창원공원묘원
updateFacilityByName("창원공원", {
    '매장묘': {
        rows: [
            { name: "사용료 (1기)", price: 2700000, description: "1기 기준", isRepresentative: true },
            { name: "관리비 (1년)", price: 20000, description: "1기/1년", isRepresentative: false },
            { name: "매장묘 (651만원~)", price: 6517900, description: "사용료/관리비/석물/작업비 포함", isRepresentative: false },
            { name: "봉안묘 (904만원~)", price: 9044000, description: "사용료/관리비/석물/작업비 포함", isRepresentative: false },
            { name: "평장묘 (368만원~)", price: 3680000, description: "사용료/관리비/석물/작업비 포함", isRepresentative: false }
        ]
    },
    '수목장': {
        rows: [
            { name: "수목형 (317만원~)", price: 3170000, description: "사용료/관리비/석물/작업비 포함", isRepresentative: true }
        ]
    }
});

// 3. (재)학명묘원
updateFacilityByName("학명", {
    '매장묘': {
        rows: [
            { name: "사용료 (평당)", price: 800000, description: "평당 80만원", isRepresentative: true },
            { name: "분묘 1기 (234만원)", price: 2340000, description: "1기 합계", isRepresentative: false },
            { name: "분묘 2기 (520만원)", price: 5200000, description: "2기 합계", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (평당)", price: 12000, description: "평당 12,000원", isRepresentative: false },
            { name: "기본 상석", price: 300000, description: "가로 70cm", isRepresentative: false },
            { name: "보급형 상석", price: 450000, description: "가로 75cm", isRepresentative: false }
        ]
    }
});

// 4. 백란공원묘원
updateFacilityByName("백란", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (3.3㎡)", price: 1600000, description: "3.3㎡(1평)당", isRepresentative: true },
            { name: "1단 석물", price: 3960000, description: "묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "2단 석물", price: 5940000, description: "묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "3단 석물", price: 7920000, description: "묘테, 비석, 상석, 화병", isRepresentative: false },
            { name: "매장 작업비", price: 3000000, description: "1기당 안치비 포함", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "연간 관리비 (3.3㎡)", price: 22000, description: "3.3㎡(1평)당", isRepresentative: false }
        ]
    }
});

// 5. 애향묘지 (제주시 어승생 한울누리공원이 아니라 애향묘지가 맞음 하지만 이미지 내용은 '제외동포묘역')
// 이미지 5번째 내용이 "제외동포묘역(애향) 이용료" 라고 되어있음.
updateFacilityByName("애향", {
    '매장묘': {
        rows: [
            { name: "제외동포묘역 이용료 (부부)", price: 30000, description: "제외동포 및 배우자", isRepresentative: true },
            { name: "제외동포묘역 관리비 (부부)", price: 170000, description: "제외동포 및 배우자", isRepresentative: false },
            { name: "제외동포묘역 이용료 (단장)", price: 50000, description: "1인", isRepresentative: false },
            { name: "제외동포묘역 관리비 (단장)", price: 250000, description: "1인", isRepresentative: false },
            { name: "이북도민묘역 이용료", price: 50000, description: "이북도민 등", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities updated by NAME matching.");
