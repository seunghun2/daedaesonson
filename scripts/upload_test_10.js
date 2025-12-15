const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';
const TEST_LIMIT = 10; // Test first 10

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function main() {
    console.log(`🧪 TEST MODE: First ${TEST_LIMIT} facilities only...`);

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    console.log('📡 Fetching ALL facilities from DB (paginated)...');

    // Fetch ALL facilities
    let allFacilities = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('❌ Failed to fetch facilities:', error.message);
            return;
        }

        if (!data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    const facilityIdMap = {};
    const facilityNormalizedMap = {};
    allFacilities.forEach(f => {
        if (f.name) {
            const trimmedName = f.name.trim();
            facilityIdMap[trimmedName] = f.id;
            const normalized = trimmedName.normalize('NFC').replace(/\s+/g, '');
            facilityNormalizedMap[normalized] = f.id;
        }
    });
    console.log(`✅ Loaded ${allFacilities.length} facilities from DB.`);

    const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    const fileGroups = {};
    files.forEach(file => {
        const keyPart = file.split('_img')[0];
        if (!fileGroups[keyPart]) fileGroups[keyPart] = [];
        fileGroups[keyPart].push(file);
    });

    // Sort by number
    const groupKeys = Object.keys(fileGroups).sort((a, b) => {
        const getNum = (key) => {
            const dotIdx = key.indexOf('.');
            if (dotIdx > -1) {
                const numStr = key.substring(0, dotIdx);
                return parseInt(numStr) || 99999;
            }
            return 99999;
        };
        return getNum(a) - getNum(b);
    }).slice(0, TEST_LIMIT); // LIMIT HERE

    console.log(`Processing first ${groupKeys.length} facilities...`);

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

        let facilityId = facilityIdMap[nameToMatch];
        if (!facilityId) {
            const normalized = nameToMatch.normalize('NFC').replace(/\s+/g, '');
            facilityId = facilityNormalizedMap[normalized];
        }

        if (!facilityId) {
            console.warn(`⚠️  [${i + 1}] No match: "${nameToMatch}" (${groupKey})`);
            skipCount++;
            continue;
        }

        console.log(`✅ [${i + 1}/${groupKeys.length}] Processing: ${nameToMatch} (ID: ${facilityId})`);

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
                console.log(`   📷 Uploaded: ${file}`);
            } catch (err) {
                console.error(`   ❌ Failed: ${file}: ${err.message}`);
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
    console.log(`Success: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
}

main();
