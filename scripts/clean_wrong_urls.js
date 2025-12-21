const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls_fixed.json'), 'utf-8'));

// 확실히 틀린 도메인들
const obviously_wrong = [
    'apps.apple.com',
    'yna.co.kr',
    'imaeil.com',
    'law.go.kr',
    'data.go.kr',
    'hongsinews.com',
    'center.2infodaily.com',
    'doonamu.kr',
    'jejupod.com',
    'market.koreacharts.com',
    'eyesofkorean.com',
    'dahada.net',
    'kbsm.net',
    'sodamsangjo.com',
    'fmp.purpleo.co.kr',
    'state.gwd.go.kr',
    'funeraloner.co.kr'
];

const suspicious = [];
let cleaned = 0;

data.forEach(d => {
    if (!d.url) return;

    const url = d.url.toLowerCase();

    // 확실히 틀린 것
    if (obviously_wrong.some(bad => url.includes(bad))) {
        suspicious.push({
            no: d.no,
            name: d.name,
            url: d.url,
            reason: '확실히 틀림'
        });
        d.url = null;  // 삭제
        d.urlRemoved = true;
        cleaned++;
    }
});

console.log('🔍 확실히 잘못된 URL: ' + suspicious.length + '개');
console.log('');
suspicious.forEach(d => {
    try {
        const hostname = new URL(d.url).hostname;
        console.log(`${d.no}. ${d.name}`);
        console.log(`   -> ${hostname}`);
    } catch (e) { }
});

// 저장
fs.writeFileSync(
    path.join(__dirname, '../data/facility_urls_cleaned.json'),
    JSON.stringify(data, null, 2)
);

console.log('');
console.log('✅ 정리 완료: ' + cleaned + '개 URL 제거됨');
console.log('저장: data/facility_urls_cleaned.json');
