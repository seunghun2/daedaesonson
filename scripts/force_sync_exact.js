const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- Force Sync V2 to match V1 (1498 items) EXACTLY ---');

    // 1. Load V1 Data (The Source of Truth)
    const jsonPath = path.join(__dirname, '../data/facilities.json');
    // Ensure we force reload from file
    const v1DataRaw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // Ensure '수유 모의 시설' is gone (should be handled by previous step, but double check)
    const v1Data = v1DataRaw.filter(f => f.name !== '수유 모의 시설');

    console.log(`V1 Target Count: ${v1Data.length} (Should be 1498)`);

    // 2. Clear V2 Table Completely (Bold Move)
    console.log('Clearing V2 table to ensure exact match...');
    // Note: Delete all without where clause is tricky in Supabase clients usually, need non-empty condition.
    // We'll fetching all IDs first.
    let allIds = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase.from('Facility').select('id').range(from, from + 1000);
        if (error) throw error;
        if (!data.length) break;
        allIds.push(...data.map(d => d.id));
        from += 1000;
        // Safety break
        if (from > 10000) break;
    }

    if (allIds.length > 0) {
        console.log(`Deleting ${allIds.length} existing items...`);
        // Delete in chunks
        for (let i = 0; i < allIds.length; i += 100) {
            const chunk = allIds.slice(i, i + 100);
            await supabase.from('Facility').delete().in('id', chunk);
        }
    }

    console.log('V2 Cleared.');

    // 3. Bulk Insert V1 Data
    console.log('Inserting V1 data into V2...');

    const records = v1Data.map(f => {
        const imageStr = JSON.stringify(f.images || f.imageGallery || []);

        return {
            id: f.id,
            name: f.name,
            address: f.address || '',
            // phone: f.phone || '', // Still missing in schema
            category: f.category || 'OTHER',
            description: f.description || '',
            images: imageStr,
            updatedAt: new Date().toISOString(),
            rating: f.rating || 0,
            reviewCount: f.reviewCount || 0,
            isPublic: f.isPublic ?? false,
            hasParking: f.hasParking ?? false,
            hasRestaurant: f.hasRestaurant ?? false,
            hasStore: f.hasStore ?? false,
            hasAccessibility: f.hasAccessibility ?? false,

            // Fields mapping
            lat: f.coordinates?.lat || 0,
            lng: f.coordinates?.lng || 0,
            minPrice: f.priceRange?.min || 0,
            maxPrice: f.priceRange?.max || 0,
        };
    });

    // Chunk Insert
    let successCount = 0;
    for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100);
        const { error } = await supabase.from('Facility').insert(chunk);

        if (error) {
            console.error(`Error inserting chunk ${i}:`, error.message);
        } else {
            successCount += chunk.length;
            process.stdout.write('.');
        }
    }

    console.log(`\nSuccessfully populated ${successCount} items.`);

    // 4. Verification
    const { count } = await supabase.from('Facility').select('*', { count: 'exact', head: true });
    console.log(`Final V2 Count: ${count}`);
}

run();
