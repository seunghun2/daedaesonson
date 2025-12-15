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

console.log("💎 Injecting Gold Standard Data for 146-150 (Jungnim, Eunkwang, Yangwu, Honam, Samsung)...");

// 1. 중림동성당묘원 (146번)
updateFacilityByName("중림동성당", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (1평당)", price: 1000000, description: "1평 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "15년 관리비 (1평당)", price: 200000, description: "15년분", isRepresentative: false }
        ]
    }
});

// 2. 은광교회 묘지 (147번)
updateFacilityByName("은광교회", {
    '매장묘': {
        rows: [
            { name: "매장 1.5평 (4.95㎡)", price: 1000000, description: "기본 사용료", isRepresentative: true },
            { name: "추가 비용 (합장 등)", price: 500000, description: "추가 비용", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "1년 관리비", price: 30000, description: "연 관리비", isRepresentative: false }
        ]
    }
});

// 3. 양우회 (148번) - 만장
updateFacilityByName("양우회", {
    '매장묘': {
        rows: [
            { name: "묘지 (만장)", price: 0, description: "현재 만장 상태 (가격 정보 없음)", isRepresentative: true }
        ]
    }
});

// 4. 인천호남향우회 (149번) - 만장
updateFacilityByName("호남향우회", {
    '매장묘': {
        rows: [
            { name: "묘지 (만장)", price: 0, description: "현재 만장 상태 (가격 정보 없음)", isRepresentative: true }
        ]
    }
});

// 5. 삼성개발공원묘원(묘지) (150번)
updateFacilityByName("삼성개발", {
    '매장묘': {
        rows: [
            { name: "토지사용료 (1㎡당)", price: 897239, description: "면적에 따라 계산", isRepresentative: true },
            { name: "매장(합장) 총괄비용", price: 7610000, description: "조성, 작업비, 석물비(611만원) 포함", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (1㎡당)", price: 7878, description: "면적당 부과", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities (146-150) updated by NAME matching.");
