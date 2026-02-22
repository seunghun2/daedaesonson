require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

async function mergeDuplicateSubTypes() {
    for (let pIndex = 0; pIndex < facilitiesData.length; pIndex++) {
        const facility = facilitiesData[pIndex];
        if (!facility.priceInfo || !facility.priceInfo.standardizedPrices) {
            continue;
        }

        const prices = facility.priceInfo.standardizedPrices;
        const mergedMap = new Map();

        let modified = false;

        prices.forEach(group => {
            if (!group.subType) {
                // If subType is empty, just keep it separate or use a fallback
                group.subType = '미분류';
            }

            // To ensure we don't merge different serviceTypes under the same subType name blindly
            const key = `${group.serviceType}::${group.subType}`;

            if (mergedMap.has(key)) {
                modified = true;
                const existing = mergedMap.get(key);
                // Merge rows
                if (group.rows && Array.isArray(group.rows)) {
                    existing.rows = existing.rows.concat(group.rows);
                }
            } else {
                // Clone the object so we don't accidentally mutate while looping? Not strictly needed but safe
                mergedMap.set(key, { ...group, rows: group.rows ? [...group.rows] : [] });
            }
        });

        if (modified) {
            const newPrices = Array.from(mergedMap.values());

            console.log(`Merging duplicates for ${facility.id}...`);

            const { error } = await supabase.from('Facility').update({ pricing: { standardizedPrices: newPrices } }).eq('id', facility.id);
            if (error) {
                console.error(`Error updating ${facility.id}:`, error);
            } else {
                facilitiesData[pIndex].priceInfo.standardizedPrices = newPrices;
            }
        }
    }

    fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    console.log('Done merging duplicates across all parks.');
}

mergeDuplicateSubTypes();
