const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

// Initialize Supabase (Service Key for Admin Access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

// Archives to scan
const ARCHIVE_DIRS = ['archive', 'archive2', 'archive3'];

async function main() {
    console.log('🚀 Starting Full Image Restoration...');

    // 1. Load all Facilities from DB (Paginated)
    console.log('Fetching Facilities from DB...');
    let facilities = [];
    let page = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
            console.error('Failed to fetch facilities:', error);
            // Break or retry?
            break;
        }
        if (!data || data.length === 0) break;

        facilities = facilities.concat(data);
        console.log(`  Fetched page ${page + 1}: ${data.length} items`);
        page++;
    }

    console.log(`Found total ${facilities.length} facilities in DB.`);

    // 2. Build Map of Facility Name -> Folder Path
    // Handle duplicates? Latest archive wins? Or merge?
    // User wants "restore", presumably from best source.
    const folderMap = new Map(); // Name -> { fullPath, photosPath }

    for (const dirName of ARCHIVE_DIRS) {
        const rootDir = path.join(process.cwd(), dirName);
        if (!fs.existsSync(rootDir)) continue;

        const entries = fs.readdirSync(rootDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Name format: "NUM.NAME" e.g. "1.(재)낙원추모공원"
                const match = entry.name.match(/^\d+\.(.+)$/);
                if (match) {
                    const rawName = match[1].trim(); // "(재)낙원추모공원"
                    // Normalize name? (Remove spaces for matching?)
                    const normName = rawName.replace(/\s+/g, '');

                    const fullPath = path.join(rootDir, entry.name);
                    const photosPath = path.join(fullPath, 'photos');

                    if (fs.existsSync(photosPath)) {
                        folderMap.set(normName, { rawName, fullPath, photosPath });
                    }
                }
            }
        }
    }
    console.log(`Found ${folderMap.size} local folders with photos.`);

    // 3. Match and Upload
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const facility of facilities) {
        if (!facility.name) continue;

        // DELETE Funeral Homes
        if (facility.name.includes('장례식장')) {
            console.log(`\n[${++processed}/${facilities.length}] 🗑️ DELETING Funeral Home: ${facility.name}`);
            const { error: delError } = await supabase.from('Facility').delete().eq('id', facility.id);
            if (delError) console.error('  Delete Failed:', delError.message);
            else console.log('  Deleted from DB.');
            continue;
        }

        const dbNormName = facility.name.replace(/\s+/g, '');
        const folderData = folderMap.get(dbNormName);

        if (folderData) {
            console.log(`\n[${++processed}/${facilities.length}] Replacing images for: ${facility.name}`);

            // Read photos
            let files = [];
            try {
                files = fs.readdirSync(folderData.photosPath)
                    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
            } catch (e) {
                console.log(`  Warning: Could not read photos dir: ${e.message}`);
                continue;
            }

            if (files.length === 0) {
                console.log('  No photos found in folder.');
                continue;
            }

            // Upload Logic
            const publicUrls = [];

            // Limit to top 10 photos to save time/space? Or All?
            // "1500개를? 너가 자동으로 넣어줘" -> Wants Full Restore.
            const uploadPromises = files.map(async (fileName) => {
                const filePath = path.join(folderData.photosPath, fileName);
                let fileBuffer = fs.readFileSync(filePath);

                // Resize if > 100KB
                if (fileBuffer.length > 100 * 1024) {
                    try {
                        fileBuffer = await sharp(fileBuffer)
                            .resize({ width: 1000, withoutEnlargement: true })
                            .jpeg({ quality: 60 })
                            .toBuffer();
                    } catch (e) {
                        console.error(`  Resize failed for ${fileName}:`, e.message);
                    }
                }

                // Construct standard path: facilities/{id}/{filename}
                // Use random suffix to avoid caching issues if re-uploading
                // But keeping clean name is nice.
                // Let's use: facilities/{id}/{clean_filename}
                const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
                const storagePath = `facilities/${facility.id}/${cleanFileName}`;

                try {
                    // Upload (Upsert true)
                    const { error: uploadError } = await supabase.storage
                        .from('facilities')
                        .upload(storagePath, fileBuffer, {
                            contentType: 'image/jpeg', // detection?
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    // Get Public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('facilities')
                        .getPublicUrl(storagePath);

                    return publicUrl;
                } catch (e) {
                    console.error(`  Upload failed for ${fileName}:`, e.message);
                    return null;
                }
            });

            // Run uploads in parallel
            const results = await Promise.all(uploadPromises);
            const validUrls = results.filter(u => u !== null);

            if (validUrls.length > 0) {
                // Update DB
                const { error: updateError } = await supabase
                    .from('Facility')
                    .update({ images: validUrls }) // Store array of URLs
                    .eq('id', facility.id);

                if (updateError) {
                    console.error('  DB Update Failed:', updateError.message);
                    errors++;
                } else {
                    console.log(`  ✅ Updated with ${validUrls.length} images.`);
                }
            }
        } else {
            // console.log(`  No local folder for: ${facility.name}`);
            skipped++;
        }
    }

    console.log('\n-----------------------------------');
    console.log(`Finished.`);
    console.log(`Processed: ${processed}`);
    console.log(`Skipped (No match/folder): ${skipped}`);
    console.log(`Errors: ${errors}`);
}

main();
