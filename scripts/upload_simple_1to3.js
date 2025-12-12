const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const IMAGE_DIR = path.join(process.cwd(), 'FLATTENED_IMAGES');
const BUCKET_NAME = 'facilities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🎯 SIMPLE UPLOAD: No.1~3 only!');

    // 1. Get ALL facilities from DB (paginated)
    let allFacilities = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, originalName')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('DB Error:', error.message);
            return;
        }

        if (!data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        if (data.length < pageSize) break;
        page++;
    }

    // Sort by originalName number
    const facilities = allFacilities.sort((a, b) => {
        const getNum = (f) => {
            if (!f.originalName) return 99999;
            const match = f.originalName.match(/^(\d+)\./);
            return match ? parseInt(match[1]) : 99999;
        };
        return getNum(a) - getNum(b);
    });

    console.log(`✅ Loaded ${facilities.length} facilities from DB`);

    // 2. Get images for No.1, 2, 3
    const files = fs.readdirSync(IMAGE_DIR).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    for (let no = 1; no <= 3; no++) {
        const facility = facilities[no - 1]; // Array is 0-indexed
        if (!facility) {
            console.warn(`No facility at position ${no}`);
            continue;
        }

        console.log(`\n📍 No.${no}: ${facility.name} (ID: ${facility.id})`);

        // Find images for this number
        const pattern = new RegExp(`^${no}\\..*_img\\d+\\.(jpg|jpeg|png|webp|gif)$`, 'i');
        const facilityImages = files.filter(f => pattern.test(f));

        if (facilityImages.length === 0) {
            console.log(`   ⚠️  No images found for No.${no}`);
            continue;
        }

        console.log(`   Found ${facilityImages.length} images`);

        const uploadedUrls = [];

        for (const file of facilityImages) {
            try {
                const filePath = path.join(IMAGE_DIR, file);
                const fileBuffer = fs.readFileSync(filePath);
                const fileExt = path.extname(file);

                // Extract image index from filename (e.g., "1.Name_img3.jpg" -> 3)
                const match = file.match(/_img(\d+)\./);
                const imgIndex = match ? parseInt(match[1]) : 1;

                const storagePath = `facilities/${facility.id}/photo_${imgIndex}${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const publicUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath).data.publicUrl;
                uploadedUrls.push(publicUrl);

                console.log(`   ✅ ${file}`);
            } catch (err) {
                console.error(`   ❌ Failed: ${file}: ${err.message}`);
            }
        }

        // Update DB
        if (uploadedUrls.length > 0) {
            const { error } = await supabase
                .from('Facility')
                .update({ images: JSON.stringify(uploadedUrls) })
                .eq('id', facility.id);

            if (error) {
                console.error(`   ❌ DB Update failed: ${error.message}`);
            } else {
                console.log(`   💾 DB Updated with ${uploadedUrls.length} images`);
            }
        }
    }

    console.log('\n✅ DONE! Check localhost:3000/admin/upload');
}

main();
