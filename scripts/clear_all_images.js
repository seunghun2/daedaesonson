
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Credentials from previous working scripts
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function clearAllImages() {
    console.log('Starting to clear all images from DB and Local JSON...');

    // 1. Clear Supabase DB
    try {
        const { error } = await supabase
            .from('Facility')
            .update({ images: [] }) // Only update 'images' column, 'imageGallery' column likely doesn't exist
            .neq('id', 'placeholder_impossible_id');

        if (error) {
            console.error('Error clearing DB images:', error);
        } else {
            console.log('✅ Supabase DB images cleared.');
        }
    } catch (e) {
        console.error('Exception clearing DB:', e);
    }

    // 2. Clear Local JSON
    const jsonPath = path.join(process.cwd(), 'data/facilities.json');
    try {
        if (fs.existsSync(jsonPath)) {
            console.log('Clearing local JSON...');
            // Just write strict empty array if parsing fails or just overwrite it
            // But to be safe, let's try to keep other data if possible.
            // Since previous run failed to parse, the file might be just [] now.
            const data = fs.readFileSync(jsonPath, 'utf8');
            let facilities = [];
            try {
                facilities = JSON.parse(data);
            } catch (e) {
                facilities = [];
            }

            if (Array.isArray(facilities)) {
                const updatedFacilities = facilities.map(f => ({
                    ...f,
                    images: [],
                    imageGallery: []
                    // In local JSON we might have used imageGallery key, so clearing it is fine.
                }));
                fs.writeFileSync(jsonPath, JSON.stringify(updatedFacilities, null, 2));
                console.log('✅ Local facilities.json images cleared.');
            } else {
                // If it's not an array, just reset it to []
                fs.writeFileSync(jsonPath, '[]');
                console.log('✅ Local facilities.json reset to empty array.');
            }
        }
    } catch (e) {
        console.error('Error clearing local JSON:', e);
    }

    console.log('Done.');
}

clearAllImages();
