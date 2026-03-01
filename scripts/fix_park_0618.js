/**
 * park-0618 별그리다(THE WALL) — e하늘 이미지 + 공홈 기준
 * 봉안담(개인/부부/가족) + 봉안묘(소형/대형/THE PROUD) + 부대서비스
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function fix() {
    const fp = path.join(__dirname, '..', 'data', 'facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const p = data.find(x => x.id === 'park-0618');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'http://www.star4ever.com';
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        // 봉안담 (개인단/부부단/가족단)
        {
            serviceType: 'BONGSAN', subType: '봉안담', groupType: 'The Wall', unit: '원',
            rows: [
                { name: '개인단', price: 2650000, feeType: 'USAGE', grade: '개인형 1단~5단, 상세금액 문의', isRepresentative: true },
                { name: '부부단', price: 4240000, feeType: 'USAGE', grade: '부부형 1단~5단, 상세금액 문의' },
                { name: '가족단', price: 33200000, feeType: 'USAGE', grade: '가족형' },
                { name: '관리비 (개인형)', price: 25000, feeType: 'MAINTENANCE', grade: '연간 (15년 선납 375,000원)' },
                { name: '관리비 (부부형)', price: 40000, feeType: 'MAINTENANCE', grade: '연간 (15년 선납 600,000원)' },
                { name: '관리비 (가족형)', price: 288000, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 1,440,000원)' },
            ]
        },
        // 봉안묘
        {
            serviceType: 'BONGSAN', subType: '봉안묘', groupType: 'The Wall', unit: '원',
            rows: [
                { name: '봉안묘(소형)', price: 13500000, feeType: 'USAGE', grade: '봉안 4~8위 가족묘, 상세금액 문의' },
                { name: '봉안묘(대형)', price: 15400000, feeType: 'USAGE', grade: '봉안 12~36위 가족묘, 토지사용료 별도' },
            ]
        },
        // 봉안묘 (THE PROUD)
        {
            serviceType: 'BONGSAN', subType: '봉안묘', groupType: 'The Wall THE PROUD', unit: '원',
            rows: [
                { name: '봉안묘(소형/THE PROUD)', price: 17500000, feeType: 'USAGE', grade: '봉안 4~8위 가족묘, 상세금액 문의' },
                { name: '봉안묘(대형/THE PROUD)', price: 17820000, feeType: 'USAGE', grade: '봉안 12~36위 가족묘, 토지사용료 별도' },
            ]
        },
        // 부대 서비스
        {
            serviceType: 'BONGSAN', subType: '부대 서비스', unit: '원',
            rows: [
                { name: '식사', price: 12000, feeType: 'USAGE', grade: '우거지국, 볶아국, 육개장 중 택1, 기본찬 4' },
                { name: '제사상', price: 230000, feeType: 'USAGE', grade: '23만·37만·60만원 주문 가능' },
                { name: '조화', price: 5000, feeType: 'USAGE', grade: '5,000~12,000원' },
            ]
        },
        // 장사용품
        {
            serviceType: 'BONGSAN', subType: '장사용품', unit: '원',
            rows: [
                { name: '유골함아리', price: 100000, feeType: 'USAGE', grade: '21×23 / 도자기 / 한국' },
            ]
        },
    ];

    p.priceInfo.representativePrice = 2650000;

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
        websiteUrl: p.websiteUrl,
    }).eq('id', 'park-0618');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}

fix().catch(console.error);
