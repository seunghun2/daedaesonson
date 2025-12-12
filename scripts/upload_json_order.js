const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const IMAGE_DIR = 'FLATTENED_IMAGES';

async function main() {
    const jsonData = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

    for (let no = 1; no <= 3; no++) {
        const facility = jsonData[no - 1];
        if (!facility) {
            console.log(`No facility at position ${no}`);
            continue;
        }

        console.log(`\n📍 No.${no}: ${facility.name} (ID: ${facility.id})`);

        const allFiles = fs.readdirSync(IMAGE_DIR);
        const files = allFiles.filter(f => f.startsWith(`${no}.`) && /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

        console.log(`   Found ${files.length} images`);

        if (files.length === 0) continue;

        const uploadedUrls = [];

        for (const file of files) {
            const filePath = path.join(IMAGE_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);
            const fileExt = path.extname(file);
            const match = file.match(/_img(\d+)\./);
            const imgIndex = match ? parseInt(match[1]) : 1;

            const storagePath = `facilities/${facility.id}/photo_${imgIndex}${fileExt}`;

            const { error } = await supabase.storage.from('facilities').upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });

            if (error) {
                console.log(`   ❌ ${file}: ${error.message}`);
            } else {
                const url = supabase.storage.from('facilities').getPublicUrl(storagePath).data.publicUrl;
                uploadedUrls.push(url);
                console.log(`   ✅ ${file}`);
            }
        }

        if (uploadedUrls.length > 0) {
            const { error } = await supabase.from('Facility').update({ images: JSON.stringify(uploadedUrls) }).eq('id', facility.id);
            console.log(error ? `   ❌ DB failed: ${error.message}` : `   💾 DB updated (${uploadedUrls.length} images)`);
        }
    }

    console.log('\n✅ Complete! Refresh browser to see images.');
}

main();
