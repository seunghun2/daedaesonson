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
            // 단장묘 A형
            { name: '단장 A형', price: 5400000, feeType: 'USAGE', grade: '18m²', note: '단장(1분 모심), 가장 기본적인 A형(18m²) 면적입니다. [토지 사용료 및 관리비]이며, 안장 시 **매장 작업비와 묘테 등 석물 비용(2,486,000원)**이 별도로 부과됩니다.', isRepresentative: true, groupType: '단장A', residency: 'LOCAL' },
            { name: '단장 A형 (관외 거주자 1년 미만)', price: 9900000, feeType: 'USAGE', grade: '18m²', note: '(관외 거주자용) 단장 A형(18m²) 토지 사용료 및 관리비입니다. *안장 작업비 및 석물 비용(248.6만원) 별도*', isRepresentative: false, groupType: '단장A', residency: 'NON_LOCAL' },
            { name: '연장 관리비 (3개월 미만·기사용)', price: 3600000, feeType: 'USAGE', grade: '18m²', note: '(관외 거주자/기존 사용자용) 사용 기간을 연장할 때 부과되는 관리비입니다.', isRepresentative: false, groupType: '단장A', residency: 'NON_LOCAL' },

            // 단장묘 B형
            { name: '단장 B형', price: 7500000, feeType: 'USAGE', grade: '25m²', note: '단장(1분 모심), A형보다 더 넓은 B형(25m²) 면적입니다. [토지 사용료 및 관리비]이며, 안장 시 **매장 작업비와 석물 비용(2,486,000원)**이 별도 부과됩니다.', isRepresentative: false, groupType: '단장B', residency: 'LOCAL' },
            { name: '단장 B형 (관외 거주자 1년 미만)', price: 13750000, feeType: 'USAGE', grade: '25m²', note: '(관외 거주자용) 단장 B형(25m²) 토지 사용료 및 관리비입니다. *안장 작업비 및 석물 비용(248.6만원) 별도*', isRepresentative: false, groupType: '단장B', residency: 'NON_LOCAL' },
            { name: '연장 관리비 (3개월 미만·기사용)', price: 5000000, feeType: 'USAGE', grade: '25m²', note: '(관외 거주자/기존 사용자용) 사용 기간을 연장할 때 부과되는 관리비입니다.', isRepresentative: false, groupType: '단장B', residency: 'NON_LOCAL' },

            // 합장묘 A형
            { name: '합장 A형', price: 9000000, feeType: 'USAGE', grade: '30m²', note: '합장(부부 등 2분 함께 모심), 기본적인 A형(30m²) 면적입니다. [토지 사용료 및 관리비]이며, 안장 시 **부부 합장 작업비 및 묘테 등 석물 비용(2,810,000원)**이 별도 부과됩니다.', isRepresentative: false, groupType: '합장A', residency: 'LOCAL' },
            { name: '합장 A형 (관외 거주자 1년 미만)', price: 16500000, feeType: 'USAGE', grade: '30m²', note: '(관외 거주자용) 합장 A형(30m²) 토지 사용료 및 관리비입니다. *합장 작업비 및 석물 비용(281만원) 별도*', isRepresentative: false, groupType: '합장A', residency: 'NON_LOCAL' },
            { name: '연장 관리비 (3개월 미만·기사용)', price: 6000000, feeType: 'USAGE', grade: '30m²', note: '(관외 거주자/기존 사용자용) 사용 기간을 연장할 때 부과되는 관리비입니다.', isRepresentative: false, groupType: '합장A', residency: 'NON_LOCAL' },

            // 합장묘 B형
            { name: '합장 B형', price: 10800000, feeType: 'USAGE', grade: '36m²', note: '합장(2분 함께 모심), A형보다 더 넓은 B형(36m²) 면적입니다. [토지 사용료 및 관리비]이며, 안장 시 **부부 합장 작업비와 석물 비용(2,810,000원)**이 별도 부과됩니다.', isRepresentative: false, groupType: '합장B', residency: 'LOCAL' },
            { name: '합장 B형 (관외 거주자 1년 미만)', price: 19800000, feeType: 'USAGE', grade: '36m²', note: '(관외 거주자용) 합장 B형(36m²) 토지 사용료 및 관리비입니다. *합장 작업비 및 석물 비용(281만원) 별도*', isRepresentative: false, groupType: '합장B', residency: 'NON_LOCAL' },
            { name: '연장 관리비 (3개월 미만·기사용)', price: 7200000, feeType: 'USAGE', grade: '36m²', note: '(관외 거주자/기존 사용자용) 사용 기간을 연장할 때 부과되는 관리비입니다.', isRepresentative: false, groupType: '합장B', residency: 'NON_LOCAL' },

            // 합장묘 C형
            { name: '합장 C형', price: 12600000, feeType: 'USAGE', grade: '42m²', note: '합장(2분 함께 모심), 가장 넓은 VIP 구역인 C형(42m²) 면적입니다. [토지 사용료 및 관리비]이며, 안장 시 **부부 합장 작업비와 석물 비용(2,810,000원)**이 별도 부과됩니다.', isRepresentative: false, groupType: '합장C', residency: 'LOCAL' },
            { name: '합장 C형 (관외 거주자 1년 미만)', price: 23100000, feeType: 'USAGE', grade: '42m²', note: '(관외 거주자용) 합장 C형(42m²) 토지 사용료 및 관리비입니다. *합장 작업비 및 석물 비용(281만원) 별도*', isRepresentative: false, groupType: '합장C', residency: 'NON_LOCAL' },
            { name: '연장 관리비 (3개월 미만·기사용)', price: 8400000, feeType: 'USAGE', grade: '42m²', note: '(관외 거주자/기존 사용자용) 사용 기간을 연장할 때 부과되는 관리비입니다.', isRepresentative: false, groupType: '합장C', residency: 'NON_LOCAL' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '석물 및 안장비 (필수 부가비용)',
        unit: '원',
        rows: [
            { name: '단장 안장비 (석물 포함)', price: 2486000, feeType: 'USAGE', grade: '단장', note: '실제로 한 분을 모실 때 1회 발생하는 필수 비용입니다. (땅 파는 매장 작업비 + 테두리 돌, 비석 등 묘테 석물 재료/설치비 모두 포함)', isRepresentative: false, groupType: '작업비' },
            { name: '합장 안장비 (석물 포함)', price: 2810000, feeType: 'USAGE', grade: '합장', note: '실제로 두 분을 합장으로 모실 때 1회 발생하는 필수 비용입니다. (부부 합장용 깊은 구덩이 굴착 작업비 + 부부용 넓은 테두리 돌, 비석 등 묘테 석물 재료/설치비 모두 포함)', isRepresentative: false, groupType: '작업비' }
        ]
    }
];

async function updatePark() {
    console.log('Updating park-0018 in Supabase...');
    const { error } = await supabase.from('Facility').update({ pricing: { standardizedPrices } }).eq('id', 'park-0018');
    if (error) { console.error('Error updating park-0018:', error); }
    else {
        console.log('park-0018 updated successfully!');
        const fs = require('fs');
        const path = require('path');
        const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
        let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));
        const index = facilitiesData.findIndex(f => f.id === 'park-0018');
        if (index !== -1) {
            facilitiesData[index].priceInfo = facilitiesData[index].priceInfo || {};
            facilitiesData[index].priceInfo.standardizedPrices = standardizedPrices;
            fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
            console.log('Local data/facilities.json updated.');
        }
    }
}
updatePark();
