const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'; // Service Role Key (allows bypass RLS)
const IMAGES_DIR = '/Users/el/Desktop/daedaesonson/FLATTENED_IMAGES';
const JSON_PATH = '/Users/el/Desktop/daedaesonson/data/facilities.json';
const TARGET_INDICES = [0, 1, 2]; // Defined as array indices (No. 1, 2, 3)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🚀 STARTING TEST UPLOAD (No. 1 ~ 3)...');

    // 1. Load Facilities Data
    console.log(`reading facilities.json...`);
    const facilitiesData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    // 2. Read Image Directory
    console.log(`Scanning images in ${IMAGES_DIR}...`);
    const allFiles = fs.readdirSync(IMAGES_DIR);

    // 3. Process Target Facilities
    for (const dataIndex of TARGET_INDICES) {
        const facility = facilitiesData[dataIndex];
        const facilityNo = dataIndex + 1; // "1", "2", "3"
        const prefix = `${facilityNo}.`;

        let targetId = facility.id;

        // === ID RESOLUTION LOGIC ===
        // 1. Verify if the ID from JSON exists in the DB
        const { data: idCheck } = await supabase
            .from('Facility')
            .select('id')
            .eq('id', targetId)
            .maybeSingle();

        if (!idCheck) {
            console.log(`  ⚠️ ID '${targetId}' not found in DB. Searching by exact name "${facility.name}"...`);
            const normalizedName = facility.name.normalize('NFC');
            const { data: nameMatch } = await supabase
                .from('Facility')
                .select('id')
                .eq('name', normalizedName);

            if (nameMatch && nameMatch.length > 0) {
                // Use the first match. If 'park-' exists in list, prefer it? 
                // For now, just taking the first found is safer than nothing.
                targetId = nameMatch[0].id;
                console.log(`  ✅ Found DB record by name: ${targetId}`);
            } else {
                console.log(`  ❌ No matching facility found in DB for "${normalizedName}". Skipping DB update.`);
                // We still upload images? No, meaningless if we can't link them.
                continue;
            }
        }

        console.log(`Processing No.${facilityNo}: ${facility.name} (Target ID: ${targetId})`);

        // Find matching images
        const facilityImages = allFiles.filter(file => file.startsWith(prefix) && !file.startsWith('.'));

        // Sort images to ensure order (img1, img2, img3...)
        // Simple alphanumeric sort might fail on img1 vs img10, but usually img1 comes first.
        // We can trust the simple sort for small numbers or implement logical sort if needed.
        facilityImages.sort((a, b) => {
            // Extract number from _imgN
            const getNum = (s) => parseInt(s.match(/_img(\d+)/)?.[1] || 0);
            return getNum(a) - getNum(b);
        });

        console.log(`Found ${facilityImages.length} images:`, facilityImages);

        if (facilityImages.length === 0) {
            console.log('⚠️ No images found for this facility. Skipping upload.');
            continue;
        }

        const uploadedUrls = [];

        // Upload each image
        for (const filename of facilityImages) {
            const forbiddenCharacters = /[^\x00-\x7F]/g;
            // Clean filename for storage path (Supabase might dislike Korean chars in keys sometimes, 
            // but usually it's fine. Safest is to use a clean predictable name or keep original if it works.
            // Let's try sticking to a standard predictable path: facilities/{id}/{index}.jpg OR keep original name.
            // User wanted to "restore", let's keep it simple: `facilities/restored/{filename}`

            // Sanitize filename for storage key to avoid "Invalid key" errors (caused by Korean/Special chars)
            // Strategy: Use "image_{number}" based on the original file's _img{N} suffix to preserve order.
            const match = filename.match(/_img(\d+)/i);
            const imgNum = match ? match[1] : (uploadedUrls.length + 1).toString();
            const ext = path.extname(filename);
            const safeName = `image_${imgNum}${ext}`;

            const filePath = path.join(IMAGES_DIR, filename);
            const fileBuffer = fs.readFileSync(filePath);
            const storagePath = `facility_images/${targetId}/${safeName}`;

            console.log(`  - Uploading ${filename} -> ${storagePath}...`);

            const { data, error } = await supabase.storage
                .from('facilities') // Bucket name
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/jpeg', // Assuming jpg/png, auto-detection usually works but explicit is good.
                    upsert: true
                });

            if (error) {
                console.error(`  ❌ Upload failed for ${filename}:`, error.message);
            } else {
                // Construct Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('facilities')
                    .getPublicUrl(storagePath);

                console.log(`  ✅ Uploaded!`);
                uploadedUrls.push(publicUrl);
            }
        }

        // Update Database
        if (uploadedUrls.length > 0) {
            console.log(`Updating Database for ${facility.name} (ID: ${targetId})...`);
            const { error: dbError } = await supabase
                .from('Facility')
                .update({ images: uploadedUrls })
                .eq('id', targetId); // Matches UUID in DB

            if (dbError) {
                console.error(`❌ DB Update Failed:`, dbError.message);
            } else {
                console.log(`🎉 DB Updated successfully with ${uploadedUrls.length} images.`);
            }
        }
    }

    console.log('\n✅ TEST COMPLETED.');
}

main();
