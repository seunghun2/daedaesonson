
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

async function uploadAllImages() {
    console.log('🚀 Starting Full Image Upload (Strict Match + NFC Normalization)...');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    // 1. Fetch DB Facilities
    console.log('📡 Fetching facility list...');
    const { data: allFacilities, error } = await supabase
        .from('Facility')
        .select('id, name');

    if (error) {
        console.error('❌ Failed to fetch facilities:', error.message);
        return;
    }

    // Map: Name -> ID
    const facilityIdMap = {};
    allFacilities.forEach(f => {
        if (f.name) facilityIdMap[f.name.trim()] = f.id;
    });
    console.log(`✅ Dictionary loaded with ${allFacilities.length} facilities.`);

    // 2. Read Files & Group
    const allFiles = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    console.log(`📂 Found ${allFiles.length} image files.`);

    const fileGroups = {};
    let skippedFiles = 0;

    allFiles.forEach(rawFile => {
        // [IMPORTANT] Normalize Filename to NFC (Fix Mac Korean issue)
        const file = rawFile.normalize('NFC');

        // Pattern: [digits].[NAME]_img[digits].[ext]
        const match = file.match(/^\d+\.(.+)_img\d+\./);

        if (match && match[1]) {
            const name = match[1].trim();
            if (!fileGroups[name]) fileGroups[name] = [];

            // Should verify if we store rawFile or normalized file for fs.read
            // actually fs.read usually works with rawFile better if we iterate fs list
            // So let's store object
            fileGroups[name].push({ raw: rawFile, normalized: file });
        } else {
            // console.warn(`⚠️ Unrecognized format: ${file}`);
            skippedFiles++;
        }
    });

    const groupNames = Object.keys(fileGroups);
    console.log(`🎯 Found ${groupNames.length} facility groups in files.`);
    if (skippedFiles > 0) console.log(`⏩ Skipped ${skippedFiles} files with unknown format.`);

    // 3. Process Uploads
    let successCount = 0;
    let failCount = 0;
    let notFoundCount = 0;

    console.log('\n--- Processing ---');

    for (let i = 0; i < groupNames.length; i++) {
        const name = groupNames[i];

        // STRICT MATCH
        const facilityId = facilityIdMap[name];

        if (!facilityId) {
            // console.warn(`⚠️  Skipping "${name}": Not found in DB`);
            notFoundCount++;
            continue;
        }

        const groupFiles = fileGroups[name];
        const uploadedUrls = [];

        // Single line log
        process.stdout.write(`[${i + 1}/${groupNames.length}] "${name}" (${groupFiles.length} images) `);

        for (const fileObj of groupFiles) {
            try {
                const filePath = path.join(IMAGE_DIR, fileObj.raw); // Use Raw for FS access
                const fileBuffer = fs.readFileSync(filePath);

                // Extract Index for storage path
                const parts = fileObj.normalized.split('_img');
                let imgIndex = '0';
                if (parts.length >= 2) {
                    imgIndex = parts[1].split('.')[0];
                }
                const fileExt = path.extname(fileObj.normalized);

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
                // Add timestamp to force refresh if re-uploaded
                uploadedUrls.push(publicUrl);
                process.stdout.write('.');
            } catch (err) {
                process.stdout.write('X');
                // console.error(`Err: ${err.message}`);
            }
        }

        if (uploadedUrls.length > 0) {
            // Sort to ensure photo_1 comes before photo_2 roughly
            // Simple string sort is okay-ish: photo_1, photo_10, photo_2... 
            // Better to sort by extracted number but simple sort is enough for now
            uploadedUrls.sort();

            const { error: updateError } = await supabase
                .from('Facility')
                .update({ images: JSON.stringify(uploadedUrls) })
                .eq('id', facilityId);

            if (updateError) {
                process.stdout.write(' -> DB Fail\n');
                failCount++;
            } else {
                process.stdout.write(' -> Done\n');
                successCount++;
            }
        } else {
            process.stdout.write(' -> No uploads?\n');
        }
    }

    console.log('\n===================================');
    console.log(`🎉 Operation Complete!`);
    console.log(`✅ Updated Facilities: ${successCount}`);
    console.log(`⚠️  No Match (Skipped): ${notFoundCount}`);
    console.log(`❌ Errors:             ${failCount}`);
}

uploadAllImages();
