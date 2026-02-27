require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodel15() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    let data = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
    const id = 'park-0015';

    const facilityIdx = data.findIndex(f => f.id === id);
    if (facilityIdx === -1) return;

    const standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            unit: '원',
            rows: [
                { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '평당', note: '', isRepresentative: true, groupType: '매장묘' },
                { name: '매장용역비 (필수)', price: 1440000, feeType: 'USAGE', grade: '1기당', note: '', isRepresentative: false, groupType: '매장묘' },
                { name: '15년관리비', price: 12000, feeType: 'MAINTENANCE', grade: '평당/1년', note: '', duration: 15, durationType: 'YEAR', isRepresentative: false, groupType: '매장묘' }
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '서비스 항목',
            unit: '원',
            rows: [
                { name: '개장정리비', price: 300000, feeType: 'USAGE', grade: '1기당', note: '', isRepresentative: false, groupType: '작업/보수' },
                { name: '묘지보수비(사각)', price: 300000, feeType: 'USAGE', grade: '사각', note: '', isRepresentative: false, groupType: '작업/보수' },
                { name: '묘지보수비(원형)', price: 350000, feeType: 'USAGE', grade: '원형', note: '', isRepresentative: false, groupType: '작업/보수' },
                { name: '비석석각인비', price: 300000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '작업/보수' }
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '석물 항목',
            unit: '원',
            rows: [
                { name: '상석(고흥석)', price: 230000, feeType: 'USAGE', grade: '2.5', note: '', isRepresentative: false, groupType: '상석' },
                { name: '상석(오석)', price: 570000, feeType: 'USAGE', grade: '2.5', note: '', isRepresentative: false, groupType: '상석' },
                { name: '상석(오석)', price: 960000, feeType: 'USAGE', grade: '2.7', note: '', isRepresentative: false, groupType: '상석' },
                { name: '천주교상석(오석)', price: 210000, feeType: 'USAGE', grade: '2.0', note: '', isRepresentative: false, groupType: '상석' },
                { name: '표석와비(오석)', price: 590000, feeType: 'USAGE', grade: '2.5', note: '', isRepresentative: false, groupType: '표석/비석' },
                { name: '표석(고흥석)', price: 230000, feeType: 'USAGE', grade: '2.5', note: '', isRepresentative: false, groupType: '표석/비석' },
                { name: '표석(오석)', price: 260000, feeType: 'USAGE', grade: '2.5', note: '', isRepresentative: false, groupType: '표석/비석' },
                { name: '사각둘레석 (2단)', price: 840000, feeType: 'USAGE', grade: '2단', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '사각둘레석 (3단)', price: 960000, feeType: 'USAGE', grade: '3단', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '원형둘레석 (공통)', price: 720000, feeType: 'USAGE', grade: '공통', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '석관', price: 400000, feeType: 'USAGE', grade: '1', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '장대석', price: 6600, feeType: 'USAGE', grade: '1자', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '망두석', price: 330000, feeType: 'USAGE', grade: '1', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '신부와비', price: 480000, feeType: 'USAGE', grade: '1', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '신부좌대', price: 300000, feeType: 'USAGE', grade: '1', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '향로석', price: 100000, feeType: 'USAGE', grade: '1', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '북석', price: 400000, feeType: 'USAGE', grade: '1세트', note: '', isRepresentative: false, groupType: '기타석물' },
                { name: '돌화병', price: 140000, feeType: 'USAGE', grade: '1조(2개)', note: '', isRepresentative: false, groupType: '기타석물' }
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '환불 규정 안내',
            unit: '',
            rows: [
                { name: '묘지사용료 환불규정', price: 0, feeType: 'USAGE', grade: '권리증 발부일 기준', note: '예약된 묘지(기)는 전액 환불', isRepresentative: false, groupType: '환불' },
                { name: '15년관리비 환불규정', price: 0, feeType: 'USAGE', grade: '', note: '관리비 잔여기간 일할 계산 반환', isRepresentative: false, groupType: '환불' }
            ]
        }
    ];

    data[facilityIdx].priceInfo = data[facilityIdx].priceInfo || {};
    data[facilityIdx].priceInfo.standardizedPrices = standardizedPrices;
    delete data[facilityIdx].priceInfo.priceTable;

    fs.writeFileSync(facilitiesPath, JSON.stringify(data, null, 2));

    await supabase.from('Facility').update({ pricing: data[facilityIdx].priceInfo }).eq('id', id);
    console.log(`✅ 15 done`);
}
remodel15();
