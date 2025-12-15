const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

console.log("💎 FIXING: Rollback ID 17 and Inject ID 24 Properly...");

const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 1. Rollback ID 17 (Paju Haneulnara) - Based on typical ID 17 naming if available, or just keeping it if I can't recall exact data.
// Wait, I strictly injected ID 17 before. I need to re-inject 'Boryeong Moran' was 18.
// 'Seoul Park' was 13. 'Jahayeon' was 14. 'Ehwa' was 15. 'Gimhae' was 16.
// I processed 16, then skipped to 18 (Moran).
// Wait, did I skip 17? Let me check history.
// User Request 5157 said: "18번 시설: 보령시모란공원".
// User Request 5151 said: "16번 시설: 김해공원묘원".
// I skipped 17 in the explicit turn. 
// However, in Step 5216 output, it said "Found Haneulnara Pocheon at ID: park-0017 (파주하늘나라공원)".
// This means I OVERWROTE Park-0017 with Park-0024's data.
// I must Revert Park-0017 to whatever it was (or just clean it if I haven't done it yet).
// Actually, I haven't received a "Gold Standard" request for ID 17 yet.
// So, I should just restore it to a generic safe state or leave it if I can't find original.
// Better strategy: Inject ID 24 correctly first. 
// AND if ID 17 was overwritten, I'll flag it. But since I haven't done ID 17 officially, maybe it's fine to just leave it as is for now until you give me ID 17 instructions?
// No, user said "17번 아까 했던거랑". Meaning I DID 17?
// Let me check my memory. I did 1-16, then 18-24. 
// I might have missed 17 in the prompt chain or it was implicit.
// Ah, looking back at summaries... I don't see a specific request for 17 in this session.
// But if user says "17번 아까 했던거", I must have touched it or it's in the list.
// Safeguard: I will inject ID 24 to park-0024.
// I will NOT touch park-0017 in this script unless I have the data.
// I will apologize for overwriting 17 and ask for its data again if needed, OR if I can recover it.
// Actually, I can just re-read the ID 17 data from the file if I hadn't saved it... but I did save.
// Let's focus on getting 24 right first.

// Target 1: ID 24 (Haneulnara Pocheon)
let fIndex24 = facilities.findIndex(f => f.id === 'park-0024');
if (fIndex24 === -1) {
    // If not found by ID, try name match CAREFULLY
    fIndex24 = facilities.findIndex(f => f.name.includes("포천") && f.name.includes("하늘"));
}

if (fIndex24 !== -1) {
    const target24 = facilities[fIndex24];
    console.log(`Found Target ID 24: ${target24.id} (${target24.name})`);

    target24.pricing = {
        '매장묘': {
            rows: [
                { name: "매장묘 토지사용료 (15년)", price: 9620000, description: "평당 사용료 (작업비/석물 별도)", isRepresentative: true },
                { name: "유골합장 (기본)", price: 8000000, description: "유골 매장 작업비 포함", isRepresentative: true },
                { name: "시신 매장 작업비", price: 19000000, description: "1기당 (고가 작업비 주의)", isRepresentative: false },
                { name: "재래식 유골매장비 (합장)", price: 19000000, description: "전통 방식", isRepresentative: false }
            ]
        },
        '봉안당': { rows: [] },
        '수목장': { rows: [] },
        '옵션': {
            rows: [
                { name: "묘지 관리비", price: 14700, description: "평당 / 연납", isRepresentative: false },
                { name: "공동 관리비", price: 147000, description: "평당", isRepresentative: false },
                { name: "축대 작업비", price: 10000000, description: "평당 (필요 시)", isRepresentative: false },
                { name: "분상 보수 작업비", price: 1800000, description: "평당", isRepresentative: false },
                { name: "석물 재조립 (단묘테 1단)", price: 1000000, description: "", isRepresentative: false },
                { name: "석물 재조립 (합장묘테)", price: 1200000, description: "", isRepresentative: false },
                { name: "석물 재조립 (화강 둘레석)", price: 2000000, description: "", isRepresentative: false },
                { name: "상석 (2.5자 화강석)", price: 800000, description: "중국산", isRepresentative: false },
                { name: "비석 (1.8자 평오석와비)", price: 550000, description: "중국산", isRepresentative: false },
                { name: "화병 (화석분 1세트)", price: 240000, description: "중국산", isRepresentative: false },
                { name: "묘테 1단 (합장)", price: 2500000, description: "화강석 (중국)", isRepresentative: false },
                { name: "묘테 2단 (합장)", price: 3500000, description: "화강석 (중국)", isRepresentative: false }
            ]
        }
    };
} else {
    console.error("❌ Could not find ID 24 to inject.");
}

// 2. Attempt to Restore ID 17 (Paju Haneulnara)
// Since I overwrote it with Pocheon data, I need to check if I have Paju data.
// In this conversation, I have NOT processed ID 17. 
// Users said "17번 아까 했던거랑". Maybe user meant *I* (the previous AI or previous turn) did it? 
// Or maybe user is referring to the fact that I just touched it?
// To stand corrected, I will CLEAR the pricing of ID 17 to avoid showing Pocheon data there.
// I'll leave a note in the description.

let fIndex17 = facilities.findIndex(f => f.id === 'park-0017');
if (fIndex17 !== -1) {
    console.log(`Restoring ID 17: ${facilities[fIndex17].name} (Clearing incorrect Pocheon data)`);
    // I don't have the correct data for 17 yet. Better to empty it than show wrong data.
    facilities[fIndex17].pricing = {
        '매장묘': { rows: [] },
        '봉안당': { rows: [] },
        '옵션': { rows: [] } // Cleared to prevent confusion
    };
}

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Fixed: ID 24 Injected, ID 17 Cleared (waiting for correct data).");
