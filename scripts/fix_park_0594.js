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

    const park = data.find(x => x.id === 'park-0594');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('🔧 수정 전:', park.name);

    // === 공식 홈페이지 기준 가격 데이터 ===
    // 출처: https://www.hanulpark.co.kr/ (2013.04.01 기준)
    // 관리비: 개인 연 35,000원 / 부부 연 60,000원
    // 3년/5년/10년/영구 단위 납부 가능

    park.priceInfo = park.priceInfo || {};
    park.priceInfo.standardizedPrices = [
        // === 봉안당 (개인) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(개인)',
            unit: '원',
            rows: [
                { name: '7단', price: 2900000, feeType: 'USAGE' },
                { name: '6단', price: 2900000, feeType: 'USAGE' },
                { name: '5단', price: 3100000, feeType: 'USAGE' },
                { name: '4단', price: 3100000, feeType: 'USAGE' },
                { name: '3단', price: 2900000, feeType: 'USAGE' },
                { name: '2단', price: 2600000, feeType: 'USAGE' },
                { name: '1단', price: 2400000, feeType: 'USAGE', isRepresentative: true },
                { name: '관리비 (3년)', price: 105000, feeType: 'MAINTENANCE', grade: '연 35,000원' },
                { name: '관리비 (5년)', price: 175000, feeType: 'MAINTENANCE', grade: '연 35,000원' },
                { name: '관리비 (10년)', price: 350000, feeType: 'MAINTENANCE', grade: '연 35,000원' },
                { name: '관리비 (영구)', price: 1050000, feeType: 'MAINTENANCE', grade: '연 35,000원' },
            ]
        },
        // === 봉안당 (부부) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(부부)',
            unit: '원',
            rows: [
                { name: '7단', price: 5800000, feeType: 'USAGE' },
                { name: '6단', price: 5800000, feeType: 'USAGE' },
                { name: '5단', price: 6200000, feeType: 'USAGE' },
                { name: '4단', price: 6200000, feeType: 'USAGE' },
                { name: '3단', price: 5800000, feeType: 'USAGE' },
                { name: '2단', price: 5200000, feeType: 'USAGE' },
                { name: '1단', price: 4800000, feeType: 'USAGE' },
                { name: '관리비 (3년)', price: 180000, feeType: 'MAINTENANCE', grade: '연 60,000원' },
                { name: '관리비 (5년)', price: 300000, feeType: 'MAINTENANCE', grade: '연 60,000원' },
                { name: '관리비 (10년)', price: 600000, feeType: 'MAINTENANCE', grade: '연 60,000원' },
                { name: '관리비 (영구)', price: 1800000, feeType: 'MAINTENANCE', grade: '연 60,000원' },
            ]
        },
    ];

    // 가격 범위 (USAGE만)
    const allPrices = park.priceInfo.standardizedPrices
        .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const repPrice = 2400000; // 개인 1단

    park.priceInfo.minPrice = minPrice;
    park.priceInfo.maxPrice = maxPrice;
    park.priceInfo.representativePrice = repPrice;
    park.priceInfo.priceRange = { min: minPrice, max: maxPrice };
    park.priceInfo.hasDetailedPrices = true;

    // websiteUrl
    park.websiteUrl = 'https://www.hanulpark.co.kr';

    console.log('✅ 수정 완료:', park.name);
    console.log('  그룹 수:', park.priceInfo.standardizedPrices.length);
    park.priceInfo.standardizedPrices.forEach((sp, i) => {
        console.log(`  [${i}] ${sp.subType}: ${sp.rows.length}개`);
    });
    console.log('  대표가:', repPrice, '| 범위:', minPrice, '~', maxPrice);

    // JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    const { error } = await supabase
        .from('Facility')
        .update({
            pricing: JSON.stringify(park.priceInfo),
            websiteUrl: park.websiteUrl,
        })
        .eq('id', 'park-0594');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
