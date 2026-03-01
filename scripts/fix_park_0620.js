/**
 * park-0620 청아공원 가격 데이터 정리
 * 출처: e하늘 (archive5_images/620.(주)청아공원_price_info.png)
 * 공홈: https://www.chungahpark.co.kr (가격 없음, URL만 세팅)
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
    if (!p) { console.log('NOT FOUND: park-0620'); return; }

    p.websiteUrl = 'https://www.chungahpark.co.kr';
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                { name: '매화홀, 하늘홀, 믿음홀, 청아홀', price: 5500000, feeType: 'USAGE', grade: '550만원 ~ 2,500만원', isRepresentative: true },
                { name: '난초홀, 평화홀, 승리홀', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '국화홀, 대지홀, 은혜홀', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '중앙홀, 자유홀, 소망홀', price: 3400000, feeType: 'USAGE', grade: '340만원 ~ 1,500만원' },
                { name: '국화홀, 대지홀, 은혜홀 (보급형)', price: 1000000, feeType: 'USAGE', grade: '100만원 ~ 500만원' },
                { name: '중앙홀, 자유홀, 소망홀 (보급형)', price: 1000000, feeType: 'USAGE', grade: '100만원 ~ 500만원' },
                { name: '관리비', price: 320000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                { name: '매화홀, 하늘홀, 믿음홀, 청아홀', price: 11000000, feeType: 'USAGE', grade: '1,100만원 ~ 5,000만원' },
                { name: '난초홀, 평화홀, 승리홀', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
                { name: '국화홀, 대지홀, 은혜홀', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
                { name: '중앙홀, 자유홀, 소망홀', price: 6800000, feeType: 'USAGE', grade: '680만원 ~ 3,000만원' },
                { name: '관리비', price: 320000, feeType: 'MAINTENANCE', grade: '5년 일시납' },
            ]
        },
    ];

    console.log('✅ park-0620 청아공원 세팅 완료');
    console.log('   websiteUrl:', p.websiteUrl);
    p.priceInfo.standardizedPrices.forEach(g => {
        console.log('   [' + g.subType + '] (' + g.rows.length + '개)');
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const f = data.find(d => d.id === 'park-0620');
    const { error } = await supabase
        .from('Facility')
        .update({
            pricing: JSON.stringify(f.priceInfo),
            websiteUrl: f.websiteUrl
        })
        .eq('id', 'park-0620');

    if (error) console.log('❌ Supabase 실패:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
