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

// 1046: 석장사 봉안당 → 가격 없음
u('park-1046', INQ('봉안당'));

// 1047: 삼성사 봉안당 → 가격 없음
u('park-1047', INQ('봉안당'));

// 1048: 보현사 무량수공원 → 가격 없음
u('park-1048', INQ('봉안당'));

// 1049: 동국사 영가추모관 → 가격 없음
u('park-1049', INQ('봉안당'));

// 1050: 삼광사추모공원 봉안탑 → 가격 없음
u('park-1050', INQ('봉안탑'));

// 1051: 용운사 납골당 → 가격 없음
u('park-1051', INQ('봉안당'));

// 1052: 창원공원묘원 납골당 → 가격 없음
u('park-1052', INQ('봉안당'));

// 1053: 진주내동공원묘원 봉안당 → 가격 없음
u('park-1053', INQ('봉안당'));

// 1054: (재)밀양추모공원묘원 봉안담 → 가격 없음
u('park-1054', INQ('봉안담'));

// 1055: 천불사 극락원 → 가격 없음
u('park-1055', INQ('봉안당'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1046-1055 완료!');
})();
