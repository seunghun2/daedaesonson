/**
 * park-0662 (재)용인공원(봉안담·묘) → 아카이브
 *   봉안담 4단 센터 기준: 7,900,000
 *   관리비 개인단: 30,000/년, 부부단: 50,000/년
 *
 * park-0664 만인산 만인사 봉안당 → 아카이브
 *   안치단 1단~9단 (275mm×275mm): 1,500,000
 *   안치단 2단~8단 (275mm×275mm): 2,000,000
 *   안치단 3단 (275mm×275mm): 3,000,000
 *   안치단 4단 (275mm×275mm): 3,500,000
 *   안치단 5단·6단 (275mm×275mm): 4,000,000
 *   안치단 7단 (275mm×275mm): 3,500,000
 *   관리비: 40,000/년
 *
 * park-0665 영락공원 → 공홈
 *   https://www.bisco.or.kr/yeongnakpark/index.asp
 *   15년: 부산시내 120,000 / 타시도 사용불가
 *   연장: 5년씩 3회, 1회당 60,000
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

    // ===== 662 (재)용인공원(봉안담·묘) =====
    const p662 = data.find(x => x.id === 'park-0662');
    if (p662) {
        p662.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                    { name: '사용료', price: 7900000, feeType: 'USAGE', isRepresentative: true, grade: '4단 센터 기준' },
                    { name: '관리비 (개인단)', price: 30000, feeType: 'MAINTENANCE', grade: '1년' },
                    { name: '관리비 (부부단)', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            },
        ];
        updates.push({ id: 'park-0662', p: p662 });
        console.log('✅', p662.id, p662.name);
    }

    // ===== 664 만인산 만인사 봉안당 =====
    const p664 = data.find(x => x.id === 'park-0664');
    if (p664) {
        p664.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                    { name: '1단·9단', price: 1500000, feeType: 'USAGE', isRepresentative: true, grade: '275mm×275mm' },
                    { name: '2단·8단', price: 2000000, feeType: 'USAGE', grade: '275mm×275mm' },
                    { name: '3단', price: 3000000, feeType: 'USAGE', grade: '275mm×275mm' },
                    { name: '4단', price: 3500000, feeType: 'USAGE', grade: '275mm×275mm' },
                    { name: '5단·6단', price: 4000000, feeType: 'USAGE', grade: '275mm×275mm' },
                    { name: '7단', price: 3500000, feeType: 'USAGE', grade: '275mm×275mm' },
                    { name: '관리비', price: 40000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            },
        ];
        updates.push({ id: 'park-0664', p: p664 });
        console.log('✅', p664.id, p664.name);
    }

    // ===== 665 영락공원 =====
    const p665 = data.find(x => x.id === 'park-0665');
    if (p665) {
        p665.websiteUrl = 'https://www.bisco.or.kr/yeongnakpark/index.asp';
        p665.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                    { name: '사용료 (15년)', price: 120000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL', grade: '부산시내, 타시도 사용불가' },
                    { name: '연장사용료', price: 60000, feeType: 'USAGE', grade: '5년씩 3회 연장 가능' },
                ]
            },
        ];
        updates.push({ id: 'park-0665', p: p665, websiteUrl: true });
        console.log('✅', p665.id, p665.name);
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
