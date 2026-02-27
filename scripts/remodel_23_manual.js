require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0023';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

let standardizedPrices = park.priceInfo.standardizedPrices;

standardizedPrices.forEach(group => {
    if (group.subType === '매장묘') {
        group.rows.forEach(row => {
            if (row.name === '토지사용료') {
                row.note = (row.note ? row.note + ' / ' : '') + '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.';
            }
        });
    } else if (group.subType === '평장묘') {
        group.rows.forEach(row => {
            if (row.name === '토지사용료') {
                row.note = (row.note ? row.note + ' / ' : '') + '평장묘 : 화장한 유골을 땅에 묻고 그 위에 작고 얕은 비석(명패)만 올리는 자연장 형태의 방식입니다.';
            }
        });
    } else if (group.subType === '수목장') {
        group.rows.forEach(row => {
            if (row.name === '토지사용료') {
                row.note = (row.note ? row.note + ' / ' : '') + '수목장 : 화장한 유골을 나무 밑이나 주변에 묻어 자연과 함께 상생하도록 하는 친환경 장례방식입니다.';
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
