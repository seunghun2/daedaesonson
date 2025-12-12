const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function main() {
    console.log('🚀 Starting FULL Image Upload (Ordered by originalName number)...');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    console.log('📡 Fetching facility list from DB...');

    // Fetch ALL facilities (paginated to bypass 1000 limit)
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

        if (data.length < pageSize) break; // Last page
        page++;
    }

    const facilityIdMap = {};
    const facilityNormalizedMap = {}; // 정규화된 이름으로도 찾기
    allFacilities.forEach(f => {
        if (f.name) {
            const trimmedName = f.name.trim();
            facilityIdMap[trimmedName] = f.id;

            // 정규화: 공백 제거, NFC 정규화
            const normalized = trimmedName.normalize('NFC').replace(/\s+/g, '');
            facilityNormalizedMap[normalized] = f.id;
        }
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

    // SORT by number prefix
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
    });

    console.log(`Processing ${groupKeys.length} facilities in originalName number order...`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < groupKeys.length; i++) {
        const groupKey = groupKeys[i];
        const groupFiles = fileGroups[groupKey];

        const firstDotIdx = groupKey.indexOf('.');
        let nameToMatch = groupKey;
        if (firstDotIdx > -1) {
            nameToMatch = groupKey.substring(firstDotIdx + 1).trim();
        }

        // Try exact match first
        let facilityId = facilityIdMap[nameToMatch];

        // If no exact match, try normalized match
        if (!facilityId) {
            const normalized = nameToMatch.normalize('NFC').replace(/\s+/g, '');
            facilityId = facilityNormalizedMap[normalized];
        }

        if (!facilityId) {
            console.warn(`⚠️  No match for: "${nameToMatch}" (${groupKey})`);
            skipCount++;
            continue;
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
            console.log(`[${i + 1}/${groupKeys.length}] Processing: ${nameToMatch.substring(0, 20)}...`);
        }

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
                failCount++;
            } else {
                successCount++;
                if (successCount % 50 === 0) process.stdout.write('.');
            }
        }
    }

    console.log('\n✅ UPLOAD COMPLETE!');
    console.log(`Success: ${successCount} facilities`);
    console.log(`Skipped (No DB Match): ${skipCount}`);
    console.log(`Failed: ${failCount}`);
}

main();
