const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPark0001() {
    const rawData = fs.readFileSync('data/facilities.json', 'utf8');
    const data = JSON.parse(rawData);
    const facilities = data.facilities || data;

    const targetFacility = facilities.find(f => f.id === 'park-0001');
    if (!targetFacility || !targetFacility.priceInfo) {
        console.error('park-0001 not found or missing priceInfo');
        return;
    }

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: targetFacility.priceInfo })
        .eq('id', 'park-0001');

    if (error) {
        console.error('Error updating DB:', error);
    } else {
        console.log('✅ DB update complete for park-0001');
    }
}

syncPark0001();
