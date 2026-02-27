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

    const park = data.find(x => x.id === 'park-0591');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('🔧 수정 전:', park.name);
    console.log('  기존 rows:', park.priceInfo?.standardizedPrices?.[0]?.rows?.length);

    // === e하늘 이미지 + 공식 홈페이지 기준 가격 데이터 ===
    // 출처: e하늘 장사정보시스템 + http://www.bojangsa.co.kr
    // 관리비: 1위당 5년 선납 250,000원 (연 50,000원)
    // 복합단(1단/8단 등) → 개별 분리

    park.priceInfo = park.priceInfo || {};
    park.priceInfo.standardizedPrices = [
        // === 봉안당(개인) - 일반형 (24.5×26.5×28.2cm) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(개인)',
            groupType: '일반형',
            unit: '원',
            rows: [
                { name: '1단', price: 3000000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm', isRepresentative: true },
                { name: '8단', price: 3000000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '2단', price: 3700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '7단', price: 3700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '3단', price: 4200000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '6단', price: 4200000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '4단', price: 4700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '5단', price: 4700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '관리비 (5년 선납)', price: 250000, feeType: 'MAINTENANCE', grade: '1위당, 연 50,000원' },
            ]
        },
        // === 봉안당(개인) - 고급형 (24.5×26.5×28.2cm) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(개인)',
            groupType: '고급형',
            unit: '원',
            rows: [
                { name: '1단', price: 3700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '8단', price: 3700000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '2단', price: 4200000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '7단', price: 4200000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '3단', price: 4500000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '6단', price: 4500000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '4단', price: 5000000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '5단', price: 5000000, feeType: 'USAGE', grade: '24.5×26.5×28.2cm' },
                { name: '관리비 (5년 선납)', price: 250000, feeType: 'MAINTENANCE', grade: '1위당, 연 50,000원' },
            ]
        },
        // === 봉안당(부부) - 일반형 (51.8×25.8×28.8cm) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(부부)',
            groupType: '일반형',
            unit: '원',
            rows: [
                { name: '1단', price: 6000000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '8단', price: 6000000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '2단', price: 6800000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '7단', price: 6800000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '3단', price: 7500000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '6단', price: 7500000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '4단', price: 8500000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '5단', price: 8500000, feeType: 'USAGE', grade: '51.8×25.8×28.8cm' },
                { name: '관리비 (5년 선납)', price: 250000, feeType: 'MAINTENANCE', grade: '1위당, 연 50,000원' },
            ]
        },
        // === 봉안당(부부) - 고급형 (58.5×29.5×28.8cm) ===
        {
            serviceType: 'BONGSAN',
            subType: '봉안당(부부)',
            groupType: '고급형',
            unit: '원',
            rows: [
                { name: '1단', price: 8000000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '2단', price: 8500000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '7단', price: 8500000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '3단', price: 9000000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '6단', price: 9000000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '4단', price: 10000000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '5단', price: 10000000, feeType: 'USAGE', grade: '58.5×29.5×28.8cm' },
                { name: '관리비 (5년 선납)', price: 250000, feeType: 'MAINTENANCE', grade: '1위당, 연 50,000원' },
            ]
        },
    ];

    // 가격 범위 계산 (USAGE만)
    const allPrices = park.priceInfo.standardizedPrices
        .flatMap(sp => sp.rows.filter(r => r.feeType === 'USAGE').map(r => r.price));
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const repPrice = 3000000; // 개인 일반형 1단

    park.priceInfo.minPrice = minPrice;
    park.priceInfo.maxPrice = maxPrice;
    park.priceInfo.representativePrice = repPrice;
    park.priceInfo.priceRange = { min: minPrice, max: maxPrice };
    park.priceInfo.hasDetailedPrices = true;

    // websiteUrl 추가
    park.websiteUrl = 'http://www.bojangsa.co.kr';

    console.log('✅ 수정 완료:', park.name);
    console.log('  그룹 수:', park.priceInfo.standardizedPrices.length);
    park.priceInfo.standardizedPrices.forEach((sp, i) => {
        console.log(`  [${i}] ${sp.subType} - ${sp.groupType}: ${sp.rows.length}개`);
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
        .eq('id', 'park-0591');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
