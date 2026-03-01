/**
 * park-0695~0696 일괄 처리
 *
 * 695 (재)자하연포천(봉안) → 아카이브+공홈 jahayeon.com
 *   9.9㎡ 2기탑형: 11,500,000
 *   13.2㎡ 4기탑형: 13,500,000
 *   23.1㎡ 12기탑형: 23,500,000
 *   16.5㎡ 8기탑형: 21,500,000
 *   관리비: ㎡당 25,000/년
 *
 * 696 서대문구추모의집 → 공홈 sdm.go.kr
 *   최초(15년):
 *     서대문구 주민·직장인·가족: 200,000
 *     국가유공자·배우자: 100,000
 *     기초수급자·장애인·차상위: 100,000
 *     장기기증자: 면제
 *   연장시(5년):
 *     서대문구 주민·직장인·가족: 70,000
 *     국가유공자·배우자: 35,000
 *     기초수급자·장애인·차상위: 35,000
 *     장기기증자: 35,000
 *   관리비: 44,000/년, 15년 선납 (부부단 88,000)
 *   사용기간 최장30년(최초15+5년×3회 연장)
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

    // ===== 695 (재)자하연포천(봉안) =====
    const p695 = data.find(x => x.id === 'park-0695');
    if (p695) {
        p695.websiteUrl = 'https://jahayeon.com';
        p695.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안묘', groupType: '사용료', unit: '원', rows: [
                    { name: '9.9㎡ (2기 탑형)', price: 11500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '13.2㎡ (4기 탑형)', price: 13500000, feeType: 'USAGE' },
                    { name: '16.5㎡ (8기 탑형)', price: 21500000, feeType: 'USAGE' },
                    { name: '23.1㎡ (12기 탑형)', price: 23500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안묘', groupType: '관리비', unit: '원', rows: [
                    { name: '㎡당 (1년)', price: 25000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0695', p: p695, ws: true });
        console.log('✅', p695.id, p695.name);
    }

    // ===== 696 서대문구추모의집 =====
    const p696 = data.find(x => x.id === 'park-0696');
    if (p696) {
        p696.websiteUrl = 'https://www.sdm.go.kr/welfare/old/cherish.do';
        p696.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '최초 신청 (15년)', unit: '원', rows: [
                    { name: '서대문구 주민·직장인 및 가족', price: 200000, feeType: 'USAGE', isRepresentative: true },
                    { name: '국가유공자 및 배우자', price: 100000, feeType: 'USAGE' },
                    { name: '기초수급자·장애인연금수급자·차상위', price: 100000, feeType: 'USAGE' },
                    { name: '장기기증자', price: 0, feeType: 'USAGE', grade: '면제' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '연장 (매 5년)', unit: '원', rows: [
                    { name: '서대문구 주민·직장인 및 가족', price: 70000, feeType: 'USAGE' },
                    { name: '국가유공자 및 배우자', price: 35000, feeType: 'USAGE' },
                    { name: '기초수급자·장애인연금수급자·차상위', price: 35000, feeType: 'USAGE' },
                    { name: '장기기증자', price: 35000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 (15년 선납)', unit: '원', rows: [
                    { name: '개인단 (44,000/년 × 15년)', price: 660000, feeType: 'MAINTENANCE' },
                    { name: '부부단 (88,000/년 × 15년)', price: 1320000, feeType: 'MAINTENANCE', grade: '일반요금의 2배' },
                ]
            },
        ];
        updates.push({ id: 'park-0696', p: p696, ws: true });
        console.log('✅', p696.id, p696.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
