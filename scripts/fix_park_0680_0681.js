/**
 * park-0680 아카이브 + park-0681 공홈 처리
 *
 * 680 가톨릭군위묘원 성모의정원 → 아카이브
 *   (개인단) 사용료 4,500,000 영구
 *   (부부단) 사용료 8,000,000 영구
 *   (가족단) 사용료 7,000,000 영구
 *   (개인단,부부단) 관리비 1,000,000 (30년분, 1위당)
 *   (가족단) 관리비 1,000,000 (30년분, 1위당)
 *   각자비, 세라믹 명칭 300,000
 *
 * 681 공홈 http://xn--ob0bo9fyyaj0et2e4tmlmphn1a.kr/
 *   일반 봉안당: 개인 200~500만 / 부부 400~1000만 (15년, 관리비 별도)
 *   고급 봉안당: 개인 300~700만 / 부부 600~1400만
 *   VVIP 봉안당: 개인 500~1000만 / 부부 1000~2000만
 *   봉안담: 개인 300~500만 / 부부 600~1000만
 *   가족탑: VIP 2500~8400만 / 일반 3000~6000만
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 680 가톨릭군위묘원 성모의정원 =====
    const p680 = data.find(x => x.id === 'park-0680');
    if (p680) {
        p680.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료 (영구)', unit: '원', rows: [
                    { name: '개인단', price: 4500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '부부단', price: 8000000, feeType: 'USAGE' },
                    { name: '가족단', price: 7000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 (30년분, 1위당)', unit: '원', rows: [
                    { name: '개인단·부부단', price: 1000000, feeType: 'MAINTENANCE' },
                    { name: '가족단', price: 1000000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'OTHER', subType: '부가', groupType: '각자·세라믹 명칭', unit: '원', rows: [
                    { name: '각자비, 세라믹 명칭 제작비', price: 300000, feeType: 'INSTALLATION' },
                ]
            },
        ];
        updates.push({ id: 'park-0680', p: p680 });
        console.log('✅', p680.id, p680.name);
    }

    // ===== 681 공홈 =====
    const p681 = data.find(x => x.id === 'park-0681');
    if (p681) {
        p681.websiteUrl = 'http://xn--ob0bo9fyyaj0et2e4tmlmphn1a.kr/home/contents/main/index.php';
        p681.priceInfo.standardizedPrices = [
            // 일반 봉안당 - 대표가격은 중간단(4~6단) 개인 500만
            {
                serviceType: 'BONGSAN', subType: '일반 봉안당', groupType: '개인단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 2000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '일반 봉안당', groupType: '부부단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '6단', price: 10000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 10000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE' },
                    { name: '2단', price: 6000000, feeType: 'USAGE' },
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                ]
            },
            // 고급 봉안당
            {
                serviceType: 'BONGSAN', subType: '고급 봉안당', groupType: '개인단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 3000000, feeType: 'USAGE' },
                    { name: '8단', price: 4000000, feeType: 'USAGE' },
                    { name: '7단', price: 5000000, feeType: 'USAGE' },
                    { name: '6단', price: 6000000, feeType: 'USAGE' },
                    { name: '5단', price: 7000000, feeType: 'USAGE' },
                    { name: '4단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '고급 봉안당', groupType: '부부단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 6000000, feeType: 'USAGE' },
                    { name: '8단', price: 8000000, feeType: 'USAGE' },
                    { name: '7단', price: 10000000, feeType: 'USAGE' },
                    { name: '6단', price: 12000000, feeType: 'USAGE' },
                    { name: '5단', price: 14000000, feeType: 'USAGE' },
                    { name: '4단', price: 12000000, feeType: 'USAGE' },
                    { name: '3단', price: 10000000, feeType: 'USAGE' },
                    { name: '2단', price: 8000000, feeType: 'USAGE' },
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                ]
            },
            // VVIP 봉안당
            {
                serviceType: 'BONGSAN', subType: 'VVIP 봉안당', groupType: '개인단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 5000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                    { name: '7단', price: 7000000, feeType: 'USAGE' },
                    { name: '6단', price: 8000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 8000000, feeType: 'USAGE' },
                    { name: '3단', price: 7000000, feeType: 'USAGE' },
                    { name: '2단', price: 6000000, feeType: 'USAGE' },
                    { name: '1단', price: 5000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: 'VVIP 봉안당', groupType: '부부단 (15년)', unit: '원', rows: [
                    { name: '9단', price: 10000000, feeType: 'USAGE' },
                    { name: '8단', price: 12000000, feeType: 'USAGE' },
                    { name: '7단', price: 14000000, feeType: 'USAGE' },
                    { name: '6단', price: 16000000, feeType: 'USAGE' },
                    { name: '5단', price: 20000000, feeType: 'USAGE' },
                    { name: '4단', price: 16000000, feeType: 'USAGE' },
                    { name: '3단', price: 14000000, feeType: 'USAGE' },
                    { name: '2단', price: 12000000, feeType: 'USAGE' },
                    { name: '1단', price: 10000000, feeType: 'USAGE' },
                ]
            },
            // 봉안담
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '개인단 (15년)', unit: '원', rows: [
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '3단', price: 4500000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '부부단 (15년)', unit: '원', rows: [
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '6단', price: 10000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 10000000, feeType: 'USAGE' },
                    { name: '3단', price: 9000000, feeType: 'USAGE' },
                    { name: '2단', price: 8000000, feeType: 'USAGE' },
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                ]
            },
            // 가족탑
            {
                serviceType: 'BONGSAN', subType: '가족탑', groupType: 'VIP 야외가족탑 (덮개형)', unit: '원', rows: [
                    { name: '2기', price: 25000000, feeType: 'USAGE' },
                    { name: '4기', price: 30000000, feeType: 'USAGE' },
                    { name: '6기', price: 35000000, feeType: 'USAGE' },
                    { name: '12기', price: 42000000, feeType: 'USAGE' },
                    { name: '16기', price: 56000000, feeType: 'USAGE' },
                    { name: '20기', price: 70000000, feeType: 'USAGE' },
                    { name: '24기', price: 84000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '가족탑', groupType: '야외가족탑', unit: '원', rows: [
                    { name: '12기', price: 30000000, feeType: 'USAGE' },
                    { name: '16기', price: 40000000, feeType: 'USAGE' },
                    { name: '20기', price: 50000000, feeType: 'USAGE' },
                    { name: '24기', price: 60000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0681', p: p681, websiteUrl: true });
        console.log('✅', p681.id, p681.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const updateData = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.websiteUrl) updateData.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
