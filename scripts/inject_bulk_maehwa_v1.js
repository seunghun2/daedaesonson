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

console.log("💎 Injecting Gold Standard Data for Maehwa, Youngdong, Seorabeol, Sejong-ro, Daejeon...");

// 1. 매화공원묘지
updateFacilityByName("매화", {
    '매장묘': {
        rows: [
            { name: "사용료 (단장/15년)", price: 70000, description: "15년 사용료", isRepresentative: true },
            { name: "사용료 (합장/15년)", price: 105000, description: "15년 사용료", isRepresentative: false },
            { name: "매장비 (단장)", price: 158900, description: "15년", isRepresentative: false },
            { name: "매장비 (합장)", price: 198620, description: "15년", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (단장/15년)", price: 153750, description: "15년", isRepresentative: false },
            { name: "관리비 (합장/15년)", price: 208200, description: "15년", isRepresentative: false }
        ]
    }
});

// 2. 영동공원묘원
updateFacilityByName("영동공원", {
    '매장묘': {
        rows: [
            { name: "매장묘지 사용료 (평당)", price: 300000, description: "평당 사용료", isRepresentative: true },
            { name: "매장묘지 관리비 (기타)", price: 70000, description: "기타 비용", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "납골묘지 사용료 (평당)", price: 650000, description: "평당 사용료", isRepresentative: false },
            { name: "납골묘지 관리비 (10평당)", price: 70000, description: "10평당 기준?", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "단장 (1기)", price: 4100000, description: "조성비 등 포함 추정", isRepresentative: false },
            { name: "합장 (1기)", price: 5100000, description: "조성비 등 포함 추정", isRepresentative: false }
        ]
    }
});

// 3. 서라벌공원묘원
updateFacilityByName("서라벌", {
    '매장묘': {
        rows: [
            { name: "사용료 (1㎡)", price: 332749, description: "110만원/1평 기준", isRepresentative: true },
            { name: "매장묘 (일반 개인형)", price: 11325000, description: "둘레석, 오석표석, 상석, 꽃병, 향로", isRepresentative: false },
            { name: "매장묘 (일반 부부형)", price: 6892500, description: "1.5평형?", isRepresentative: false }
        ]
    },
    '봉안묘': {
        rows: [
            { name: "자연장 평장묘 (일반 개인형)", price: 4770000, description: "표석, 반사대, 꽃병", isRepresentative: false }
        ]
    },
    '옵션': {
        rows: [
            { name: "관리비 (1㎡)", price: 4538, description: "15,000원/1평", isRepresentative: false },
            { name: "부묘설치비", price: 500000, description: "3.3㎡(1평)", isRepresentative: false }
        ]
    }
});

// 4. (재)천주교세종로묘원
updateFacilityByName("세종로", { // '세종로'로 검색
    '매장묘': {
        rows: [
            { name: "묘지 사용료", price: 3000000, description: "9.92㎡", isRepresentative: true },
            { name: "평장묘지 (분양규격)", price: 9000000, description: "3.3㎡ (합장)", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "묘지 관리비", price: 5000, description: "3.3㎡당", isRepresentative: false },
            { name: "평장묘지 관리비", price: 66667, description: "3.3㎡당", isRepresentative: false },
            { name: "1단 묘테", price: 800000, description: "석물", isRepresentative: false },
            { name: "2단 묘테", price: 1500000, description: "석물", isRepresentative: false }
        ]
    }
});

// 5. 대전추모공원 가족묘원
updateFacilityByName("대전추모", {
    '매장묘': {
        rows: [
            { name: "묘지 (단장 재계약)", price: 363000, description: "1기당 / 15년", isRepresentative: false },
            { name: "묘지 (합장 재계약)", price: 544500, description: "1기당 / 15년", isRepresentative: false },
            { name: "가족묘원 (재계약)", price: 550000, description: "1기당 / 15년", isRepresentative: false },
            { name: "가족묘원 (관리비)", price: 516000, description: "1기당 / 5년 단위? (확인필요)", isRepresentative: false }
        ]
    },
    '봉안당': {
        rows: [
            { name: "봉안 (관내)", price: 200000, description: "1구당 / 15년", isRepresentative: true },
            { name: "봉안 (관외)", price: 400000, description: "1구당 / 15년", isRepresentative: false }
        ]
    },
    '수목장': { rows: [] },
    '옵션': { rows: [] }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ 5 Facilities updated by NAME matching.");
