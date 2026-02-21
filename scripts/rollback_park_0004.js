const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
    const dataPath = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const facility = data.find(p => p.id === "park-0004");

    // 표준화된 V2 포맷 삭제 (기존 V1 포맷으로 돌아가도록 유도)
    if (facility && facility.priceInfo.standardizedPrices) {
        delete facility.priceInfo.standardizedPrices;

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: facility.priceInfo })
            .eq('id', "park-0004");

        if (error) {
            console.error("DB rollback error:", error);
        } else {
            console.log("✅ Rolled back park-0004 to original V1 data in DB.");
        }
    } else {
        console.log("Already in original state or not found.");
    }
}
main();
