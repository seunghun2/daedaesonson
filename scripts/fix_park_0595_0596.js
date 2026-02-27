const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(
        'https://jbydmhfuqnpukfutvrgs.supabase.co',
        process.env.SUPABASE_SERVICE_KEY
    );

    // ============================================
    // park-0595: 천주교용인공원묘원(봉안)
    // 출처: http://yi.catholic.or.kr/main.php
    // 봉안묘(야외) → serviceType: BURIAL
    // 10년 관리비 포함 금액
    // 안치비, 유골함비, 각자비 별도
    // ============================================
    {
        const park = data.find(x => x.id === 'park-0595');
        if (!park) { console.log('park-0595 NOT FOUND'); return; }

        console.log('🔧 park-0595:', park.name);

        park.priceInfo = park.priceInfo || {};
        park.priceInfo.standardizedPrices = [
            // 봉안묘 벽식형 (개인)
            {
                serviceType: 'BURIAL',
                subType: '봉안묘(개인)',
                groupType: '벽식형',
                unit: '원',
                rows: [
                    { name: '7단', price: 2500000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '6단', price: 2500000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '5단', price: 3600000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '4단', price: 3600000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '3단', price: 3600000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '2단', price: 2500000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '1단', price: 2100000, feeType: 'USAGE', grade: '10년 관리비 포함', isRepresentative: true },
                ]
            },
            // 봉안묘 벽식형 (부부)
            {
                serviceType: 'BURIAL',
                subType: '봉안묘(부부)',
                groupType: '벽식형',
                unit: '원',
                rows: [
                    { name: '7단', price: 5000000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '6단', price: 5000000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '5단', price: 7200000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '4단', price: 7200000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '3단', price: 7200000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '2단', price: 5000000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '1단', price: 4200000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                ]
            },
            // 봉안묘 매장형 (가족묘)
            {
                serviceType: 'BURIAL',
                subType: '봉안묘(가족)',
                groupType: '매장형',
                unit: '원',
                rows: [
                    { name: '6위형', price: 13200000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '8위형', price: 17600000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                    { name: '10위형', price: 22000000, feeType: 'USAGE', grade: '10년 관리비 포함' },
                ]
            },
        ];

        const allPrices = park.priceInfo.standardizedPrices
            .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
        park.priceInfo.minPrice = Math.min(...allPrices);
        park.priceInfo.maxPrice = Math.max(...allPrices);
        park.priceInfo.representativePrice = 2100000;
        park.priceInfo.priceRange = { min: park.priceInfo.minPrice, max: park.priceInfo.maxPrice };
        park.priceInfo.hasDetailedPrices = true;
        park.websiteUrl = 'http://yi.catholic.or.kr';

        console.log('✅ park-0595 완료 | 대표가:', park.priceInfo.representativePrice, '| 범위:', park.priceInfo.minPrice, '~', park.priceInfo.maxPrice);
    }

    // ============================================
    // park-0596: 홍성추모공원봉안당
    // 출처: https://www.hongseong.go.kr/choomo/index.do
    // 공설 → 관내/인접/권외 구분
    // ============================================
    {
        const park = data.find(x => x.id === 'park-0596');
        if (!park) { console.log('park-0596 NOT FOUND'); return; }

        console.log('🔧 park-0596:', park.name);

        park.priceInfo = park.priceInfo || {};
        park.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN',
                subType: '봉안당',
                unit: '원',
                rows: [
                    { name: '일반 (1위)', price: 700000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL', isRepresentative: true },
                    { name: '일반 (1위)', price: 700000, feeType: 'USAGE', grade: '15년, 인접 지역', residency: 'LOCAL' },
                    { name: '일반 (1위)', price: 1100000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '부부용 (2위)', price: 1900000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL' },
                    { name: '부부용 (2위)', price: 1900000, feeType: 'USAGE', grade: '15년, 인접 지역', residency: 'LOCAL' },
                    { name: '부부용 (2위)', price: 2500000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '무연유골 (1위/5년)', price: 100000, feeType: 'USAGE', grade: '관내만 가능', residency: 'LOCAL' },
                    { name: '무연유골 (1위/10년)', price: 100000, feeType: 'USAGE', grade: '관내만 가능', residency: 'LOCAL' },
                    { name: '무연고 (6위/5년)', price: 100000, feeType: 'USAGE', grade: '관내만 가능', residency: 'LOCAL' },
                ]
            },
        ];

        const allPrices = park.priceInfo.standardizedPrices
            .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE' && r.price > 100000).map(r => r.price));
        park.priceInfo.minPrice = Math.min(...allPrices);
        park.priceInfo.maxPrice = Math.max(...allPrices);
        park.priceInfo.representativePrice = 700000;
        park.priceInfo.priceRange = { min: park.priceInfo.minPrice, max: park.priceInfo.maxPrice };
        park.priceInfo.hasDetailedPrices = true;
        park.websiteUrl = 'https://www.hongseong.go.kr/choomo/index.do';

        console.log('✅ park-0596 완료 | 대표가:', park.priceInfo.representativePrice, '| 범위:', park.priceInfo.minPrice, '~', park.priceInfo.maxPrice);
    }

    // JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of ['park-0595', 'park-0596']) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({
                pricing: JSON.stringify(f.priceInfo),
                websiteUrl: f.websiteUrl,
            })
            .eq('id', id);

        if (error) console.log('❌', id, error.message);
        else console.log('☁️', id, 'Supabase 동기화 완료');
    }
}

fix();
