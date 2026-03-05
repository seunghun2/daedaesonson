const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
const updated = [];

function u(id, sp) {
    const p = data.find(x => x.id === id);
    if (!p) { console.log('⚠️ NOT FOUND:', id); return; }
    if (!p.priceInfo) p.priceInfo = {};
    p.priceInfo.standardizedPrices = sp;
    updated.push(id);
    console.log('✅', id, p.name);
}

const INQ = (sub) => [{ serviceType: 'BONGSAN', subType: sub, unit: '원', rows: [{ name: sub, price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] }];

// 1086~1090: 가격 없음 → 시설문의
u('park-1086', INQ('봉안당'));
u('park-1087', INQ('봉안당'));
u('park-1088', INQ('봉안당'));
u('park-1089', INQ('봉안당'));
u('park-1090', INQ('납골묘'));

// 1091: 불광사 지장전 - 매장묘/봉안당/수목장 모두 0원 → 각각 시설문의
u('park-1091', [
    { serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [{ name: '매장묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] },
    { serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [{ name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] },
    { serviceType: 'NATURAL', subType: '수목장', unit: '원', rows: [{ name: '수목장', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] },
]);

// 1092~1095: 가격 없음 → 시설문의
u('park-1092', INQ('봉안당'));
u('park-1093', INQ('봉안당'));
u('park-1094', INQ('봉안당'));
u('park-1095', INQ('납골공원'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1086-1095 완료!');
})();
