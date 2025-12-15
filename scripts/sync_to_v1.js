const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcoded based on successful cleanup_funeral.js
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- Starting Sync (V2 -> V1) ---');

    // 1. Load V1 Data (JSON)
    const jsonPath = path.join(__dirname, '../data/facilities.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('Error: data/facilities.json not found');
        process.exit(1);
    }

    const v1Data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded V1 Data (JSON: Master): ${v1Data.length} items`);

    // Normalize Names for comparison (trim, remove spaces to be safe)
    // Map: Normalized Name -> V1 Item
    const v1Map = new Map();
    v1Data.forEach(f => {
        // Strict normalization: trim
        v1Map.set(f.name.trim(), f);
    });

    // 2. Load V2 Data (Supabase)
    // Fetch all IDs and Names
    let v2Facilities = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    // Fetch all pages
    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name')
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error('Supabase fetch error:', error);
            process.exit(1);
        }

        v2Facilities = [...v2Facilities, ...data];
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    console.log(`Loaded V2 Data (Supabase): ${v2Facilities.length} items`);

    // DEBUG: Check ID format
    console.log('[DEBUG] V1 Sample ID:', v1Data[10].id, v1Data[10].name);
    const match = v2Facilities.find(f => f.name === v1Data[10].name);
    if (match) {
        console.log('[DEBUG] V2 Match ID:', match.id, match.name);
    } else {
        console.log('[DEBUG] No V2 match for sample.');
    }

    // 3. Compare & Identify Duplicates & Extras
    const toDeleteIds = [];
    const v2NameMap = new Map(); // Name -> [id1, id2...]

    v2Facilities.forEach(f => {
        const name = f.name.trim();
        if (!v2NameMap.has(name)) {
            v2NameMap.set(name, []);
        }
        v2NameMap.get(name).push(f.id);
    });

    // A. Extras (Name not in V1)
    v2NameMap.forEach((ids, name) => {
        if (!v1Map.has(name)) { // v1Map from previous code
            toDeleteIds.push(...ids);
        }
    });

    // B. Duplicates (Name exists, but multiple in V2)
    let duplicatesCount = 0;
    v2NameMap.forEach((ids, name) => {
        if (v1Map.has(name) && ids.length > 1) {
            // Keep one, delete rest. 
            // Prefer keeping the one that matches V1 ID if possible?
            const v1Id = v1Map.get(name).id;
            const exactMatchId = ids.find(id => id === v1Id);
            const keepId = exactMatchId || ids[0]; // If exact ID exists, keep it. Else keep first.

            const remove = ids.filter(id => id !== keepId);
            toDeleteIds.push(...remove);
            duplicatesCount += remove.length;
        }
    });

    console.log(`Found ${toDeleteIds.length} facilities to delete.`);
    console.log(`- Extras (Not in V1): ${toDeleteIds.length - duplicatesCount}`);
    console.log(`- Duplicates (In V2 > 1 time): ${duplicatesCount}`);

    if (toDeleteIds.length > 0) {
        // Safety check for massive deletion if needed, but user requested sync.
        console.log('Deleting extra facilities...');

        const CHUNK_SIZE = 100;
        for (let i = 0; i < toDeleteIds.length; i += CHUNK_SIZE) {
            const chunk = toDeleteIds.slice(i, i + CHUNK_SIZE);
            const { error: delErr } = await supabase
                .from('Facility')
                .delete()
                .in('id', chunk);

            if (delErr) {
                console.error(`Error deleting chunk ${i}:`, delErr);
            } else {
                console.log(`Deleted chunk ${i} - ${i + chunk.length}`);
            }
        }
        console.log('Deletion Complete.');
    } else {
        console.log('No extra facilities found. V2 matches V1 count (or is subset).');
    }

    // 4. Final Verify Count
    const { count } = await supabase.from('Facility').select('*', { count: 'exact', head: true });
    console.log(`Final V2 Count: ${count}`);
}

run();
