const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// park-0767 덕원사 추모관 — 공홈(http://deokwonsa.com/) 가격 이미지 기반, 1순위 데이터
// 추모관 분양비 (단위: 만원):
//   고급 8단: 개인단 500/600/800/1000/1000/1000/800/500, 부부단 1000/1200/1600/2000/2000/2000/1600/1000
//   일반 8단: 개인단 200/300/400/500/500/500/300/200, 부부단 400/600/800/1000/1000/1000/600/400
// 관리비: 개인단 5년35만/10년70만, 부부단 5년70만/10년140만

const p = data.find(x => x.id === 'park-0767');
if (!p) { console.log('NOT FOUND'); process.exit(1); }

p.priceInfo.standardizedPrices = [{
    serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
    rows: [
        // 고급 개인단 (1단→8단)
        { name: '1단', price: 5000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '2단', price: 6000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '3단', price: 8000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '4단', price: 10000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '5단', price: 10000000, feeType: 'USAGE', grade: '고급 개인단', isRepresentative: true },
        { name: '6단', price: 10000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '7단', price: 8000000, feeType: 'USAGE', grade: '고급 개인단' },
        { name: '8단', price: 5000000, feeType: 'USAGE', grade: '고급 개인단' },
        // 고급 부부단
        { name: '1단', price: 10000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '2단', price: 12000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '3단', price: 16000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '4단', price: 20000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '5단', price: 20000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '6단', price: 20000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '7단', price: 16000000, feeType: 'USAGE', grade: '고급 부부단' },
        { name: '8단', price: 10000000, feeType: 'USAGE', grade: '고급 부부단' },
        // 일반 개인단
        { name: '1단', price: 2000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '2단', price: 3000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '3단', price: 4000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '4단', price: 5000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '5단', price: 5000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '6단', price: 5000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '7단', price: 3000000, feeType: 'USAGE', grade: '일반 개인단' },
        { name: '8단', price: 2000000, feeType: 'USAGE', grade: '일반 개인단' },
        // 일반 부부단
        { name: '1단', price: 4000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '2단', price: 6000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '3단', price: 8000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '4단', price: 10000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '5단', price: 10000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '6단', price: 10000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '7단', price: 6000000, feeType: 'USAGE', grade: '일반 부부단' },
        { name: '8단', price: 4000000, feeType: 'USAGE', grade: '일반 부부단' },
        // 관리비 (5년 기준)
        { name: '관리비 (5년)', price: 350000, feeType: 'MAINTENANCE', grade: '개인단' },
        { name: '관리비 (5년)', price: 700000, feeType: 'MAINTENANCE', grade: '부부단' },
    ]
}];

p.websiteUrl = 'http://deokwonsa.com/';

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0767 덕원사 추모관 → facilities.json 저장');

(async () => {
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
        websiteUrl: p.websiteUrl
    }).eq('id', 'park-0767');
    console.log(error ? `❌ ${error.message}` : '🔄 park-0767 → Supabase OK');
})();
