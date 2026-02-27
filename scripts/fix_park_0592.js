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

    const park = data.find(x => x.id === 'park-0592');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('🔧 수정 전:', park.name);

    // === 공식 홈페이지 기준 가격 데이터 ===
    // 출처: https://hwasanpark.co.kr/
    // 관리비: 15년 단위 선납, 잔디조성 및 벌초 등
    // 석물대금 별도
    // 계약금: 총금액의 10%, 잔금: 약정기간 이내 납부

    park.priceInfo = park.priceInfo || {};
    park.priceInfo.standardizedPrices = [
        // === 매장 (BURIAL) ===
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            unit: '원',
            rows: [
                { name: '단장 (잔디형)', price: 5270000, feeType: 'USAGE', grade: '6평형, 매장 1구', isRepresentative: true },
                { name: '합장 (잔디형)', price: 7900000, feeType: 'USAGE', grade: '9평형, 매장 2구' },
                { name: '단장 관리비', price: 1730000, feeType: 'MAINTENANCE', grade: '15년 선납' },
                { name: '합장 관리비', price: 2600000, feeType: 'MAINTENANCE', grade: '15년 선납' },
            ]
        },
        // === 납골 (야외 봉안묘 → BURIAL) ===
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            unit: '원',
            rows: [
                { name: '6기 (부부납골)', price: 2630000, feeType: 'USAGE', grade: '3평형, 현무 3호' },
                { name: '12기', price: 3950000, feeType: 'USAGE', grade: '4.5평형, 현무 4호' },
                { name: '24기', price: 5270000, feeType: 'USAGE', grade: '6평형, 현무 5호' },
                { name: '36기', price: 7900000, feeType: 'USAGE', grade: '9평형, 현무 6호' },
                { name: '60기 (종중납골)', price: 13180000, feeType: 'USAGE', grade: '15평형, 현무 7호' },
                { name: '6기 관리비', price: 860000, feeType: 'MAINTENANCE', grade: '15년 선납' },
                { name: '12기 관리비', price: 1300000, feeType: 'MAINTENANCE', grade: '15년 선납' },
                { name: '24기 관리비', price: 1730000, feeType: 'MAINTENANCE', grade: '15년 선납' },
                { name: '36기 관리비', price: 2600000, feeType: 'MAINTENANCE', grade: '15년 선납' },
                { name: '60기 관리비', price: 4340000, feeType: 'MAINTENANCE', grade: '15년 선납' },
            ]
        },
    ];

    // 가격 범위 계산 (USAGE만)
    const allPrices = park.priceInfo.standardizedPrices
        .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const repPrice = 5270000; // 매장 단장

    park.priceInfo.minPrice = minPrice;
    park.priceInfo.maxPrice = maxPrice;
    park.priceInfo.representativePrice = repPrice;
    park.priceInfo.priceRange = { min: minPrice, max: maxPrice };
    park.priceInfo.hasDetailedPrices = true;

    // websiteUrl 추가
    park.websiteUrl = 'https://hwasanpark.co.kr';

    console.log('✅ 수정 완료:', park.name);
    console.log('  그룹 수:', park.priceInfo.standardizedPrices.length);
    park.priceInfo.standardizedPrices.forEach((sp, i) => {
        console.log(`  [${i}] ${sp.serviceType} ${sp.subType}: ${sp.rows.length}개`);
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
        .eq('id', 'park-0592');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
