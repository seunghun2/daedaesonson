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

// 1016: 수원시연화장 봉안담 → 없음
u('park-1016', B('봉안담'));

// 1017: 화천공원묘원 봉안묘 → BONGSAN→BURIAL (§8)
u('park-1017', BU('봉안묘'));

// 1018: 태백시납골묘 → 없음 (납골묘=봉안묘=야외=BURIAL §8)
u('park-1018', BU('봉안묘'));

// 1019: 하늘내린 휴공원(무연단) → 없음 (무연단=봉안단=BONGSAN)
u('park-1019', B('봉안단'));

// 1020: 하늘내린 보금자리(가족12위) → BURIAL→BONGSAN (실내가족봉안시설)
u('park-1020', B('봉안당'));

// 1021: 청주시목련공원 제2목련당 → 없음 (목련당=봉안당)
u('park-1021', B('봉안당'));

// 1022: 청주시목련공원 제3목련당 → 없음 (목련당=봉안당)
u('park-1022', B('봉안당'));

// 1023: 보령시모란공원 봉안묘·담 → 봉안묘=BURIAL(§8) + 봉안담=BONGSAN
u('park-1023', [
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

// 1024: 예산군추모의집 제2관 → 없음 (추모의집=봉안당)
u('park-1024', B('봉안당'));

// 1025: 예산군추모공원 봉안묘(가족·평장) → BONGSAN→BURIAL(§8)
u('park-1025', BU('봉안묘'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1016-1025 완료!');
})();
