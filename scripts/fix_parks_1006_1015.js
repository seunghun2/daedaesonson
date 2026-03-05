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

// 1006: 영락원 봉안당 → 없음
u('park-1006', B('봉안당'));

// 1007: 혜관정사 봉안당 → 매장묘/봉안당/수목장 있지만 grade 정리 필요
u('park-1007', [
    {
        serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
            { name: '매장묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
            { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }
        ]
    },
    {
        serviceType: 'NATURAL', subType: '수목장', unit: '원', rows: [
            { name: '수목장', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true }
        ]
    }
]);

// 1008: (재)실로암공원묘원 봉안묘 → BONGSAN→BURIAL (§8 봉안묘=야외)
u('park-1008', BU('봉안묘'));

// 1009: 강화파라다이스 강화지점 봉안탑 → 없음
u('park-1009', B('봉안탑'));

// 1010: 미타사 봉안당 → 없음
u('park-1010', B('봉안당'));

// 1011: 부산추모공원 봉안묘·담 → 봉안묘(BURIAL) + 봉안담(BONGSAN) 분리
u('park-1011', [
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

// 1012: 인천가족공원 가족봉안담 → 없음
u('park-1012', B('봉안담'));

// 1013: 인천가족공원 호국봉안담 → 없음
u('park-1013', B('봉안담'));

// 1014: 은하수공원 달님의집(봉안담) → 없음
u('park-1014', B('봉안담'));

// 1015: 수원시연화장 제2추모의집 → 없음 (추모의집=실내봉안)
u('park-1015', B('봉안당'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1006-1015 완료!');
})();
