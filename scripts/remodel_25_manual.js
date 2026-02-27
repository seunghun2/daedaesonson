require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0025';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

let newStandardizedPrices = [];
const groupMap = {};
function getGroup(serviceType, subType) {
    const key = `${serviceType}-${subType}`;
    if (!groupMap[key]) {
        groupMap[key] = { serviceType, subType, unit: '원', rows: [] };
    }
    return groupMap[key];
}

park.priceInfo.standardizedPrices.forEach(group => {
    group.rows.forEach(row => {
        if (row.name === '묘지 사용료' || row.name === '묘지 관리비') {
            const g = getGroup('BURIAL', '매장묘');
            row.groupType = '매장묘';
            if (row.name === '묘지 사용료') {
                row.note = '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다. (m²당 단가)';
                row.isRepresentative = true;
            }
            g.rows.push(row);
        } else if (row.name.includes('납골')) {
            const g = getGroup('BURIAL', '봉안묘');
            row.name = row.name.replace('석물_', ''); // 32기납골, 6기납골 등
            row.groupType = '봉안묘 (석물)';
            row.note = '봉안묘 : 화장한 유골함을 야외 돌무덤(석실) 안에 여러 기 모시는 방식입니다. / 석물 비용 (토지사용료 별도)';
            row.isRepresentative = row.name.includes('6기'); // make 6기 representative if exists
            g.rows.push(row);
        } else if (row.name.includes('평장')) {
            const g = getGroup('BURIAL', '평장묘');
            row.name = row.name.replace('석물_', ''); // 1기평장, 2기평장
            row.groupType = '평장묘 (석물)';
            row.note = '평장묘 : 화장한 유골을 땅에 묻고 그 위에 작고 얕은 비석(명패)만 올리는 자연장 형태의 방식입니다. / 석물 비용 (토지사용료 별도)';
            row.isRepresentative = row.name.includes('2기');
            g.rows.push(row);
        } else if (row.name.includes('석물')) {
            const g = getGroup('OTHER', '부가 항목');
            row.groupType = '석물세트';
            g.rows.push(row);
        } else {
            const g = getGroup('OTHER', '부가 항목');
            row.groupType = group.subType; // 기타, 장례용품
            g.rows.push(row);
        }
    });
});

Object.values(groupMap).forEach(g => newStandardizedPrices.push(g));

async function updatePark() {
    console.log(`Updating ${parkId} in Supabase...`);
    const { error } = await supabase.from('Facility').update({ pricing: { standardizedPrices: newStandardizedPrices } }).eq('id', parkId);
    if (error) { console.error(`Error updating ${parkId}:`, error); }
    else {
        console.log(`${parkId} updated successfully!`);
        const index = facilitiesData.findIndex(f => f.id === parkId);
        facilitiesData[index].priceInfo.standardizedPrices = newStandardizedPrices;
        fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
        console.log('Local data/facilities.json updated.');
    }
}
updatePark();
