const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (191-195)
const MIN_ID = 191;
const MAX_ID = 195;

function updateFacilityByName(nameHint, pricingData) {
    // 1. 이름으로 찾기
    const candidates = facilities.filter(f => f.name.includes(nameHint));

    if (candidates.length === 0) {
        console.error(`❌ Facility containing "${nameHint}" not found!`);
        return;
    }

    // 2. ID 범위로 필터링 (Safe Guard)
    const target = candidates.find(f => {
        const idNum = parseInt(f.id.replace('park-', ''));
        return idNum >= MIN_ID && idNum <= MAX_ID;
    });

    if (!target) {
        console.warn(`⚠️  Found candidates for "${nameHint}" but outside ID range (${MIN_ID}-${MAX_ID}). Skipped.`);
        return;
    }

    // 3. 업데이트
    target.pricing = pricingData;
    console.log(`✅ ${target.name} (ID: ${target.id}) updated.`);
}

console.log(`💎 Injecting Gold Standard Data for ${MIN_ID}-${MAX_ID}...`);

// 1. 양구군공설묘지 (191번)
updateFacilityByName("양구군공설", {
    '매장묘': {
        rows: [
            { name: "묘지 (단장1단)", price: 366120, description: "1기", isRepresentative: true },
            { name: "묘지 (합장1단)", price: 536970, description: "1기", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: []
    }
});

// 2. 양택공원묘지(봉안묘) (192번)
updateFacilityByName("양택공원", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (15년)", price: 487500, description: "김포시민 (3회 연장 가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (15년)", price: 162500, description: "15년분", isRepresentative: false }
        ]
    }
});

// 3. 진달래공원묘원 (193번)
updateFacilityByName("진달래공원", {
    '매장묘': {
        rows: [
            { name: "사용료 (30년)", price: 1000000, description: "3.3㎡ (기본 30년)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (1년)", price: 21000, description: "3.3㎡ 당 1년 비용", isRepresentative: false }
        ]
    }
});

// 4. 안흥동공설묘지(만장) (194번)
updateFacilityByName("안흥동", {
    '매장묘': {
        rows: [
            { name: "묘지사용료 (15년)", price: 132000, description: "3.9㎡ 기준", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지관리비 (15년)", price: 96000, description: "3.9㎡ 기준", isRepresentative: false }
        ]
    }
});

// 5. 여산공설묘지 (195번)
updateFacilityByName("여산공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 및 관리비 (15년)", price: 400000, description: "5㎡ 기준 (통합요금)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "연장료 (10년)", price: 300000, description: "5㎡ 기준", isRepresentative: false }
        ]
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
