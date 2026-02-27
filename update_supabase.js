require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const park = data.find(p => p.id === 'park-0012');

async function update() {
    const { data: dbData, error: getErr } = await supabase.from('Facility').select('pricing').eq('id', 'park-0012').single();
    if (getErr) return console.error(getErr);

    let pricing = {};
    if (dbData.pricing) {
        pricing = typeof dbData.pricing === 'string' ? JSON.parse(dbData.pricing) : dbData.pricing;
    }

    pricing.standardizedPrices = park.standardizedPrices;

    const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(pricing) }).eq('id', 'park-0012');
    if (error) console.error('Error updating:', error);
    else console.log('Successfully updated park-0012 in Supabase!');
}
update();
