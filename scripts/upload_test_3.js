const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';
const TEST_LIMIT = 10; // Only process first 10 facilities

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function main() {
    console.log(`🧪 TEST MODE: Processing only FIRST ${TEST_LIMIT} facilities...`);

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    console.log('📡 Fetching facility list from DB...');
    const { data: allFacilities, error: fetchError } = await supabase
        .from('Facility')
        .select('id, name');

    if (fetchError) {
        console.error('❌ Failed to fetch facilities:', fetchError.message);
        return;
    }

    const facilityIdMap = {};
    allFacilities.forEach(f => {
        if (f.name) facilityIdMap[f.name.trim()] = f.id;
    });
    console.log(`✅ Loaded ${allFacilities.length} facilities from DB.`);

    const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    console.log(`Found ${files.length} images to process.`);

    const fileGroups = {};
    files.forEach(file => {
        const keyPart = file.split('_img')[0];
        if (!fileGroups[keyPart]) fileGroups[keyPart] = [];
        fileGroups[keyPart].push(file);
    });

    const groupKeys = Object.keys(fileGroups).slice(0, TEST_LIMIT); // LIMIT HERE
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < groupKeys.length; i++) {
        const groupKey = groupKeys[i];
        const groupFiles = fileGroups[groupKey];

        const firstDotIdx = groupKey.indexOf('.');
        let nameToMatch = groupKey;
        if (firstDotIdx > -1) {
            nameToMatch = groupKey.substring(firstDotIdx + 1).trim();
        }

        const facilityId = facilityIdMap[nameToMatch];

        if (!facilityId) {
            console.warn(`⚠️  No matching DB record for: "${nameToMatch}" (Skipping)`);
            skipCount++;
            continue;
        }

        console.log(`[${i + 1}/${groupKeys.length}] Processing: ${nameToMatch} (ID: ${facilityId})`);

        const uploadedUrls = [];

        for (const file of groupFiles) {
            try {
                const filePath = path.join(IMAGE_DIR, file);
                const fileBuffer = fs.readFileSync(filePath);
                const fileExt = path.extname(file);

                const parts = file.split('_img');
                if (parts.length < 2) continue;
                const imgPart = parts[1];
                const imgIndex = parseInt(imgPart);

                const storagePath = `facilities/${facilityId}/photo_${imgIndex}${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath).data.publicUrl;
                uploadedUrls.push(publicUrl);
                console.log(`   ✅ Uploaded: ${file} -> ${storagePath}`);
            } catch (err) {
                console.error(`   ❌ Failed to upload ${file}: ${err.message}`);
            }
        }

        if (uploadedUrls.length > 0) {
            const { error: updateError } = await supabase
                .from('Facility')
                .update({ images: JSON.stringify(uploadedUrls) })
                .eq('id', facilityId);

            if (updateError) {
                console.error(`   ❌ DB Update Failed: ${updateError.message}`);
            } else {
                console.log(`   ✅ DB Updated with ${uploadedUrls.length} images`);
                successCount++;
            }
        }
    }

    console.log('\n✅ TEST COMPLETE!');
    console.log(`Processed: ${successCount} facilities`);
    console.log(`Skipped: ${skipCount} facilities`);
}

main();
