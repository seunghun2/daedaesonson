require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0020';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

// raw data processing
const standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '봉안묘',
        unit: '원',
        rows: [
            { name: '부부 2위 \'마음\'', price: 9900000, feeType: 'USAGE', grade: '1.5평', note: '봉안묘 : 화장한 유골함을 야외 돌무덤(석실) 안에 모시는 방식입니다. / 1.5평 공간에 부부 두 분을 모실 수 있는 특가 패키지입니다. \n✅ [포함 내역: 묘지 사용료 + 묘테/비석 등 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: true, groupType: '부부형/소형' },
            { name: '모노 2위 \'황등석\'', price: 10900000, feeType: 'USAGE', grade: '1.5평', note: '1.5평 공간에 부부 두 분을 모시는 상품입니다. 밝은 톤의 고급 황등석(화강암) 석물이 제공됩니다. \n✅ [포함 내역: 묘지 사용료 + 황등석 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '부부형/소형' },
            { name: '모노 2위 \'오석\'', price: 11900000, feeType: 'USAGE', grade: '1.5평', note: '1.5평 공간에 부부 두 분을 모시는 상품입니다. 글씨가 선명한 검은빛의 최고급 오석 비석이 제공됩니다. \n✅ [포함 내역: 묘지 사용료 + 오석 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '부부형/소형' },
            { name: '가족 8위 \'투영\'', price: 25600000, feeType: 'USAGE', grade: '5평', note: '넓은 5평 공간에 한 가족 최대 8분까지 모실 수 있는 봉안묘입니다. \n✅ [포함 내역: 묘지 사용료 + 대형 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '가족형' },
            { name: '가족 16위형', price: 21800000, feeType: 'USAGE', grade: '4평', note: '4평 공간에 최대 16분까지 넉넉하게 모실 수 있는 대가족용 봉안묘입니다. \n✅ [포함 내역: 묘지 사용료 + 대형 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '가족형' },
            { name: '가족 24위형', price: 25600000, feeType: 'USAGE', grade: '5평', note: '5평 공간에 문중 단위 최대 24분까지 모실 수 있는 특대형 봉안묘입니다. \n✅ [포함 내역: 묘지 사용료 + 특대형 석물 설치비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '가족형' }
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        unit: '원',
        rows: [
            { name: '복합형 단장', price: 17600000, feeType: 'USAGE', grade: '5평', note: '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다. / 5평 공간에 한 분을 모십니다. \n✅ [포함 내역: 토지 사용료 + 묘테, 상석 등 석물 비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '매장묘' },
            { name: '복합형 쌍묘', price: 29600000, feeType: 'USAGE', grade: '10평', note: '넓은 10평 공간에 두 분의 봉분(무덤)을 각각 모시는 쌍분 형태입니다. \n✅ [포함 내역: 토지 사용료 + 묘테, 상석 등 부부 석물 비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '매장묘' }
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '평장묘',
        unit: '원',
        rows: [
            { name: '표준 평장묘', price: 5100000, feeType: 'USAGE', grade: null, note: '평장묘 : 화장한 유골을 땅에 묻고 그 위에 작고 얕은 비석만 올리는 자연장 방식입니다. / 기본형 상품입니다. \n✅ [포함 내역: 토지 사용료 + 명패(비석) 등 석물 비용 + 초기 5년치 관리비]', isRepresentative: true, groupType: '평장묘' },
            { name: '고급 평장묘', price: 9200000, feeType: 'USAGE', grade: null, note: '표준형보다 명패나 대리석 묘테가 더 넓고 고급스럽게 꾸며진 프리미엄 구역입니다. \n✅ [포함 내역: 토지 사용료 + 고급 석물 비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '평장묘' },
            { name: '정원형 평장묘', price: 12900000, feeType: 'USAGE', grade: null, note: '넓은 정원(잔디밭) 형태로 넉넉하게 조성된 최고급 평장묘 구역입니다. \n✅ [포함 내역: 토지 사용료 + 정원형 고급 석물 비용 + 초기 5년치 관리비]', isRepresentative: false, groupType: '평장묘' }
        ]
    },
    {
        serviceType: 'BONGSAN',
        subType: '봉안담',
        unit: '원',
        rows: [
            // 봉안담 개인단
            { name: '개인형 봉안담 (사용료)', price: 2300000, feeType: 'USAGE', grade: null, note: '봉안담 : 실내가 아닌 담벼락 형태의 벽체에 유골함을 모시는 야외 봉안당입니다. / 한 분을 모시는 공간의 최초 사용료입니다.', isRepresentative: true, groupType: '개인단' },
            { name: '개인형 봉안담 (관리비)', price: 130000, feeType: 'MAINTENANCE', grade: null, duration: 5, durationType: 'YEAR', note: '5년마다 납부하는 관리비입니다. (초기 5년 선납)', isRepresentative: false, groupType: '개인단' },

            // 봉안담 부부단
            { name: '부부형 봉안담 (사용료)', price: 4500000, feeType: 'USAGE', grade: null, note: '가로로 이어진 넓은 칸에 부부 두 분을 모시는 공간의 최초 사용료입니다.', isRepresentative: true, groupType: '부부단' },
            { name: '부부형 봉안담 (관리비)', price: 220000, feeType: 'MAINTENANCE', grade: null, duration: 5, durationType: 'YEAR', note: '5년마다 납부하는 관리비입니다. (초기 5년 선납)', isRepresentative: false, groupType: '부부단' }
        ]
    },
    {
        serviceType: 'NATURAL',
        subType: '수목장',
        unit: '원',
        rows: [
            { name: '수목장 개인묘', price: 3000000, feeType: 'USAGE', grade: null, note: '수목장 : 지정된 추모목(나무) 주변에 화장한 유골을 묻어 자연과 상생하는 장법입니다. / 한 분을 모시는 상품입니다. \n✅ [포함 내역: 토지 사용료 + 표지석 비용 + 초기 2년치 관리비]', isRepresentative: true, groupType: '개인/부부' },
            { name: '수목장 부부묘', price: 4400000, feeType: 'USAGE', grade: null, note: '한 그루의 묘목에 부부 두 분을 함께 모시는 패키지 상품입니다. \n✅ [포함 내역: 토지 사용료 + 부부용 표지석 비용 + 초기 2년치 관리비]', isRepresentative: false, groupType: '개인/부부' },
            { name: '수목장 가족묘', price: 10500000, feeType: 'USAGE', grade: null, note: '우리 가족만의 전용 나무(가족목)를 배정받아 여러 가족을 대대로 모실 수 있는 상품입니다. \n✅ [포함 내역: 토지 사용료 + 가족용 대형 표지석 비용 + 초기 2년치 관리비]', isRepresentative: false, groupType: '가족' }
        ]
    }
];

async function updatePark() {
    console.log(`Updating ${parkId} in Supabase...`);
    const { error } = await supabase.from('Facility').update({ pricing: { standardizedPrices } }).eq('id', parkId);
    if (error) { console.error(`Error updating ${parkId}:`, error); }
    else {
        console.log(`${parkId} updated successfully!`);
        const index = facilitiesData.findIndex(f => f.id === parkId);
        facilitiesData[index].priceInfo.standardizedPrices = standardizedPrices;
        fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
        console.log('Local data/facilities.json updated.');
    }
}
updatePark();
