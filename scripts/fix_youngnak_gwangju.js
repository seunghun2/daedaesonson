const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

// 1. 부산 영락공원묘원 (park-0040) - 잘못 업데이트된 것 롤백 (또는 초기화)
// 부산 영락공원은 원래 데이터가 있었을 텐데, 지금은 광주 데이터가 덮어씌워짐.
// 일단 빈 데이터나 비고로 돌려놓겠습니다. (원래 데이터를 완벽히 복구하긴 어려움)
const busanIndex = facilities.findIndex(f => f.id === 'park-0040');
if (busanIndex !== -1) {
    facilities[busanIndex].pricing = {}; // 초기화
    console.log(`✅ 부산 영락공원묘원 (park-0040) rollback (cleared).`);
}

// 2. 광주 영락공원묘지 (park-0160) - 여기에 진짜 데이터를 넣어야 함
const gwangjuIndex = facilities.findIndex(f => f.id === 'park-0160');
if (gwangjuIndex !== -1) {
    facilities[gwangjuIndex].pricing = {
        '매장묘': {
            rows: [
                { name: "묘지 사용료 (15년)", price: 1405000, description: "광주시민 / 30일전 거주", isRepresentative: true },
                { name: "묘지 수수료", price: 271000, description: "광주시민", isRepresentative: false }
            ]
        },
        '옵션': {
            rows: [
                { name: "묘지 관리비 (15년)", price: 150000, description: "15년 관리비", isRepresentative: false }
            ]
        }
    };
    console.log(`✅ 광주 영락공원묘지 (park-0160) updated correctly.`);
} else {
    console.error(`❌ 광주 영락공원묘지 (park-0160) not found!`);
}

// Save
fs.writeFileSync(JSON_PATH, JSON.stringify(facilities, null, 2));
console.log("✅ Fixed Youngnak Park data mismatch.");
