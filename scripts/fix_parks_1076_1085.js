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

// 1076~1079: 가격 없음 → 시설문의
u('park-1076', INQ('봉안당'));
u('park-1077', INQ('봉안당'));
u('park-1078', INQ('봉안당'));
u('park-1079', INQ('봉안당'));

// 1080: 재단법인 아너스홈 - 매장묘 데이터 있음 (이미지 확인됨)
// 사용료(5평) 245만 합장가능 평당 490만원
// 사용료(6평) 294만 합장가능 평당 49만원 (오타로 보이지만 원본 유지)
// 관리비(5평) 8만 / 관리비(6평) 9.6만 (합장가능 평당 년 16천원)
u('park-1080', [{
    serviceType: 'BURIAL', subType: '매장묘', unit: '원',
    rows: [
        { name: '사용료 (5평)', price: 2450000, feeType: 'USAGE', grade: '합장가능, 평당 490,000원', isRepresentative: true },
        { name: '사용료 (6평)', price: 2940000, feeType: 'USAGE', grade: '합장가능, 평당 490,000원' },
        { name: '관리비 (5평)', price: 80000, feeType: 'MAINTENANCE', grade: '합장가능, 평당 년 16,000원' },
        { name: '관리비 (6평)', price: 96000, feeType: 'MAINTENANCE', grade: '합장가능, 평당 년 16,000원' },
    ]
}]);

// 1081~1085: 가격 없음 → 시설문의
u('park-1081', INQ('봉안당'));
u('park-1082', INQ('봉안당'));
u('park-1083', INQ('봉안당'));
u('park-1084', INQ('봉안당'));
u('park-1085', INQ('봉안탑'));

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n📁 facilities.json 저장');

(async () => {
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `🔄 ${id} → Supabase OK`);
    }
    console.log('\n🎉 1076-1085 완료!');
})();
