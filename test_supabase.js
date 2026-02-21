const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    const { data, error } = await supabase.from('Facility').select('pricing').eq('id', 'park-0003').single();
    if (error) { console.error(error); return; }
    console.log(JSON.stringify(data.pricing.standardizedPrices.map(x => x.serviceType)));
}
run();
