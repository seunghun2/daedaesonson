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

// 1036: 우리추모공원 봉안탑 → 가격 없음
u('park-1036', INQ('봉안탑'));

// 1037: (재)우성공원 영남납골당(무연고) → 가격 없음, 납골당=봉안당
u('park-1037', INQ('봉안당'));

// 1038: 원진사 봉안당 → 가격 없음, grade 정리
u('park-1038', INQ('봉안당'));

// 1039: 천주교 대구교구 죽도성당 → 가격 없음
u('park-1039', INQ('봉안당'));

// 1040: 우각사 봉안당 → 가격 없음, grade 정리
u('park-1040', INQ('봉안당'));

// 1041: 천태사추모공원 → 가격 없음
u('park-1041', INQ('봉안당'));

// 1042: 고경사추모공원 → 가격 없음
u('park-1042', INQ('봉안당'));

// 1043: 실로암추모관 → 가격 없음
u('park-1043', INQ('봉안당'));

// 1044: 대관음사 봉안당 → 가격 있음! 이미지 기반 정제
// 개인단(1~2단) 450만, 개인단(3~7단) 550만, 개인단(8~11단) 450만
// 관리비 25만(1년 5만 × 5년), 유골함 65만 별도
u('park-1044', [
    {
        serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
        rows: [
            { name: '1단~2단', price: 4500000, feeType: 'USAGE', grade: '개인단', isRepresentative: true },
            { name: '3단~7단', price: 5500000, feeType: 'USAGE', grade: '개인단' },
            { name: '8단~11단', price: 4500000, feeType: 'USAGE', grade: '개인단' },
            { name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '1년 5만원 × 5년' },
        ]
    },
    {
        serviceType: 'OTHER', subType: '장례용품', unit: '원',
        rows: [
            { name: '유골함', price: 650000, feeType: 'USAGE', grade: '별도 구매' }
        ]
    }
]);

// 1045: 나자렛집 → 가격 없음
u('park-1045', INQ('봉안당'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1036-1045 완료!');
})();
