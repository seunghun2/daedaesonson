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
const B = (sub) => [{ serviceType: 'BONGSAN', subType: sub, unit: '원', rows: [{ name: sub, price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] }];
const BU = (sub) => [{ serviceType: 'BURIAL', subType: sub, unit: '원', rows: [{ name: sub, price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }] }];

// 1026: 창원시립상복공원 제2봉안당 → 이미 1026에 매장묘/봉안당/수목장 있음. 이 시설은 "제2봉안당"이므로 봉안당만 유지, grade 시설문의
u('park-1026', B('봉안당'));

// 1027: 창원시립상복공원 봉안담 → 없음
u('park-1027', B('봉안담'));

// 1028: 산청군공설묘지 봉안묘 → 없음. 봉안묘=야외=BURIAL(§8)
u('park-1028', BU('봉안묘'));

// 1029: 용인평온의숲(평온마루 봉안묘) → 없음. 봉안묘=야외=BURIAL(§8)
u('park-1029', BU('봉안묘'));

// 1030: 신안1004추모관 → 없음. 추모관=봉안당=BONGSAN
u('park-1030', B('봉안당'));

// 1031: 연화원 봉안당 → 없음
u('park-1031', B('봉안당'));

// 1032: 천비룡사 → 없음. 사찰=봉안당
u('park-1032', B('봉안당'));

// 1033: 마애사방어암 → 없음. 사찰=봉안당
u('park-1033', B('봉안당'));

// 1034: (재)아미티우스 봉안탑 → 없음
u('park-1034', B('봉안탑'));

// 1035: (재)우성공원 봉안묘·담 → BONGSAN/봉안묘 → 봉안묘=BURIAL(§8) + 봉안담=BONGSAN
u('park-1035', [
    {
        serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
            { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
            { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }
        ]
    }
]);

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1026-1035 완료!');
})();
