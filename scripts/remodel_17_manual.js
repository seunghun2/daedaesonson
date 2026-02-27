require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        unit: '원',
        rows: [
            { name: '묘지 사용료', price: 1782000, feeType: 'USAGE', grade: '1평당(3.3m²)', note: '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.', isRepresentative: true, groupType: '매장묘' },
            { name: '공동관리비', price: 25200, feeType: 'MAINTENANCE', grade: '1평', note: '', duration: 1, durationType: 'YEAR', isRepresentative: false, groupType: '매장묘' },
            { name: '유골매장비', price: 2000000, feeType: 'USAGE', grade: '차등', note: '매장방식에 따라 차등 적용', isRepresentative: false, groupType: '매장묘' },
            { name: '합장작업비', price: 3000000, feeType: 'USAGE', grade: '1기당', note: '', isRepresentative: false, groupType: '매장묘' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '작업비 및 보수비',
        unit: '원',
        rows: [
            { name: '개장작업비', price: 600000, feeType: 'USAGE', grade: '1위당', note: '기존 묘지에서 파묘하여 유골을 이곳으로 이장해올 때 발생하는 수습/작업 비용', isRepresentative: false, groupType: '작업비' },
            { name: '봉안안치비', price: 500000, feeType: 'USAGE', grade: '1회당', note: '화장한 유골함을 추가로 모실(안치할) 때마다 발생하는 비용 (일반 매장 시 제외)', isRepresentative: false, groupType: '작업비' },
            { name: '축대작업비', price: 1000000, feeType: 'USAGE', grade: '1m²', note: '경사진 묘역의 흙이 무너지지 않도록 돌로 옹벽을 쌓는 공사 비용 (필요시)', isRepresentative: false, groupType: '작업비' },
            { name: '분상보수 (소)', price: 500000, feeType: 'USAGE', grade: '소', note: '시간이 지나 무너진 봉분(무덤)을 흙으로 새로 다지는 보수 작업 (바닥, 활개, 전지 별도)', isRepresentative: false, groupType: '보수비' },
            { name: '분상보수 (중)', price: 500000, feeType: 'USAGE', grade: '중', note: '시간이 지나 무너진 봉분(무덤)을 흙으로 새로 다지는 보수 작업 (바닥, 활개, 전지 별도)', isRepresentative: false, groupType: '보수비' },
            { name: '분상보수 (대)', price: 1000000, feeType: 'USAGE', grade: '대', note: '시간이 지나 무너진 봉분(무덤)을 흙으로 새로 다지는 보수 작업 (바닥, 활개, 전지 별도)', isRepresentative: false, groupType: '보수비' },
            { name: '분상보수 (재래봉분)', price: 1000000, feeType: 'USAGE', grade: '재래봉분', note: '시간이 지나 무너진 봉분(무덤)을 흙으로 새로 다지는 보수 작업', isRepresentative: false, groupType: '보수비' },
            { name: '묘테재조립 (1단특)', price: 500000, feeType: 'USAGE', grade: '1단특', note: '무덤 경계석(묘테)이 틀어지거나 무너졌을 때 다시 조립하는 비용', isRepresentative: false, groupType: '보수비' },
            { name: '묘테재조립 (2단B)', price: 600000, feeType: 'USAGE', grade: '2단B', note: '무덤 경계석(묘테)이 틀어지거나 무너졌을 때 다시 조립하는 비용', isRepresentative: false, groupType: '보수비' },
            { name: '묘테재조립 (2단A)', price: 600000, feeType: 'USAGE', grade: '2단A', note: '무덤 경계석(묘테)이 틀어지거나 무너졌을 때 다시 조립하는 비용', isRepresentative: false, groupType: '보수비' },
            { name: '묘테재조립 (3단)', price: 700000, feeType: 'USAGE', grade: '3단', note: '무덤 경계석(묘테)이 틀어지거나 무너졌을 때 다시 조립하는 비용', isRepresentative: false, groupType: '보수비' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '석물 및 부가서비스',
        unit: '원',
        rows: [
            { name: '1단 묘테', price: 2500000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '2단 묘테', price: 3500000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '3단 묘테', price: 5500000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '상석 2.5', price: 760000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '입비 2.5', price: 600000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '입비 3.0', price: 720000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '피와비 2.3', price: 720000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '피와비 2.5', price: 840000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '갓비석 3.7', price: 2400000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '화강유골평비석', price: 600000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' },
            { name: '석화병', price: 130000, feeType: 'USAGE', grade: '기본', note: '', isRepresentative: false, groupType: '묘테/석물' }
        ]
    }
];

async function updatePark() {
    console.log('Updating park-0017 in Supabase...');

    const { error } = await supabase
        .from('Facility')
        .update({
            pricing: {
                standardizedPrices: standardizedPrices
            }
        })
        .eq('id', 'park-0017');

    if (error) {
        console.error('Error updating park-0017:', error);
    } else {
        console.log('park-0017 updated successfully!');

        // update local JSON too
        const fs = require('fs');
        const path = require('path');
        const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
        let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
        const index = facilitiesData.findIndex(f => f.id === 'park-0017');
        if (index !== -1) {
            facilitiesData[index].priceInfo = facilitiesData[index].priceInfo || {};
            facilitiesData[index].priceInfo.standardizedPrices = standardizedPrices;
            fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
            console.log('Local data/facilities.json updated.');
        }
    }
}

updatePark();
