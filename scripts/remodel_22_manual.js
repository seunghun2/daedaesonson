require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

const parkId = 'park-0022';
const park = facilitiesData.find(f => f.id === parkId);
if (!park) { console.error('Park not found'); process.exit(1); }

let standardizedPrices = park.priceInfo.standardizedPrices;

// We will collect all OTHER into a single subType "부가 항목" and map subType -> groupType
const newStandardizedPrices = [];
const otherGroupMap = {};
const burialGroupMap = {};

standardizedPrices.forEach(group => {
    if (group.serviceType === 'BURIAL') {
        const groupType = group.subType; // e.g., '단장묘', '합장묘', '매장'
        if (!burialGroupMap['매장묘']) {
            burialGroupMap['매장묘'] = {
                serviceType: 'BURIAL',
                subType: '매장묘',
                unit: '원',
                rows: []
            };
        }
        group.rows.forEach(row => {
            row.groupType = groupType;
            if (row.name.includes('단장') || row.name.includes('합장')) {
                row.note = (row.note ? row.note + ' / ' : '') + '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.';
                row.isRepresentative = true; // Make one of them representative
            }
            // Skip the weird "매장사용료" formula if price is null/0 unless we want to keep it.
            // Let's just push everything to burial
            // Actually, wait, let's skip the 0 price with weird formula:
            if (row.price !== null && !(row.price === 0 && row.name === '매장')) {
                burialGroupMap['매장묘'].rows.push(row);
            }
        });
    } else if (group.serviceType === 'OTHER') {
        if (!otherGroupMap['부가 항목']) {
            otherGroupMap['부가 항목'] = {
                serviceType: 'OTHER',
                subType: '부가 항목',
                unit: '원',
                rows: []
            };
        }
        let groupType = group.subType;
        if (groupType === '공원정식') groupType = '부대시설/식사';

        group.rows.forEach(row => {
            row.groupType = groupType;
            otherGroupMap['부가 항목'].rows.push(row);
        });
    }
});

// push maps back
if (burialGroupMap['매장묘']) newStandardizedPrices.push(burialGroupMap['매장묘']);
if (otherGroupMap['부가 항목']) newStandardizedPrices.push(otherGroupMap['부가 항목']);

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
