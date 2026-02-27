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

    const park = data.find(x => x.id === 'park-0590');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('🔧 수정 전:', park.name);
    console.log('  기존 rows:', park.priceInfo?.standardizedPrices?.[0]?.rows?.length);

    // === 공식 홈페이지 기준 가격 데이터 ===
    // 출처: http://xn--289a71jftad9zslkca.com/angel/
    // 사용기간: 봉안일 기준 20년, 이후 10년 단위 연장 가능
    // 관리비: 연 50,000원 × 20년 선납 = 1,000,000원

    park.priceInfo = park.priceInfo || {};
    park.priceInfo.standardizedPrices = [
        // 봉안당 (개인) - 1위
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(개인)',
            unit: '원',
            rows: [
                { name: '8단', price: 3000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '7단', price: 4000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '6단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '5단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '4단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '3단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년', isRepresentative: true },
                { name: '2단', price: 4000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '1단', price: 3000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '관리비 (20년 선납)', price: 1000000, feeType: 'MAINTENANCE', grade: '연 50,000원 × 20년, 물가상승 변동 가능' },
            ]
        },
        // 봉안당 (부부) - 2위
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(부부)',
            unit: '원',
            rows: [
                { name: '8단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '7단', price: 7000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '6단', price: 9000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '5단', price: 9000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '4단', price: 9000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '3단', price: 9000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '2단', price: 7000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '1단', price: 5000000, feeType: 'USAGE', grade: '사용기간: 20년' },
                { name: '관리비 (20년 선납)', price: 1000000, feeType: 'MAINTENANCE', grade: '연 50,000원 × 20년, 물가상승 변동 가능' },
            ]
        },
    ];

    // 가격 범위 계산
    const allPrices = park.priceInfo.standardizedPrices
        .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const repPrice = park.priceInfo.standardizedPrices[0].rows.find(r => r.isRepresentative)?.price || minPrice;

    park.priceInfo.minPrice = minPrice;
    park.priceInfo.maxPrice = maxPrice;
    park.priceInfo.representativePrice = repPrice;
    park.priceInfo.priceRange = { min: minPrice, max: maxPrice };
    park.priceInfo.hasDetailedPrices = true;

    // websiteUrl 추가
    park.websiteUrl = 'http://xn--289a71jftad9zslkca.com';

    console.log('✅ 수정 완료:', park.name);
    console.log('  개인 rows:', park.priceInfo.standardizedPrices[0].rows.length);
    console.log('  부부 rows:', park.priceInfo.standardizedPrices[1].rows.length);
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
        .eq('id', 'park-0590');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
