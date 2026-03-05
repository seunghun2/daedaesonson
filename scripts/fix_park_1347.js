const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// park-1347 신세계공원 — 공홈 이미지 기반 (1순위)
// 평장묘: 2위 700~1000만, 4위 1300~1550만, 6위 1550~2300만, 8위 2900~3000만, 12위 3300~4000만
// 봉안묘: 2위 1200만, 4위 1600만, 6위 1800~2300만, 8위 2900~3000만, 12위 3300~4000만
// 수목형 평장: 1위 500만, 2위 800~1000만, 4위 1300만
// ※ 관리비, 각자비, 추가안장비 별도

const p = data.find(x => x.id === 'park-1347');
if (!p) { console.log('NOT FOUND'); process.exit(1); }
if (!p.priceInfo) p.priceInfo = {};

p.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL', subType: '평장묘', unit: '원',
        rows: [
            { name: '2위', price: 7000000, feeType: 'USAGE', grade: '700만~1,000만원', isRepresentative: true },
            { name: '4위', price: 13000000, feeType: 'USAGE', grade: '1,300만~1,550만원' },
            { name: '6위', price: 15500000, feeType: 'USAGE', grade: '1,550만~2,300만원' },
            { name: '8위', price: 29000000, feeType: 'USAGE', grade: '2,900만~3,000만원' },
            { name: '12위', price: 33000000, feeType: 'USAGE', grade: '3,300만~4,000만원' },
        ]
    },
    {
        serviceType: 'BURIAL', subType: '봉안묘', unit: '원',
        rows: [
            { name: '2위', price: 12000000, feeType: 'USAGE', isRepresentative: true },
            { name: '4위', price: 16000000, feeType: 'USAGE' },
            { name: '6위', price: 18000000, feeType: 'USAGE', grade: '1,800만~2,300만원' },
            { name: '8위', price: 29000000, feeType: 'USAGE', grade: '2,900만~3,000만원' },
            { name: '12위', price: 33000000, feeType: 'USAGE', grade: '3,300만~4,000만원' },
        ]
    },
    {
        serviceType: 'NATURAL', subType: '수목형 평장', unit: '원',
        rows: [
            { name: '1위', price: 5000000, feeType: 'USAGE', isRepresentative: true },
            { name: '2위', price: 8000000, feeType: 'USAGE', grade: '800만~1,000만원' },
            { name: '4위', price: 13000000, feeType: 'USAGE' },
        ]
    },
];

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-1347 신세계공원 → facilities.json 저장');

(async () => {
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
    }).eq('id', 'park-1347');
    console.log(error ? `❌ ${error.message}` : '🔄 park-1347 → Supabase OK');
})();
