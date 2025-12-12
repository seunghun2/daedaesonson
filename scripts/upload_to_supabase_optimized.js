const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Config
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const SOURCE_DIR = 'public/images/facilities';
const BUCKET_NAME = 'facilities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

async function main() {
    console.log('🚀 Supabase Upload Script Started');

    // 1. Ensure Bucket Exists
    console.log(`Checking bucket '${BUCKET_NAME}'...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('❌ Failed to list buckets:', listError.message);
        process.exit(1);
    }

    const bucketExists = buckets.find(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
        console.log(`Creating bucket '${BUCKET_NAME}'...`);
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/*']
        });
        if (createError) {
            console.error('❌ Failed to create bucket:', createError.message);
            process.exit(1);
        }
        console.log('✅ Bucket created.');
    } else {
        console.log('✅ Bucket exists.');
    }

    // 2. Scan Files
    console.log(`Scanning ${SOURCE_DIR}...`);
    let files = [];
    try {
        files = await getFiles(SOURCE_DIR);
    } catch (e) {
        console.error('❌ Error scanning directory. Make sure path exists.', e.message);
        return;
    }

    // Filter images only
    files = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    console.log(`📸 Found ${files.length} images.`);

    // 3. Process & Upload
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const fileName = path.basename(filePath); // Just filename for flat bucket, or relative?
        // Let's use filename as id (assuming unique). If duplicates exist in subfolders, this might collide.
        // But usually facility images are named by ID.

        // Target name: change extension to .webp
        const targetName = fileName.replace(/\.[^/.]+$/, "") + ".webp";

        process.stdout.write(`Processing [${i + 1}/${files.length}] ${fileName}... `);

        try {
            const fileBuffer = await fs.promises.readFile(filePath);

            // Resize & Compress
            const optimizedBuffer = await sharp(fileBuffer)
                .resize({ width: 1024, withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();

            // Upload
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(targetName, optimizedBuffer, {
                    contentType: 'image/webp',
                    upsert: true
                });

            if (uploadError) {
                console.log(`❌ Upload failed: ${uploadError.message}`);
            } else {
                console.log(`✅ Done.`);
                successCount++;
            }
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
        }
    }

    console.log('-----------------------------------');
    console.log(`🎉 Finished! Helper URL: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/[filename].webp`);
}

main();
