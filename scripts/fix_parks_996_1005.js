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

u('park-0996', B('봉안당'));       // 오봉산추모공원 봉안당
u('park-0997', B('봉안탑'));       // 월명사 봉안탑 (이미지: 봉안담이지만 DB명은 봉안탑)
u('park-0998', B('봉안탑'));       // 통도사 봉안탑 → subType 봉안당→봉안탑, grade 시설문의
u('park-0999', B('봉안탑'));       // (재)생활불교 봉안탑
u('park-1000', B('봉안당'));       // 성 라자로마을
u('park-1001', BU('봉안묘'));      // 용흥사 봉안묘 → §8 BURIAL
u('park-1002', B('봉안탑'));       // 파주추모공원 봉안탑
u('park-1003', BU('매장묘'));      // 갑산공원묘원 → 공원묘원=야외매장
u('park-1004', B('봉안당'));       // 대덕사 봉안당 → grade 시설문의로 정리
u('park-1005', B('봉안탑'));       // 비봉사 봉안탑

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 996-1005 완료!');
})();
