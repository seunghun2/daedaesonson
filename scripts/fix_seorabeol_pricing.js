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
    console.log(`✅ ${facilities[fIndex].name} (ID: ${facilities[fIndex].id}) RE-updated with CORRECT prices.`);
}

console.log("💎 RE-Injecting Gold Standard Data for Seorabeol (ID 87)...");

// 서라벌공원묘원 (가격 수정)
updateFacilityByName("서라벌", {
    '매장묘': {
        rows: [
            { name: "묘지 사용료 (1㎡)", price: 332749, description: "1,100,000원/1평 (3.3㎡)", isRepresentative: true },
            { name: "매장묘 (개인형/3평형)", price: 11325000, description: "둘레석, 오석표석, 상석, 꽃병, 향로 포함 (3평)", isRepresentative: false },
            { name: "매장묘 (부부형/1.5평형)", price: 6892500, description: "봉안묘 일반 부부형", isRepresentative: false }
        ]
    },
    '봉안묘': { // 이미지상 '봉안묘'가 부부형
        rows: [
            { name: "봉안묘 (부부형/1.5평형)", price: 6892500, description: "둘레석, 오석표석 등 포함", isRepresentative: true },
            { name: "자연장 평장묘 (개인형/1평형)", price: 4770000, description: "표석, 반침대, 꽃병", isRepresentative: false }
        ]
    },
    '봉안당': { rows: [] },
    '수목장': { rows: [] },
    '옵션': {
        rows: [
            { name: "관리비 (1㎡)", price: 4538, description: "15,000원/1평 (3.3㎡)", isRepresentative: false },
            { name: "분묘설치비", price: 500000, description: "3.3㎡(1평)당", isRepresentative: false }
        ]
    }
});

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
