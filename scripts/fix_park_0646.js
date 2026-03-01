/**
 * park-0646 구미시공설숭조당 제2관 → 아카이브 (공설)
 * 일반실(구미시민): 200,000 / 일반실(타지역): 700,000
 * 부부단실(구미시민): 300,000 / 부부단실(타지역): 1,100,000
 * 국가유공자 일반실(구미시민): 100,000 / 국가유공자 부부단실(구미시민): 150,000
 * 국가유공자 일반실(타지역): 350,000 / 국가유공자 부부단실(타지역): 550,000
 * 기본 15년(1회 15년씩 2회까지 연장가능)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0646');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '사용료', price: 200000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true, grade: '15년 (2회 연장가능)' },
                { name: '사용료', price: 700000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 (2회 연장가능)' },
                { name: '사용료 (유공자)', price: 100000, feeType: 'USAGE', residency: 'LOCAL', grade: '국가유공자' },
                { name: '사용료 (유공자)', price: 350000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '국가유공자' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '15년 (2회 연장가능)' },
                { name: '사용료', price: 1100000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 (2회 연장가능)' },
                { name: '사용료 (유공자)', price: 150000, feeType: 'USAGE', residency: 'LOCAL', grade: '국가유공자' },
                { name: '사용료 (유공자)', price: 550000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '국가유공자' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0646');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
