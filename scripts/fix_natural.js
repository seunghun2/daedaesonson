const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPark0006() {
    const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    // Fix all facilities that mistakenly use NATURAL_BURIAL as serviceType
    let updatedDb = [];

    data.forEach(f => {
        let changed = false;
        if (f.priceInfo && f.priceInfo.standardizedPrices) {
            f.priceInfo.standardizedPrices.forEach(sp => {
                if (sp.serviceType === 'NATURAL_BURIAL') {
                    sp.serviceType = 'NATURAL';
                    changed = true;
                }
            });
        }
        if (changed) {
            updatedDb.push(f);
        }
    });

    if (updatedDb.length > 0) {
        fs.writeFileSync(facilitiesPath, JSON.stringify(data, null, 2));
        console.log(`Updated JSON for ${updatedDb.length} facilities.`);

        for (const f of updatedDb) {
            const { error } = await supabase.from('Facility').update({ pricing: f.priceInfo }).eq('id', f.id);
            if (error) {
                console.error(`Error updating Supabase for ${f.id}:`, error);
            } else {
                console.log(`Updated Supabase for ${f.id}`);
            }
        }
    } else {
        console.log('No facilities found with serviceType INDUSTRIAL_BURIAL');
    }
}
fixPark0006().catch(console.error);
