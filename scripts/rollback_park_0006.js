const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    console.log("Starting park-0006 rollback...");
    const dataPath = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const parkId = "park-0006";
    const facility = data.find(p => p.id === parkId);
    if (!facility) {
        console.error("Facility not found");
        return;
    }

    // Delete standardizedPrices entirely
    delete facility.priceInfo.standardizedPrices;

    // Write back to JSON
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

    // Sync original priceInfo (now missing standardizedPrices) to DB 'pricing'
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: facility.priceInfo })
        .eq('id', parkId);

    if (error) {
        console.error("DB rollback error:", error);
    } else {
        console.log("✅ DB rollback complete for park-0006! Now using V1 legacy view.");
    }
}
main();
