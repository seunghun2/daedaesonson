const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

const p = data.find(x => x.id === 'park-1044');
if (!p) { console.log('NOT FOUND'); process.exit(1); }

// 단 개별 분리 + 유골함도 봉안당 아래 (기타 탭 X)
const rows = [];
// 1단, 2단 → 450만
for (let i = 1; i <= 2; i++) {
    rows.push({ name: `${i}단`, price: 4500000, feeType: 'USAGE', grade: '개인단', isRepresentative: i === 1 });
}
// 3~7단 → 550만
for (let i = 3; i <= 7; i++) {
    rows.push({ name: `${i}단`, price: 5500000, feeType: 'USAGE', grade: '개인단' });
}
// 8~11단 → 450만
for (let i = 8; i <= 11; i++) {
    rows.push({ name: `${i}단`, price: 4500000, feeType: 'USAGE', grade: '개인단' });
}
// 관리비
rows.push({ name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '1년 5만원 × 5년' });
// 유골함 → 봉안당 아래 아코디언 (기타 탭 사용 X)
rows.push({ name: '유골함', price: 650000, feeType: 'USAGE', grade: '별도 구매' });

p.priceInfo.standardizedPrices = [
    { serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows }
];

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('📁 facilities.json 저장');
console.log('총 rows:', rows.length, '개 (기타탭 없이 봉안당 아래 통합)');
rows.forEach(r => console.log(`  ${r.name} = ${(r.price / 10000).toLocaleString()}만원 (${r.feeType}) ${r.isRepresentative ? '★대표' : ''}`));

(async () => {
    const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(p.priceInfo) }).eq('id', 'park-1044');
    console.log(error ? `❌ ${error.message}` : '🔄 park-1044 → Supabase OK');
    console.log('🎉 1044 단 분리 + 기타→봉안당 통합 완료!');
})();
