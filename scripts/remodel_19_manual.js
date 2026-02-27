require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0019';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

let standardizedPrices = park.priceInfo.standardizedPrices;

// Simplify the presentation of Park 19 (Nam-yang park)
standardizedPrices.forEach(group => {
    if (group.serviceType === 'OTHER') {
        group.subType = '부가 시설물 (석물/비석)';
        group.rows.forEach(row => {
            if (row.name.includes('애석')) {
                row.groupType = '비석 - 애석 (회색/컬러화강암)';
                row.note = '밝은 회색 등 자연스러운 색감을 띠는 돌망치 비석 재질입니다.';
            } else if (row.name.includes('오석')) {
                row.groupType = '비석 - 오석 (검은색 화강암)';
                row.note = '글씨가 뚜렷하게 보이며 고급스러운 검은색이 특징인 비석 재질입니다.';
            } else if (row.name.includes('향로') || row.name.includes('화병')) {
                row.groupType = '제례용품 (향로/화병)';
                row.note = '제사를 지낼 때 향을 피우거나 헌화용 꽃을 꽂아두기 위해 제단에 설치하는 석물입니다.';
            } else if (row.name.includes('서구식')) {
                row.groupType = '묘테 (서구식 평장형 디자인)';
                row.note = '봉분을 높이 쌓지 않고, 기독교 및 서양식 묘지처럼 낮고 평평하게 대리석을 까는 세련된 디자인 비용입니다.';
            } else if (row.name.includes('원형둘레석')) {
                row.groupType = '묘테 (원형 둘레석)';
                row.note = '동그랗게 쌓은 흙(봉분)이 무너지지 않고 깔끔하게 유지되도록 테두리를 둘러싸는 돌(묘테) 비용입니다.';
            }
        });
    }
});

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
