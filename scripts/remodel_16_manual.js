require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function remodel16() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    let data = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
    const id = 'park-0016';

    const facilityIdx = data.findIndex(f => f.id === id);
    if (facilityIdx === -1) return;

    const standardizedPrices = [
        {
            serviceType: 'BURIAL',
            subType: '매장묘',
            unit: '원',
            rows: [
                { name: '묘지사용료', price: 830000, feeType: 'USAGE', grade: '1평형', note: '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.', isRepresentative: true, groupType: '매장묘' },
                { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '1평형', note: '', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '매장묘' }
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '납골묘',
            unit: '원',
            rows: [
                { name: '납골묘 4기', price: 9500000, feeType: 'USAGE', grade: '4기', note: '납골묘(봉안묘) : 화장한 유골함을 야외 돌무덤(석실) 안에 여러 기 모시는 방식입니다.', isRepresentative: true, groupType: '납골묘' },
                { name: '납골묘 10기', price: 16200000, feeType: 'USAGE', grade: '10기', note: '납골묘(봉안묘) : 화장한 유골함을 야외 돌무덤(석실) 안에 여러 기 모시는 방식입니다.', isRepresentative: false, groupType: '납골묘' }
            ]
        },
        {
            serviceType: 'BURIAL',
            subType: '평장묘',
            unit: '원',
            rows: [
                { name: '부부평장', price: 6000000, feeType: 'USAGE', grade: '부부', note: '평장묘 : 화장한 유골을 땅에 묻고 그 위에 작고 얕은 비석(명패)만 올리는 자연장 형태의 방식입니다.', isRepresentative: true, groupType: '평장묘' },
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '석물 세트 (가묘포함)',
            unit: '원',
            rows: [
                { name: '1.5평 1기 세트', price: 5600000, feeType: 'USAGE', grade: '1.5평', note: '', isRepresentative: true, groupType: '1.5평' },
                { name: '1.5평 2기 세트 (가묘포함)', price: 8500000, feeType: 'USAGE', grade: '1.5평', note: '', isRepresentative: false, groupType: '1.5평' },
                { name: '2평 1기 세트', price: 7200000, feeType: 'USAGE', grade: '2평', note: '', isRepresentative: true, groupType: '2평' },
                { name: '2평 2기 세트 (가묘포함)', price: 11600000, feeType: 'USAGE', grade: '2평', note: '', isRepresentative: false, groupType: '2평' },
                { name: '3평 1기 세트', price: 8900000, feeType: 'USAGE', grade: '3평', note: '', isRepresentative: true, groupType: '3평' },
                { name: '3평 2기 세트 (가묘포함)', price: 13900000, feeType: 'USAGE', grade: '3평', note: '', isRepresentative: false, groupType: '3평' },
            ]
        },
        {
            serviceType: 'OTHER',
            subType: '개별 석물',
            unit: '원',
            rows: [
                { name: '상석 (소)', price: 600000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '상석' },
                { name: '상석 (중)', price: 700000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '상석' },
                { name: '상석 (대)', price: 800000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '상석' },
                { name: '비석 (소)', price: 600000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '비석' },
                { name: '비석 (중)', price: 700000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '비석' },
                { name: '비석 (대)', price: 800000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '비석' },
                { name: '오비석 (2.5자)', price: 900000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '비석' },
                { name: '오비석 (3자)', price: 1000000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '비석' },
                { name: '향로 (소)', price: 70000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '향로/꽃병' },
                { name: '향로 (대)', price: 110000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '향로/꽃병' },
                { name: '꽃병 (소)', price: 60000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '향로/꽃병' },
                { name: '꽃병 (대)', price: 120000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '향로/꽃병' },
                { name: '민짜 둘레석', price: 1600000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '흑민짜 둘레석', price: 1800000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '흑 3단 둘레석 (중)', price: 2800000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '둘레석' },
                { name: '흑 3단 둘레석 (대)', price: 2900000, feeType: 'USAGE', grade: '', note: '', isRepresentative: false, groupType: '둘레석' },
            ]
        }
    ];

    data[facilityIdx].priceInfo = data[facilityIdx].priceInfo || {};
    data[facilityIdx].priceInfo.standardizedPrices = standardizedPrices;
    delete data[facilityIdx].priceInfo.priceTable;

    fs.writeFileSync(facilitiesPath, JSON.stringify(data, null, 2));

    await supabase.from('Facility').update({ pricing: data[facilityIdx].priceInfo }).eq('id', id);
    console.log(`✅ 16 done`);
}
remodel16();
