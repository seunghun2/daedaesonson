const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'; // Obtained from previous scripts
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';

// === INIT ===
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function main() {
    console.log('🚀 Starting Flattened Image Upload (Safe Key Mode)...');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error('❌ FLATTENED_IMAGES directory not found!');
        return;
    }

    // 1. Fetch All Facilities (Paginated)
    console.log('📡 Fetching ALL facilities from DB (paginated)...');
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

    // Create Map: Name -> ID
    // Create Map: Name -> ID & Normalized Map
    const facilityIdMap = {};
    const facilityNormalizedMap = {};
    allFacilities.forEach(f => {
        if (f.name) {
            const trimmedName = f.name.trim();
            facilityIdMap[trimmedName] = f.id;
            // Normalize: NFC + Remove Spaces
            const normalized = trimmedName.normalize('NFC').replace(/\s+/g, '');
            facilityNormalizedMap[normalized] = f.id;
        }
    });
    console.log(`✅ Loaded ${allFacilities.length} facilities from DB.`);

    const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    console.log(`Found ${files.length} images to process.`);

    // Group files by Facility Key from filename
    // Format: "123.Name_img1.jpg"
    const fileGroups = {};
    files.forEach(file => {
        // key part is before "_img"
        const keyPart = file.split('_img')[0];
        if (!fileGroups[keyPart]) fileGroups[keyPart] = [];
        fileGroups[keyPart].push(file);
    });

    // === FULL PRODUCTION MODE ===
    const SKIP_UPLOAD = false;

    // Sort keys numerically to ensure we process 1, 2, 3... in order
    const groupKeys = Object.keys(fileGroups).sort((a, b) => {
        const numA = parseInt(a.split('.')[0]);
        const numB = parseInt(b.split('.')[0]);
        return numA - numB;
    });


    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // Helper: Sleep
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: Retryable Upload
    const uploadWithRetry = async (bucket, path, buffer, contentType, retries = 3) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(path, buffer, {
                        contentType: contentType,
                        upsert: true
                    });
                if (error) throw error;
                return data;
            } catch (err) {
                if (attempt === retries) throw err;
                console.warn(`   ⚠️  Upload failed (attempt ${attempt}/${retries}). Retrying in 1s...`);
                await sleep(1000 * attempt); // Exponential backoff-ish
            }
        }
    };

    // === FULL PRODUCTION MODE ===
    console.log(`🚀 Starting Full Processing for ${groupKeys.length} facility groups...`);

    // Process ALL groups
    console.log(`🚀 Starting Full Processing for ${groupKeys.length} facility groups...`);

    // Process ALL groups
    let currentIdx = 0;
    for (const groupKey of groupKeys) {
        currentIdx++;
        console.log(`\n --- [${currentIdx}/${groupKeys.length}] Processing Group: [${groupKey}] ---`);
        const groupFiles = fileGroups[groupKey];

        // Extract Name from "123.Name"
        const match = groupKey.match(/^\d+\.(.+)$/);
        let nameToMatch;
        if (!match) {
            failCount++;
            continue;
        }
        nameToMatch = match[1].trim();

        // Lookup ID
        let facilityId = facilityIdMap[nameToMatch];
        if (!facilityId) {
            const normalized = nameToMatch.normalize('NFC').replace(/\s+/g, '');
            facilityId = facilityNormalizedMap[normalized];
        }

        if (!facilityId) {
            skipCount++;
            continue;
        }
        // console.log(`Matched ID: ${facilityId} for "${nameToMatch}". Processing...`);

        if (!updatesMap[facilityId]) {
            updatesMap[facilityId] = [];
        }

        // Upload/Construct URL each file
        for (const filename of groupFiles) {
            // Index from filename "...._img1.jpg"
            // Format is: {prefix}_img{number}.{ext}
            const parts = filename.split('_img');
            if (parts.length < 2) continue;

            const fileExt = path.extname(filename);
            const imgPart = parts[1].replace(fileExt, ''); // "1"
            const imgIndex = parseInt(imgPart);

            // Correct Storage Path: facilities/{UUID}/photo_{N}.ext
            const storagePath = `facilities/${facilityId}/photo_${imgIndex}${fileExt}`;
            const fileBuffer = fs.readFileSync(path.join(IMAGE_DIR, filename));

            let publicUrl;

            if (SKIP_UPLOAD) {
                // Just construct URL assuming it exists
                const { data } = supabase.storage.from('facilities').getPublicUrl(storagePath);
                publicUrl = data.publicUrl;
            } else {
                // Real Upload
                const uploadData = await uploadWithRetry('facilities', storagePath, fileBuffer, 'image/jpeg');
                if (!uploadData) {
                    failCount++;
                    continue;
                }
                const { data } = supabase.storage.from('facilities').getPublicUrl(storagePath);
                publicUrl = data.publicUrl;
            }

            updatesMap[facilityId].push(publicUrl);
        }
        successCount++;
    }


    // === WRITE UPDATES TO LOCAL JSON ===
    console.log(`\n💾 Writing updates to local 'facilities.json'...`);
    const jsonPath = path.join(__dirname, '../data/facilities.json');
    let jsonData = [];
    try {
        jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
        console.error('Failed to read facilities.json', e);
        return;
    }

    let updateCount = 0;
    jsonData = jsonData.map(f => {
        if (updatesMap[f.id]) {
            // Merge existing? Or overwrite? User implies "Adding" images.
            // But usually this script is for "Restoring" or "Setting initial".
            // Let's overwrite "images" field but keep "imageGallery" sync if needed.
            // Actually, let's Append to avoid losing manual ones? 
            // The file names are strictly numbered, so likely Replace is cleaner for "Bulk Upload".
            // Let's REPLACE to ensure order.

            updateCount++;
            return {
                ...f,
                images: updatesMap[f.id],
                imageGallery: updatesMap[f.id] // Update UI gallery too
            };
        }
        return f;
    });

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log(`✅ Updated ${updateCount} facilities in local JSON.`);
    console.log(`⚠️  NOTE: Changes are LOCAL ONLY. Go to Admin -> Save to push to Live.`);

    console.log('-----------------------------------');
    console.log('🎉 Operation Complete!');
    console.log(`Updated Facilities (Local): ${successCount}`);
    console.log(`Skipped (No Match): ${skipCount}`);
    console.log(`DB/Upload Errors: ${failCount}`);
}

// Store updates here
const updatesMap = {};

main();
