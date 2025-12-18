const fs = require('fs');
const path = require('path');

const FACILITIES_PATH = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf8'));

// 수동 분류
const manualClassify = {
    'park-0750': 'CHARNEL_HOUSE',  // 추모원 = 봉안시설
    'park-0760': 'CHARNEL_HOUSE',  // 안락원 = 봉안시설
    'park-0793': 'CHARNEL_HOUSE',  // 안식의집 = 봉안시설
    'park-0794': 'CHARNEL_HOUSE',  // 평온당 = 봉안시설
    'park-0800': 'CHARNEL_HOUSE',  // 추모공원 = 봉안시설
    'park-0840': 'CHARNEL_HOUSE',  // 휴공원(부부단) = 봉안시설
    'park-0949': 'CHARNEL_HOUSE',  // 추모관 = 봉안시설
    'park-0963': 'FAMILY_GRAVE',   // 메모리얼파크 = 공원묘지
    'park-1020': 'CHARNEL_HOUSE',  // 보금자리 = 봉안시설
    'park-1033': 'CHARNEL_HOUSE',  // 마애사방어암 = 사찰 봉안
    'park-1180': 'NATURAL_BURIAL', // 수목원 = 수목장
    'park-1195': 'NATURAL_BURIAL', // 평온의숲 = 수목장
    'park-1199': 'NATURAL_BURIAL', // 바람마루 = 자연장
    'park-1200': 'NATURAL_BURIAL', // 별의숲 = 수목장
    'park-1212': 'CHARNEL_HOUSE',  // 기도회 = 종교시설 봉안
    'park-1216': 'NATURAL_BURIAL', // 보배숲 = 수목장
    'park-1297': 'NATURAL_BURIAL', // 청마루동산 = 자연장
    'park-1315': 'CHARNEL_HOUSE',  // 휴안추모공원 = 봉안
    'park-1441': 'CREMATORIUM',    // 승화원 = 화장시설
};

let count = 0;
Object.entries(manualClassify).forEach(([id, category]) => {
    const f = facilities.find(f => f.id === id);
    if (f && f.category === 'ETC') {
        console.log(f.id + ':', f.name, '->', category);
        f.category = category;
        count++;
    }
});

console.log('\n✅ 변경:', count, '개');
fs.writeFileSync(FACILITIES_PATH, JSON.stringify(facilities, null, 2), 'utf8');
console.log('💾 저장 완료');

// 남은 ETC 확인
const remaining = facilities.filter(f => f.category === 'ETC');
console.log('\n남은 ETC:', remaining.length, '개');
