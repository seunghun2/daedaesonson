const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGES_DIR = '/Users/el/Desktop/daedaesonson/FLATTENED_IMAGES';
const JSON_PATH = '/Users/el/Desktop/daedaesonson/data/facilities.json';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🚀 STARTING BULK UPLOAD FOR ALL FACILITIES...');

    // 1. Load Facilities Data
    console.log(`Reading facilities.json...`);
    const facilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    // 2. Scan and Group Images
    console.log(`Scanning images in ${IMAGES_DIR}...`);
    const allFiles = fs.readdirSync(IMAGES_DIR);

    // Group files by facility number (prefix "1.", "2.", etc.) for O(1) lookup
    const imageMap = {};
    let totalImagesFound = 0;

    for (const file of allFiles) {
        if (file.startsWith('.')) continue; // Skip hidden files

        const match = file.match(/^(\d+)\./); // Extract "1" from "1.(재)낙원..."
        if (match) {
            const num = match[1];
            if (!imageMap[num]) imageMap[num] = [];
            imageMap[num].push(file);
            totalImagesFound++;
        }
    }

    console.log(`✅ Loaded ${facilities.length} facilities.`);
    console.log(`✅ Found ${totalImagesFound} images mapped to ${Object.keys(imageMap).length} facility numbers.`);

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // 3. Iterate All Facilities
    const START_FROM_FACILITY_NUMBER = 0; // Default start

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        const facilityNo = (i + 1).toString();

        if (parseInt(facilityNo) < START_FROM_FACILITY_NUMBER) {
            console.log(`  ⏩ Skipping facility number ${facilityNo} (less than ${START_FROM_FACILITY_NUMBER}).`);
            skipCount++;
            continue;
        }

        const images = imageMap[facilityNo];

        // Progress log every 10 items or if it creates noise
        // But for bulk, we might want one line per processed item.

        if (!images || images.length === 0) {
            // No images for this facility -> Skip silent or verbose?
            // console.log(`[${i+1}/${facilities.length}] No images for ${facility.name}. Skipping.`);
            skipCount++;
            continue;
        }

        console.log(`\n[${i + 1}/${facilities.length}] Processing No.${facilityNo}: ${facility.name} (${images.length} images)`);

        try {
            // --- ID RESOLUTION LOGIC ---
            // Goal: Find ALL records that match this facility (by ID or Name) and update all of them.
            // This handles cases where 'park-0004' exists but the UI uses '200...' legacy ID.

            const targetIds = new Set();
            const normalizedName = facility.name ? facility.name.normalize('NFC') : '';

            // 1. Check JSON ID
            if (facility.id) {
                const { data: idCheck } = await supabase
                    .from('Facility')
                    .select('id')
                    .eq('id', facility.id)
                    .maybeSingle();
                if (idCheck) targetIds.add(idCheck.id);
            }

            // 2. Check Name Match (NFC)
            if (normalizedName) {
                const { data: nameMatches } = await supabase
                    .from('Facility')
                    .select('id')
                    .eq('name', normalizedName);

                if (nameMatches) {
                    nameMatches.forEach(row => targetIds.add(row.id));
                }
            }

            if (targetIds.size === 0) {
                console.log(`  ❌ Error: Facility not found in DB (ID: ${facility.id}, Name: ${normalizedName}). Skipping.`);
                failCount++;
                continue;
            }

            // Convert to array
            const finalTargetIds = Array.from(targetIds);
            // Storage Owner: Prioritize facility.id if present, else first found
            const storageId = (facility.id && targetIds.has(facility.id)) ? facility.id : finalTargetIds[0];

            console.log(`  -> Targets found: ${finalTargetIds.join(', ')} (Storage: ${storageId})`);

            // --- IMAGE SORTING ---
            // Ensure img1, img2, img10 order
            images.sort((a, b) => {
                const getNum = (s) => parseInt(s.match(/_img(\d+)/)?.[1] || 0);
                return getNum(a) - getNum(b);
            });

            // --- UPLOAD ---
            const uploadedUrls = [];
            for (const filename of images) {
                // Sanitize filename for S3 key
                const match = filename.match(/_img(\d+)/i);
                const imgNum = match ? match[1] : (uploadedUrls.length + 1).toString();
                const ext = path.extname(filename);
                const safeName = `image_${imgNum}${ext}`;

                const filePath = path.join(IMAGES_DIR, filename);
                const fileBuffer = fs.readFileSync(filePath);
                const storagePath = `facility_images/${storageId}/${safeName}`;

                const { error: uploadError } = await supabase.storage
                    .from('facilities')
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) {
                    console.error(`  ⚠️ Upload failed for ${filename}: ${uploadError.message}`);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('facilities')
                        .getPublicUrl(storagePath);
                    uploadedUrls.push(publicUrl);
                }
            }

            // --- DB UPDATE (MULTI) ---
            if (uploadedUrls.length > 0) {
                const { error: dbError } = await supabase
                    .from('Facility')
                    .update({ images: uploadedUrls })
                    .in('id', finalTargetIds); // UPDATE ALL MATCHING IDs

                if (dbError) {
                    console.error(`  ❌ DB Update Failed: ${dbError.message}`);
                    failCount++;
                } else {
                    console.log(`  ✅ Success: Synced ${uploadedUrls.length} images to ${finalTargetIds.length} records.`);
                    successCount++;
                }
            } else {
                console.log(`  ⚠️ No images successfully uploaded.`);
                failCount++;
            }

        } catch (err) {
            console.error(`  ❌ Critical Error processing ${facility.name}:`, err);
            failCount++;
        }
    }

    console.log('\n=============================================');
    console.log('🎉 BULK PROCESSING COMPLETE');
    console.log(`Total Scanned: ${facilities.length}`);
    console.log(`Skipped (No Images): ${skipCount}`);
    console.log(`Processed Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('=============================================');
}

main();
