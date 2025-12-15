
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';

// === INIT ===
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function uploadTest1to10() {
    console.log('🚀 Starting Test Upload (Files starting with 1. ~ 10.)...');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    // 1. Fetch all facilities for Strict Matching
    console.log('📡 Fetching facility list...');
    const { data: allFacilities, error } = await supabase
        .from('Facility')
        .select('id, name');

    if (error) {
        console.error('❌ Failed to fetch facilities:', error.message);
        return;
    }

    // Strict Map: Name -> ID
    const facilityIdMap = {};
    allFacilities.forEach(f => {
        if (f.name) facilityIdMap[f.name.trim()] = f.id;
    });

    // 2. Filter Files (1. ~ 10.)
    const allFiles = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    // Regex to match "Number." at start
    // We only want 1. to 10.
    const targetFiles = allFiles.filter(f => {
        const match = f.match(/^(\d+)\./);
        if (match) {
            const num = parseInt(match[1]);
            return num >= 1 && num <= 10;
        }
        return false;
    });

    console.log(`📂 Found ${targetFiles.length} files in range 1~10.`);

    // Group by Name
    const fileGroups = {};
    targetFiles.forEach(file => {
        const match = file.match(/^\d+\.(.+)_img\d+\./);
        if (match && match[1]) {
            const name = match[1].trim();
            if (!fileGroups[name]) fileGroups[name] = [];
            fileGroups[name].push(file);
        }
    });

    const groupNames = Object.keys(fileGroups);
    console.log(`🎯 Targeted Facilities: ${groupNames.length} groups`);

    let successCount = 0;
    let failCount = 0;

    for (const name of groupNames) {
        // STRICT MATCH CHECK
        const facilityId = facilityIdMap[name];

        if (!facilityId) {
            console.warn(`⚠️  Skipping "${name}": Not found in DB (Strict Match Failed)`);
            continue;
        }

        console.log(`\nProcessing: "${name}" (ID: ${facilityId})`);
        const groupFiles = fileGroups[name];
        const uploadedUrls = [];

        // Upload loop
        for (const file of groupFiles) {
            try {
                const filePath = path.join(IMAGE_DIR, file);
                const fileBuffer = fs.readFileSync(filePath);

                // Extract img index for sorting safety? Or just random unique name?
                // Using "photo_{timestamp}_{random}" to avoid conflicts and cache issues
                // Or better: keep original logic "photo_1.jpg" if we parsed index
                const idxMatch = file.match(/_img(\d+)\./);
                const imgIndex = idxMatch ? idxMatch[1] : Date.now();
                const fileExt = path.extname(file);

                // Path: facilities/{UUID}/photo_{Index}.ext
                const storagePath = `facilities/${facilityId}/photo_${imgIndex}${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath).data.publicUrl;
                // Add cache buster to URL just in case
                uploadedUrls.push(publicUrl + '?t=' + Date.now());
                process.stdout.write('↑');
            } catch (err) {
                console.error(`  ❌ Err uploading ${file}: ${err.message}`);
            }
        }

        if (uploadedUrls.length > 0) {
            // Update DB
            // Sort URLs by index logic if possible, but they are strings now.
            // Simple sort is fine.
            uploadedUrls.sort();

            const { error: updateError } = await supabase
                .from('Facility')
                .update({ images: JSON.stringify(uploadedUrls) })
                .eq('id', facilityId);

            if (updateError) {
                console.error(`  ❌ DB Link Failed: ${updateError.message}`);
                failCount++;
            } else {
                console.log(`  ✅ Linked ${uploadedUrls.length} images.`);
                successCount++;
            }
        }
    }

    console.log('\n-----------------------------------');
    console.log(`🎉 Test Complete!`);
    console.log(`✅ Success Groups: ${successCount}`);
    console.log(`❌ Failed Groups:  ${failCount}`);
}

uploadTest1to10();
