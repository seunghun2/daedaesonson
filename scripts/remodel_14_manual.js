require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodel14() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    let data = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
    const id = 'park-0014';

    const facilityIdx = data.findIndex(f => f.id === id);
    if (facilityIdx === -1) return;

    // 14.(재)자하연 일산(묘지)_price_info.png transcript review
    // 매장묘지 쪽에 매장묘, 봉안묘 분리. 수목장/자연장 그룹 분리. 봉안당 개인단, 부부단 분리
    const standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            unit: '원',
            rows: [
                { name: '설치 평수별 사용료', price: 1950000, feeType: 'USAGE', grade: '평당', note: '계약 평수에 따라 1평당 1,950,000원', isRepresentative: true, groupType: '매장묘' },
                { name: '1년 관리비', price: 27000, feeType: 'MAINTENANCE', grade: '평당', note: '1평당 27,000원 / 년', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '매장묘' }
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '봉안묘',
            unit: '원',
            rows: [
                { name: '설치 평수별 사용료', price: 1950000, feeType: 'USAGE', grade: '평당', note: '계약 평수에 따라 1평당 1,950,000원', isRepresentative: true, groupType: '봉안묘' },
                { name: '1년 관리비', price: 27000, feeType: 'MAINTENANCE', grade: '평당', note: '1평당 27,000원 / 년', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '봉안묘' }
            ]
        },
        {
            serviceType: 'NATURAL',
            subType: '평장형 자연장',
            unit: '원',
            rows: [
                { name: '평장 2기 자연장', price: 14500000, feeType: 'USAGE', grade: '2기', note: '평장형 자연장 : 화장한 유골을 잔디나 나무아래 묻고, 작은 명패 등으로 표시하는 친환경 장례방식입니다. / 사용료(3,900,000원), 5년관리비(270,000원) 포함 기타비용 발생 / 총액 14,500,000원', isRepresentative: true, groupType: '평장형' },
                { name: '평장 4기 자연장 (동향)', price: 18000000, feeType: 'USAGE', grade: '4기', note: '방향(동향)에 따른 자리 차이 (최저가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함 기타비용 발생 / 총액 18,000,000원', isRepresentative: false, groupType: '평장형' },
                { name: '평장 4기 자연장 (서향)', price: 19000000, feeType: 'USAGE', grade: '4기', note: '방향(서향)에 따른 자리 차이 (최고가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함 기타비용 발생 / 총액 19,000,000원', isRepresentative: false, groupType: '평장형' },
                { name: '평장 6기 자연장 (북향)', price: 24500000, feeType: 'USAGE', grade: '6기', note: '방향(북향)에 따른 자리 차이 (최저가) / 사용료(7,800,000원), 5년관리비(540,000원) 포함 기타비용 발생 / 총액 24,500,000원', isRepresentative: false, groupType: '평장형' },
                { name: '평장 6기 자연장 (남향)', price: 26500000, feeType: 'USAGE', grade: '6기', note: '방향(남향)에 따른 자리 차이 (최고가) / 사용료(7,800,000원), 5년관리비(540,000원) 포함 기타비용 발생 / 총액 26,500,000원', isRepresentative: false, groupType: '평장형' },
            ]
        },
        {
            serviceType: 'NATURAL',
            subType: '탑형 자연장 / 일반 자연장',
            unit: '원',
            rows: [
                { name: '봉안 2기 탑형 (일반자리)', price: 17500000, feeType: 'USAGE', grade: '2기', note: '탑형 자연장 : 유골을 나무 주변이 아닌, 돌로 만들어진 탑 형태의 구조물 하단이나 내부에 모시는 자연장의 한 종류입니다. / 자리 위치 등에 따른 가격차이 (최저가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함', isRepresentative: true, groupType: '탑형' },
                { name: '봉안 2기 탑형 (로얄자리)', price: 19500000, feeType: 'USAGE', grade: '2기', note: '자리 위치 등에 따른 가격차이 (최고가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함', isRepresentative: false, groupType: '탑형' },
                { name: '봉안 4기 탑형 (일반자리)', price: 19500000, feeType: 'USAGE', grade: '4기', note: '자리 위치 등에 따른 가격차이 (최저가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함', isRepresentative: false, groupType: '탑형' },
                { name: '봉안 4기 탑형 (로얄자리)', price: 21500000, feeType: 'USAGE', grade: '4기', note: '자리 위치 등에 따른 가격차이 (최고가) / 사용료(5,850,000원), 5년관리비(405,000원) 포함', isRepresentative: false, groupType: '탑형' },
                { name: '봉안 6위 (자연장)', price: 24000000, feeType: 'USAGE', grade: '6기', note: '일반 자연장 / 사용료(7,800,000원), 5년관리비(540,000원) 포함', isRepresentative: false, groupType: '일반' },
                { name: '봉안 8위 (자연장)', price: 30000000, feeType: 'USAGE', grade: '8기', note: '사용료(9,750,000원), 5년관리비(675,000원) 포함', isRepresentative: false, groupType: '일반' },
                { name: '봉안 8위 (일반)', price: 32500000, feeType: 'USAGE', grade: '8기', note: '기타 자연장 / 사용료(9,750,000원), 5년관리비(675,000원) 포함', isRepresentative: false, groupType: '일반' },
                { name: '봉안 12위 (일반)', price: 35500000, feeType: 'USAGE', grade: '12기', note: '사용료(11,700,000원), 5년관리비(810,000원) 포함', isRepresentative: false, groupType: '일반' },
                { name: '봉안 16위 (일반)', price: 39000000, feeType: 'USAGE', grade: '16기', note: '사용료(13,650,000원), 5년관리비(945,000원) 포함', isRepresentative: false, groupType: '일반' },
            ]
        },
        {
            serviceType: 'BONGSAN',
            subType: '봉안담',
            unit: '원',
            rows: [
                { name: '봉안담 개인단 6단', price: 2000000, feeType: 'USAGE', grade: '개인단', note: '사용료(180만원, 5년관리비 135,000원)', isRepresentative: true, groupType: '개인단' },
                { name: '봉안담 개인단 1단', price: 2500000, feeType: 'USAGE', grade: '개인단', note: '사용료(200만원, 5년관리비 135,000원)', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 2단, 5단', price: 4000000, feeType: 'USAGE', grade: '개인단', note: '사용료(200만원, 5년관리비 135,000원)', isRepresentative: false, groupType: '개인단' },
                { name: '봉안담 개인단 3단, 4단', price: 4500000, feeType: 'USAGE', grade: '개인단', note: '사용료(200만원, 5년관리비 135,000원)', isRepresentative: false, groupType: '개인단' },

                { name: '봉안담 부부단 6단', price: 3000000, feeType: 'USAGE', grade: '부부단', note: '사용료(200만원, 5년관리비27만원)', isRepresentative: true, groupType: '부부단' },
                { name: '봉안담 부부단 1단', price: 4000000, feeType: 'USAGE', grade: '부부단', note: '사용료(200만원, 5년관리비27만원)', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 2단, 5단', price: 5500000, feeType: 'USAGE', grade: '부부단', note: '사용료(200만원, 5년관리비27만원)', isRepresentative: false, groupType: '부부단' },
                { name: '봉안담 부부단 3단, 4단', price: 7000000, feeType: 'USAGE', grade: '부부단', note: '사용료(200만원, 5년관리비27만원)', isRepresentative: false, groupType: '부부단' },
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '미사용 묘지 반환규정',
            unit: '',
            rows: [
                { name: '반환 규정 안내', price: 0, feeType: 'USAGE', grade: '안내', note: '계약일로부터 1년미만 토시사용료 80%환급, 1년이상 5년미만 50%환급, 5년이상 10년미만 20%환급, 10년이상은 환급없음', isRepresentative: false, groupType: '안내' }
            ]
        }
    ];

    data[facilityIdx].priceInfo = data[facilityIdx].priceInfo || {};
    data[facilityIdx].priceInfo.standardizedPrices = standardizedPrices;
    delete data[facilityIdx].priceInfo.priceTable;

    fs.writeFileSync(facilitiesPath, JSON.stringify(data, null, 2));

    await supabase.from('Facility').update({ pricing: data[facilityIdx].priceInfo }).eq('id', id);
    console.log(`✅ 14 done`);
}
remodel14();
