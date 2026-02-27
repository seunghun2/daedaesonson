/**
 * park-0586, park-0587 — 용미리왕릉벽식추모의집, 용미리분묘형추모의집
 * 584와 동일 패턴 공설 봉안당. 관내/관외 아코디언 분리
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function makeRows() {
    return [
        {
            serviceType: 'BONGSAN', subType: '봉안당(관내)', unit: '원',
            rows: [
                {
                    name: '재사용료 (일반)', price: 100000, feeType: 'USAGE', isRepresentative: true,
                    grade: '5년 기간연장', residency: 'LOCAL', note: '신규사용 불가'
                },
                {
                    name: '재사용료 (유공자)', price: 50000, feeType: 'USAGE',
                    grade: '5년 기간연장, 국가유공자 및 배우자', residency: 'VETERAN'
                },
                {
                    name: '재사용료 (수급자)', price: 50000, feeType: 'USAGE',
                    grade: '5년 기간연장, 기초생활 수급자', residency: 'LOCAL'
                },
                { name: '관리비 (일반)', price: 100000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'LOCAL' },
                { name: '관리비 (유공자)', price: 50000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'VETERAN' },
                { name: '관리비 (수급자)', price: 25000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'LOCAL' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(관외)', unit: '원',
            rows: [
                {
                    name: '재사용료 (일반)', price: 300000, feeType: 'USAGE', isRepresentative: true,
                    grade: '5년 기간연장', residency: 'NON_LOCAL', note: '신규사용 불가'
                },
                {
                    name: '재사용료 (유공자)', price: 150000, feeType: 'USAGE',
                    grade: '5년 기간연장, 국가유공자 및 배우자', residency: 'VETERAN'
                },
                {
                    name: '재사용료 (수급자)', price: 120000, feeType: 'USAGE',
                    grade: '5년 기간연장, 기초생활 수급자', residency: 'NON_LOCAL'
                },
                { name: '관리비 (일반)', price: 180000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'NON_LOCAL' },
                { name: '관리비 (유공자)', price: 90000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'VETERAN' },
                { name: '관리비 (수급자)', price: 45000, feeType: 'MAINTENANCE', grade: '5년 단위', residency: 'NON_LOCAL' },
            ]
        }
    ];
}

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const ids = ['park-0586', 'park-0587'];

    for (const id of ids) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); continue; }
        if (!p.priceInfo) p.priceInfo = {};

        p.isPublic = true;
        p.operatorType = 'PUBLIC';
        p.phone = '031-943-1930';
        p.priceInfo.standardizedPrices = makeRows();
        p.priceInfo.priceVerified = true;
        p.minPrice = 100000;
        p.maxPrice = 300000;
        p.representativePrice = 100000;
        p.priceRange = { min: 100000, max: 300000 };
        p.hasDetailedPrices = true;

        console.log('✅', id, p.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    if (!SUPABASE_KEY) { console.log('⚠️ KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    for (const id of ids) {
        const p = data.find(x => x.id === id);
        const { error } = await supabase.from('Facility')
            .update({
                pricing: JSON.stringify(p.priceInfo),
                minPrice: p.minPrice, maxPrice: p.maxPrice,
                representativePrice: p.representativePrice,
                isPublic: p.isPublic, operatorType: p.operatorType,
                phone: p.phone,
            })
            .eq('id', id);
        console.log(error ? '❌ ' + id + ' ' + error.message : '✅ ' + id + ' DB 동기화');
    }
}
fix().catch(console.error);
