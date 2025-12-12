const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- Starting Restoration (V1 -> V2) ---');

    // 1. Load V1 Data
    const jsonPath = path.join(__dirname, '../data/facilities.json');
    const v1Data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded V1 Data: ${v1Data.length} items`);

    const v1Map = new Map();
    v1Data.forEach(f => v1Map.set(f.name.trim(), f));

    // 2. Load V2 Data
    let v2Facilities = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name')
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error('Supabase error:', error);
            process.exit(1);
        }

        v2Facilities = [...v2Facilities, ...data];
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }
    console.log(`Loaded V2 Data: ${v2Facilities.length} items`);

    const v2Names = new Set(v2Facilities.map(f => f.name.trim()));

    // 3. Find Missing
    const missingItems = [];
    v1Data.forEach(f => {
        if (!v2Names.has(f.name.trim())) {
            missingItems.push(f);
        }
    });

    console.log(`Found ${missingItems.length} items present in V1 but MISSING in V2.`);

    if (missingItems.length > 0) {
        console.log('Restoring missing items...');

        // Prepare for Bulk Insert
        const records = missingItems.map(f => {
            const imageStr = JSON.stringify(f.images || f.imageGallery || []);

            return {
                id: f.id,
                name: f.name,
                address: f.address || '',
                // phone: f.phone || '', // ERROR: Column missing in DB
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

                // Fields mapping (consistent with route.ts)
                lat: f.coordinates?.lat || 0,
                lng: f.coordinates?.lng || 0,
                minPrice: f.priceRange?.min || 0,
                maxPrice: f.priceRange?.max || 0,
            };
        });

        const { error } = await supabase
            .from('Facility')
            .upsert(records, { onConflict: 'id' });

        if (error) {
            console.error('Restore failed:', error);
        } else {
            console.log(`Successfully restored ${records.length} items.`);
        }
    } else {
        console.log('V2 has all items from V1.');
    }

    // 4. Final Verify
    const { count } = await supabase.from('Facility').select('*', { count: 'exact', head: true });
    console.log(`Final V2 Count: ${count}`);
}

run();
