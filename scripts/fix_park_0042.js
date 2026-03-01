/**
 * park-0042 별그리다(THE HILL) — 공홈 기준 전체 재구성
 * 매장 봉안묘 (The Hill) + 봉안담 (The Wall) + 수목장 (별의숲)
 * http://www.star4ever.com
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const W = 10000; // 만원

async function fix() {
    const fp = path.join(__dirname, '..', 'data', 'facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const p = data.find(x => x.id === 'park-0042');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'http://www.star4ever.com';
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        // ==================== 1) 봉안묘 (The Hill) ====================
        {
            serviceType: 'BURIAL', subType: '봉안전용묘', groupType: 'The Hill', unit: '원',
            rows: [
                { name: '3.3㎡ (1평)', price: 13500000, feeType: 'USAGE', grade: '봉안전용묘', isRepresentative: true },
                { name: '5.0㎡ (1.5평)', price: 16900000, feeType: 'USAGE', grade: '봉안전용묘 (최소)' },
                { name: '5.0㎡ (1.5평)', price: 20200000, feeType: 'USAGE', grade: '봉안전용묘 (최대)' },
                { name: '10㎡ (3평) 단장형', price: 29800000, feeType: 'USAGE', grade: '토지 1,000만 + 석물 1,980만~' },
                { name: '15㎡ (4.5평) 합장형', price: 51300000, feeType: 'USAGE', grade: '대가족형' },
                { name: '관리비 (10㎡ 단장형)', price: 260000, feeType: 'MAINTENANCE', grade: '연간' },
                { name: '관리비 (15㎡ 합장형)', price: 390000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        },
        // ==================== 2) 봉안담 (The Wall) ====================
        {
            serviceType: 'BONGSAN', subType: '봉안담 (개인형)', groupType: 'The Wall', unit: '원',
            rows: [
                { name: '개인형 (최저)', price: 2650000, feeType: 'USAGE', grade: '단별 차등' },
                { name: '개인형 (최고)', price: 4650000, feeType: 'USAGE', grade: '단별 차등' },
                { name: '관리비', price: 25000, feeType: 'MAINTENANCE', grade: '연간 (15년 선납 375,000원)' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안담 (부부형)', groupType: 'The Wall', unit: '원',
            rows: [
                { name: '부부형 (최저)', price: 4240000, feeType: 'USAGE', grade: '단별 차등' },
                { name: '부부형 (최고)', price: 7440000, feeType: 'USAGE', grade: '단별 차등' },
                { name: '관리비', price: 40000, feeType: 'MAINTENANCE', grade: '연간 (15년 선납 600,000원)' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안담 (가족형)', groupType: 'The Wall', unit: '원',
            rows: [
                { name: '가족형 (12위 이상)', price: 33200000, feeType: 'USAGE', grade: '12위 이상' },
                { name: '관리비', price: 288000, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 1,440,000원)' },
            ]
        },
        // ==================== 3) 수목장 (별의숲) — 상록 침엽수 ====================
        {
            serviceType: 'TREE_BURIAL', subType: '수목형 (상록 침엽수)', groupType: '별의숲', unit: '원',
            rows: [
                { name: '소나무', price: 1680000, feeType: 'USAGE', grade: '1기(공동형)~12기 / 168만~4,560만원' },
                { name: '소나무 관리비', price: 20000, feeType: 'MAINTENANCE', grade: '연간 (2만~45.6만원)' },
                { name: '주목나무', price: 9600000, feeType: 'USAGE', grade: '4기 / 960만~1,200만원' },
                { name: '주목나무 관리비', price: 96000, feeType: 'MAINTENANCE', grade: '연간 (9.6만~12만원)' },
                { name: '향나무', price: 13200000, feeType: 'USAGE', grade: '4~8기 / 1,320만~1,860만원' },
                { name: '향나무 관리비', price: 132000, feeType: 'MAINTENANCE', grade: '연간 (13.2만~18.6만원)' },
                { name: '반송', price: 10400000, feeType: 'USAGE', grade: '4~6기 / 1,040만~3,960만원' },
                { name: '반송 관리비', price: 104000, feeType: 'MAINTENANCE', grade: '연간 (10.4만~39.6만원)' },
                { name: '섬잣나무', price: 16200000, feeType: 'USAGE', grade: '6기 / 1,620만~1,860만원' },
                { name: '섬잣나무 관리비', price: 162000, feeType: 'MAINTENANCE', grade: '연간 (16.2만~18.6만원)' },
            ]
        },
        // ==================== 4) 수목장 (별의숲) — 낙엽수 ====================
        {
            serviceType: 'TREE_BURIAL', subType: '수목형 (낙엽수)', groupType: '별의숲', unit: '원',
            rows: [
                { name: '느티나무', price: 1380000, feeType: 'USAGE', grade: '1기(공동형)~12기 / 138만~3,960만원' },
                { name: '느티나무 관리비', price: 20000, feeType: 'MAINTENANCE', grade: '연간 (2만~39.6만원)' },
                { name: '왕벚나무', price: 12600000, feeType: 'USAGE', grade: '6~8기 / 1,260만~1,500만원' },
                { name: '왕벚나무 관리비', price: 126000, feeType: 'MAINTENANCE', grade: '연간' },
                { name: '라일락', price: 9600000, feeType: 'USAGE', grade: '4기' },
                { name: '라일락 관리비', price: 96000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        },
        // ==================== 5) 부대 서비스 ====================
        {
            serviceType: 'BURIAL', subType: '부대 서비스', unit: '원',
            rows: [
                { name: '식사', price: 12000, feeType: 'USAGE', grade: '1인' },
                { name: '제사상', price: 230000, feeType: 'USAGE', grade: '37만원, 60만원 상도 주문 가능' },
                { name: '조화', price: 5000, feeType: 'USAGE', grade: '5,000 ~ 12,000원' },
            ]
        },
    ];

    p.priceInfo.representativePrice = 2650000; // 봉안담 개인형 최저

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
        websiteUrl: p.websiteUrl,
    }).eq('id', 'park-0042');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}

fix().catch(console.error);
