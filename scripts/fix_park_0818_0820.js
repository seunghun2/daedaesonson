const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// ====== park-0818 달마사봉안당 — 공홈 이미지 기반 ======
// 봉안 금액 (단위: 만원)
// 일반단: 개인단, 합장단 / 특별단: 개인단, 합장단, 확장형
// 관리비: 5만원/1년 (10년 단위 선납) / 영구관리비: 350만원(선택)
const M = 10000;
const p818 = data.find(x => x.id === 'park-0818');
if (p818) {
    if (!p818.priceInfo) p818.priceInfo = {};
    p818.priceInfo.standardizedPrices = [{
        serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
        rows: [
            // 일반단 - 개인단
            { name: '1단', price: 600 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '2단', price: 750 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '3단', price: 1000 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '4단', price: 1100 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '5단', price: 1100 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '6단', price: 1100 * M, feeType: 'USAGE', grade: '일반단 개인단', isRepresentative: true },
            { name: '7단', price: 900 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '8단', price: 600 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            { name: '9단', price: 400 * M, feeType: 'USAGE', grade: '일반단 개인단' },
            // 일반단 - 합장단
            { name: '1단', price: 850 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '2단', price: 1000 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '3단', price: 1250 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '4단', price: 1350 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '5단', price: 1350 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '6단', price: 1350 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '7단', price: 1150 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '8단', price: 850 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            { name: '9단', price: 650 * M, feeType: 'USAGE', grade: '일반단 합장단' },
            // 특별단 - 개인단
            { name: '1단', price: 700 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '2단', price: 800 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '3단', price: 1100 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '4단', price: 1200 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '5단', price: 1200 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '6단', price: 1200 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '7단', price: 1000 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '8단', price: 700 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            { name: '9단', price: 500 * M, feeType: 'USAGE', grade: '특별단 개인단' },
            // 특별단 - 합장단
            { name: '1단', price: 950 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '2단', price: 1050 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '3단', price: 1350 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '4단', price: 1450 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '5단', price: 1450 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '6단', price: 1450 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '7단', price: 1250 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '8단', price: 950 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            { name: '9단', price: 750 * M, feeType: 'USAGE', grade: '특별단 합장단' },
            // 특별단 - 확장형
            { name: '1단', price: 1900 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '2단', price: 2100 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '3단', price: 2700 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '4단', price: 2900 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '5단', price: 2900 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '6단', price: 2900 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '7단', price: 2500 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '8단', price: 1900 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            { name: '9단', price: 1500 * M, feeType: 'USAGE', grade: '특별단 확장형' },
            // 관리비
            { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '5만원/년 (10년 단위 선납)' },
            { name: '영구관리비', price: 3500000, feeType: 'MAINTENANCE', grade: '선택' },
        ]
    }];
}

// ====== park-0820 평창군 공설봉안당 — 공홈 이미지 기반 ======
// 평창군 공설묘원 장사시설 사용료(2025년)
// 매장: 단상 200만, 합장 300만
// 봉안담: 단장(만장) 40만, 합장(만장) 90만
// 봉안당: 단장 60만, 합장 120만
// 사용기간: 30년, 1회 연장가능(30년)
// 매장은 석물 및 매장비 인건비 별도
const p820 = data.find(x => x.id === 'park-0820');
if (p820) {
    if (!p820.priceInfo) p820.priceInfo = {};
    p820.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '단상', price: 2000000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)', isRepresentative: true },
                { name: '합장', price: 3000000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원',
            rows: [
                { name: '단장(만장)', price: 400000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)' },
                { name: '합장(만장)', price: 900000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                { name: '단장', price: 600000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)', isRepresentative: true },
                { name: '합장', price: 1200000, feeType: 'USAGE', grade: '사용기간 30년 (1회 연장가능)' },
            ]
        },
    ];
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ facilities.json 저장');

(async () => {
    if (p818) {
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(p818.priceInfo) }).eq('id', 'park-0818');
        console.log(error ? `❌ 0818 ${error.message}` : '🔄 park-0818 달마사봉안당 → Supabase OK');
    }
    if (p820) {
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(p820.priceInfo) }).eq('id', 'park-0820');
        console.log(error ? `❌ 0820 ${error.message}` : '🔄 park-0820 평창군 공설봉안당 → Supabase OK');
    }
})();
