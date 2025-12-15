const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 🛡️ 안전장치: 작업할 ID 범위 설정
const MIN_ID = 176;
const MAX_ID = 180;

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
        // 범위 밖의 후보는 있지만, 범위 내의 타겟이 없는 경우
        console.warn(`⚠️  Found candidates for "${nameHint}" but outside ID range (${MIN_ID}-${MAX_ID}). Skipped to prevent overwrite.`);
        // candidates.forEach(c => console.log(`   - Found: ${c.name} (ID: ${c.id}) -> Skipped`));
        return;
    }

    // 3. 업데이트
    target.pricing = pricingData;
    console.log(`✅ ${target.name} (ID: ${target.id}) updated.`);
}

console.log(`💎 Injecting Gold Standard Data for ${MIN_ID}-${MAX_ID} (with ID Range Guard)...`);

// 1. 유치공설공원묘지 (176번)
updateFacilityByName("유치공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (30년, 4.95㎡)", price: 500000, description: "1기당", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비 (30년)", price: 500000, description: "30년 선납", isRepresentative: false }
        ]
    }
});

// 2. 의령군공설묘지 (177번)
updateFacilityByName("의령군공설", {
    '매장묘': {
        rows: [
            { name: "공설묘지 사용료 (15년)", price: 300000, description: "1기당 8.25㎡", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "공설묘지 관리비 (15년)", price: 150000, description: "15년분", isRepresentative: false }
        ]
    }
});

// 3. 낙원공원 의정부묘원 (178번)
// 여기에서 '낙원공원'만 검색해도, ID가 178번인 것만 찾으므로 156번(김해)은 안전합니다.
updateFacilityByName("낙원공원", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 736860, description: "기본 면적 기준 (공시가)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 9260, description: "면적당 단가 (공시가)", isRepresentative: false }
        ]
    }
});

// 4. (재)시안 가족추모공원 (179번)
updateFacilityByName("시안", {
    '매장묘': {
        rows: [
            { name: "매장묘 (1㎡)", price: 11132, description: "단위 면적당 비용 (공시 기준)", isRepresentative: true },
            { name: "무탁봉안묘", price: 55800, description: "위당 (공시 기준)", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: []
    }
});

// 5. 정왕공설묘지 (180번)
updateFacilityByName("정왕공설", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (시흥시민)", price: 45000, description: "15년 (3회 연장 가능)", isRepresentative: true }
        ]
    },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 15000, description: "15년", isRepresentative: false }
        ]
    }
});

fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log(`✅ IDs ${MIN_ID}-${MAX_ID} processing secured.`);
