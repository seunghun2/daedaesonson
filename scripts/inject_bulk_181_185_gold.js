const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정 (181-185)
const MIN_ID = 181;
const MAX_ID = 185;

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

// 1. 장수동공설묘지 (181번)
updateFacilityByName("장수동", {
    '매장묘': {
        rows: [
            { name: "비조성묘지 사용료 (4.95㎡)", price: 3600, description: "기존 묘지 (매장 불가)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "비조성묘지 관리비 (4.95㎡)", price: 17800, description: "관리비", isRepresentative: false }
        ]
    }
});

// 2. 황산병온공설묘지 (182번)
updateFacilityByName("황산병온", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (15년)", price: 90000, description: "1기당 (2회 연장 가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (15년)", price: 100000, description: "30년 (2회 연장 가능)", isRepresentative: false }
        ]
    }
});

// 3. 수산동공설묘지 (183번)
updateFacilityByName("수산동", {
    '매장묘': {
        rows: [
            { name: "비조성묘지 사용료 (4.95㎡)", price: 3600, description: "기존 묘지 (매장 불가)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "비조성묘지 관리비 (4.95㎡)", price: 17800, description: "관리비", isRepresentative: false }
        ]
    }
});

// 4. 인천가족공원 묘지 (184번)
updateFacilityByName("인천가족공원 묘지", { // '인천가족공원' is popular name, be specific or rely on ID guard.
    '매장묘': {
        rows: [
            { name: "계단식 일반조성묘", price: 30000, description: "1년 비용 (10년 단위 징수)", isRepresentative: true },
            { name: "가족봉안묘", price: 50000, description: "1년 비용 (10년 단위 징수)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: []
    }
});

// 5. 전곡읍공설묘지 (185번)
updateFacilityByName("전곡읍", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료", price: 15400, description: "연천군민 (15년)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비", price: 16300, description: "연천군민 (15년)", isRepresentative: false }
        ]
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
