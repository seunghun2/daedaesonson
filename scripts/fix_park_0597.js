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

    const park = data.find(x => x.id === 'park-0597');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('🔧 수정 전:', park.name);

    // === 공식 홈페이지 기준 (1순위) ===
    // 출처: http://www.bluewindpark.com/
    // 영구이용

    park.priceInfo = park.priceInfo || {};
    park.priceInfo.standardizedPrices = [
        // 봉안당 (개인) - 영구이용
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(개인)',
            unit: '원',
            rows: [
                { name: '8단', price: 2400000, feeType: 'USAGE', grade: '영구이용' },
                { name: '7단', price: 3200000, feeType: 'USAGE', grade: '영구이용' },
                { name: '6단', price: 4000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '5단', price: 4000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '4단', price: 4000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '3단', price: 3200000, feeType: 'USAGE', grade: '영구이용' },
                { name: '2단', price: 2400000, feeType: 'USAGE', grade: '영구이용' },
                { name: '1단', price: 1600000, feeType: 'USAGE', grade: '영구이용', isRepresentative: true },
            ]
        },
        // 봉안당 (합장/부부) - 영구이용
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(부부)',
            unit: '원',
            rows: [
                { name: '8단', price: 4800000, feeType: 'USAGE', grade: '영구이용' },
                { name: '7단', price: 6400000, feeType: 'USAGE', grade: '영구이용' },
                { name: '6단', price: 8000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '5단', price: 8000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '4단', price: 8000000, feeType: 'USAGE', grade: '영구이용' },
                { name: '3단', price: 6400000, feeType: 'USAGE', grade: '영구이용' },
                { name: '2단', price: 4800000, feeType: 'USAGE', grade: '영구이용' },
                { name: '1단', price: 3200000, feeType: 'USAGE', grade: '영구이용' },
            ]
        },
    ];

    const allPrices = park.priceInfo.standardizedPrices
        .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
    park.priceInfo.minPrice = Math.min(...allPrices);
    park.priceInfo.maxPrice = Math.max(...allPrices);
    park.priceInfo.representativePrice = 1600000;
    park.priceInfo.priceRange = { min: park.priceInfo.minPrice, max: park.priceInfo.maxPrice };
    park.priceInfo.hasDetailedPrices = true;
    park.websiteUrl = 'http://www.bluewindpark.com';

    console.log('✅', park.name);
    console.log('  대표가:', park.priceInfo.representativePrice, '| 범위:', park.priceInfo.minPrice, '~', park.priceInfo.maxPrice);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(park.priceInfo), websiteUrl: park.websiteUrl })
        .eq('id', 'park-0597');

    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
