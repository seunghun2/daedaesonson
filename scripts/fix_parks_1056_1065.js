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

// 1056: 안정사 납골당 → 가격 없음
u('park-1056', INQ('봉안당'));

// 1057: 용봉사 납골당 → 가격 없음
u('park-1057', INQ('봉안당'));

// 1058: 용주사 봉안당 → 1~8층 실제 가격 (300×300×300)
// 1층:100만, 2층:100만, 3층:200만, 4층:300만, 5층:300만, 6층:200만, 7층:100만, 8층:100만
u('park-1058', [{
    serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
    rows: [
        { name: '1층', price: 1000000, feeType: 'USAGE', grade: '300×300×300', isRepresentative: true },
        { name: '2층', price: 1000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '3층', price: 2000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '4층', price: 3000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '5층', price: 3000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '6층', price: 2000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '7층', price: 1000000, feeType: 'USAGE', grade: '300×300×300' },
        { name: '8층', price: 1000000, feeType: 'USAGE', grade: '300×300×300' },
    ]
}]);

// 1059: 천주교회 구로3동 성당 봉안당 → 가격 없음
u('park-1059', INQ('봉안당'));

// 1060: 우도면 공설봉안묘 → 가격 없음 (봉안묘 but BONGSAN)
u('park-1060', INQ('봉안묘'));

// 1061: 한경면 공설봉안묘(만장) → 가격 없음
u('park-1061', INQ('봉안묘'));

// 1062: 학천사 봉안당 → 가격 없음
u('park-1062', INQ('봉안당'));

// 1063: 현대공원 추모의집 → 가격 없음
u('park-1063', INQ('봉안당'));

// 1064: 대한불교덕성종 성보사 봉안당 → 가격 없음
u('park-1064', INQ('봉안당'));

// 1065: 보국사 봉안당 → 가격 없음
u('park-1065', INQ('봉안당'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1056-1065 완료!');
})();
