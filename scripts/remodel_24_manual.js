require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0024';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

let standardizedPrices = park.priceInfo.standardizedPrices;

standardizedPrices.forEach(group => {
    if (group.serviceType === 'BURIAL') {
        group.subType = '매장묘';
        group.rows.forEach(row => {
            row.groupType = '매장묘';
            if (row.name.includes('토지사용료')) {
                row.note = '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.';
                row.isRepresentative = true;
            }
        });
    } else if (group.serviceType === 'OTHER') {
        const subTypeOriginal = group.subType;
        group.subType = '부가 항목';
        group.rows.forEach(row => {
            row.groupType = subTypeOriginal; // 서비스 항목 or 장사용품
        });
    }
});

// Remove duplicate 관리비 in 'OTHER' if it exists
let otherGroup = standardizedPrices.find(g => g.serviceType === 'OTHER' && g.subType === '부가 항목');
if (otherGroup) {
    otherGroup.rows = otherGroup.rows.filter(r => r.name !== '관리비');
}

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
