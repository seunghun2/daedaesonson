require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodel13() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    let data = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
    const id = 'park-0013';

    const facilityIdx = data.findIndex(f => f.id === id);
    if (facilityIdx === -1) return;

    // 13.(재)서울공원묘원_price_info.png transcript
    const standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            unit: '원',
            rows: [
                {
                    name: '단분',
                    price: 21250000,
                    feeType: 'USAGE',
                    grade: '6평형',
                    note: '평당(6평형) 250만원 / 매장작업비150만원포함 / 5년관리비포함 / 석물비별도 / 각자료별도 / 총계 21,250,000원',
                    isRepresentative: true,
                    groupType: '매장묘'
                },
                {
                    name: '합장',
                    price: 27000000,
                    feeType: 'USAGE',
                    grade: '8평형',
                    note: '평당(8평형) 250만원 / 매장작업비150만원포함 / 5년관리비포함 / 석물비별도 / 각자료별도 / 총계 27,000,000원',
                    isRepresentative: false,
                    groupType: '매장묘'
                },
                {
                    name: '쌍분',
                    price: 31750000,
                    feeType: 'USAGE',
                    grade: '10평형',
                    note: '평당(10평형) 250만원 / 매장작업비 150만원포함 / 5년관리비포함 / 석물비별도 / 각자료별도 / 총계 31,750,000원',
                    isRepresentative: false,
                    groupType: '매장묘'
                },
                {
                    name: '관리비 (매장/평장 공동)',
                    price: 25000,
                    feeType: 'MAINTENANCE',
                    grade: '평당',
                    note: '평당관리비 : 25,000원/년 (물가상승률 등에 따라 인상될 수 있음)',
                    duration: 1, durationType: 'YEAR',
                    isRepresentative: false,
                    groupType: '매장묘'
                }
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            unit: '원',
            rows: [
                { name: '평장 2기', price: 15000000, feeType: 'USAGE', grade: '4평형', note: '묘지사용료:평당(4평형)250만원 / 평장작업비: 50만원 / 석물비별도 / 5년관리비포함 / 각자비별도 / 총계 15,000,000원', isRepresentative: true, groupType: '평장묘' },
                { name: '평장 4기', price: 15500000, feeType: 'USAGE', grade: '4평형', note: '묘지사용료:평당(4평형)250만원 / 평장작업비: 50만원 / 석물비별도 / 5년관리비포함 / 각자비별도 / 총계 15,500,000원', isRepresentative: false, groupType: '평장묘' },
                { name: '평장 8기', price: 24250000, feeType: 'USAGE', grade: '6평형', note: '묘지사용료:평당(6평형)250만원 / 평장작업비: 50만원 / 석물비별도 / 5년관리비포함 / 각자비별도 / 총계 24,250,000원', isRepresentative: false, groupType: '평장묘' },
                { name: '평장 12기', price: 27250000, feeType: 'USAGE', grade: '6평형', note: '묘지사용료: 평당(6평형)250만원 / 평장작업비: 50만원 / 석물비별도 / 5년관리비포함 / 각자비별도 / 총계 27,250,000원', isRepresentative: false, groupType: '평장묘' },
                { name: '평장 16기', price: 34500000, feeType: 'USAGE', grade: '8평형', note: '묘지사용료: 평당(8평형)250만원 / 평장작업비: 50만원 / 석물비별도 / 5년관리비포함 / 각자비별도 / 총계 34,500,000원', isRepresentative: false, groupType: '평장묘' },
                { name: '관리비 (매장/평장 공동)', price: 25000, feeType: 'MAINTENANCE', grade: '평당', note: '평당관리비 : 25,000원/년', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '평장묘' }
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안담',
            unit: '원',
            rows: [
                { name: '봉안담 개인단 1단', price: 3000000, feeType: 'USAGE', grade: '개인단', note: '사용료 2,800,000원 / 5년관리비포함 / 총계 3,000,000원', isRepresentative: true, groupType: '개인단' },
                { name: '봉안담 개인단 2단', price: 4400000, feeType: 'USAGE', grade: '개인단', note: '사용료 4,200,000원 / 5년 관리비포함 / 총계 4,400,000원', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 3단', price: 5900000, feeType: 'USAGE', grade: '개인단', note: '사용료 5,700,000원/5년 관리비포함', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 4단', price: 7300000, feeType: 'USAGE', grade: '개인단', note: '', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 5단', price: 8000000, feeType: 'USAGE', grade: '개인단', note: '', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 6단', price: 6600000, feeType: 'USAGE', grade: '개인단', note: '', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 7단', price: 5100000, feeType: 'USAGE', grade: '개인단', note: '', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 8단', price: 3700000, feeType: 'USAGE', grade: '개인단', note: '', isRepresentative: false, groupType: '개인단' },
                { name: '개인단 관리비', price: 40000, feeType: 'MAINTENANCE', note: '40,000원/년', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '개인단' },

                { name: '봉안담 부부단 1단', price: 5700000, feeType: 'USAGE', grade: '부부단', note: '사용료 5,300,000원 / 5년관리비포함 / 총계 5,700,000원', isRepresentative: true, groupType: '부부단' },
                { name: '봉안담 부부단 2단', price: 8800000, feeType: 'USAGE', grade: '부부단', note: '사용료 8,400,000원 / 5년관리비포함 / 총계 8,800,000원', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 3단', price: 11800000, feeType: 'USAGE', grade: '부부단', note: '사용료 11,400,000원/5년', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 4단', price: 13900000, feeType: 'USAGE', grade: '부부단', note: '', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 5단', price: 14600000, feeType: 'USAGE', grade: '부부단', note: '', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 6단', price: 12800000, feeType: 'USAGE', grade: '부부단', note: '', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 7단', price: 10200000, feeType: 'USAGE', grade: '부부단', note: '', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 8단', price: 7400000, feeType: 'USAGE', grade: '부부단', note: '', isRepresentative: false, groupType: '부부단' },
                { name: '부부단 관리비', price: 80000, feeType: 'MAINTENANCE', note: '80,000원/년', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '부부단' }
            ]
        }
    ];

    data[facilityIdx].priceInfo = data[facilityIdx].priceInfo || {};
    data[facilityIdx].priceInfo.standardizedPrices = standardizedPrices;
    delete data[facilityIdx].priceInfo.priceTable;

    fs.writeFileSync(facilitiesPath, JSON.stringify(data, null, 2));

    await supabase.from('Facility').update({ pricing: data[facilityIdx].priceInfo }).eq('id', id);
    console.log(`✅ 13 done`);
}
remodel13();
