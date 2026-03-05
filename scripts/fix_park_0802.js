const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// park-0802 이담추모관 (IDAM MEMORIAL PALACE) — 공홈 이미지 기반 (1순위)
// 분양 금액표 (단위: 만원)
// *부부단은 X2입니다.
// 실버(Silver) 일반실 / 골드(Gold) 일반실 / 로얄(Royal) 일반실
// 골드, 로얄에 기독교 컬럼이 있으나 가격이 비어있음

const M = 10000;
function r(name, price, opts = {}) {
    return { name, price: price * M, feeType: 'USAGE', ...opts };
}

const p = data.find(x => x.id === 'park-0802');
if (!p) { console.log('NOT FOUND'); process.exit(1); }
if (!p.priceInfo) p.priceInfo = {};

p.priceInfo.standardizedPrices = [{
    serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
    rows: [
        // 실버 Silver (1~9단)
        r('1단', 200, { grade: '실버(Silver)' }),
        r('2단', 300, { grade: '실버(Silver)' }),
        r('3단', 400, { grade: '실버(Silver)' }),
        r('4단', 500, { grade: '실버(Silver)' }),
        r('5단', 550, { grade: '실버(Silver)', isRepresentative: true }),
        r('6단', 450, { grade: '실버(Silver)' }),
        r('7단', 350, { grade: '실버(Silver)' }),
        r('8단', 200, { grade: '실버(Silver)' }),
        r('9단', 150, { grade: '실버(Silver)' }),

        // 골드 Gold (1~9단)
        r('1단', 300, { grade: '골드(Gold)' }),
        r('2단', 400, { grade: '골드(Gold)' }),
        r('3단', 500, { grade: '골드(Gold)' }),
        r('4단', 600, { grade: '골드(Gold)' }),
        r('5단', 650, { grade: '골드(Gold)' }),
        r('6단', 550, { grade: '골드(Gold)' }),
        r('7단', 450, { grade: '골드(Gold)' }),
        r('8단', 300, { grade: '골드(Gold)' }),
        r('9단', 200, { grade: '골드(Gold)' }),

        // 로얄 Royal (1~9단)
        r('1단', 350, { grade: '로얄(Royal)' }),
        r('2단', 450, { grade: '로얄(Royal)' }),
        r('3단', 600, { grade: '로얄(Royal)' }),
        r('4단', 700, { grade: '로얄(Royal)' }),
        r('5단', 750, { grade: '로얄(Royal)' }),
        r('6단', 700, { grade: '로얄(Royal)' }),
        r('7단', 550, { grade: '로얄(Royal)' }),
        r('8단', 400, { grade: '로얄(Royal)' }),
        r('9단', 250, { grade: '로얄(Royal)' }),
    ]
}];

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0802 이담추모관 → facilities.json 저장');

(async () => {
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
    }).eq('id', 'park-0802');
    console.log(error ? `❌ ${error.message}` : '🔄 park-0802 → Supabase OK');
})();
