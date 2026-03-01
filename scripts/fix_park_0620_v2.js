/**
 * park-0620 청아공원 → 홀별 그룹핑으로 재구성
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const p = data.find(x => x.id === 'park-0620');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 매화홀, 하늘홀, 믿음홀, 청아홀
        {
            serviceType: 'BONGSAN', subType: '매화홀, 하늘홀, 믿음홀, 청아홀', unit: '원',
            rows: [
                { name: '개인', price: 5500000, feeType: 'USAGE', isRepresentative: true, grade: '550만원 ~ 2,500만원' },
                { name: '부부', price: 11000000, feeType: 'USAGE', grade: '1,100만원 ~ 5,000만원' },
            ]
        },
        // 난초홀, 평화홀, 승리홀
        {
            serviceType: 'BONGSAN', subType: '난초홀, 평화홀, 승리홀', unit: '원',
            rows: [
                { name: '개인', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '부부', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
            ]
        },
        // 국화홀, 대지홀, 은혜홀
        {
            serviceType: 'BONGSAN', subType: '국화홀, 대지홀, 은혜홀', unit: '원',
            rows: [
                { name: '개인', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '부부', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
                { name: '개인 (보급형)', price: 1000000, feeType: 'USAGE', grade: '100만원 ~ 500만원' },
            ]
        },
        // 중앙홀, 자유홀, 소망홀
        {
            serviceType: 'BONGSAN', subType: '중앙홀, 자유홀, 소망홀', unit: '원',
            rows: [
                { name: '개인', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '부부', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
                { name: '개인 (보급형)', price: 1000000, feeType: 'USAGE', grade: '100만원 ~ 500만원' },
            ]
        },
        // 관리비
        {
            serviceType: 'BONGSAN', subType: '관리비 안내', unit: '원',
            rows: [
                { name: '관리비', price: 320000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0620');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
