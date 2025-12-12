const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'; // Hardcoded for speed
const BUCKET_NAME = 'facilities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function main() {
    console.log('🗑️  STARTING CLEANUP: Deleting ALL images from Storage and DB...');

    // 1. Delete Files from Storage
    console.log('   Storage: Listing files...');
    let totalDeleted = 0;

    // We need to list recursively.
    // Supabase list limit is usually 100. Need loop.
    let keepDeleting = true;

    while (keepDeleting) {
        const { data: files, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('facilities', { limit: 100, offset: 0 }); // Assuming 'facilities' root folder. Wait, our files are in 'facilities/UUID/...'. 
        // List at root? 

        // Actually, listing root might return folders.
        // Let's list empty string '' to get top level folders?
        // Recursive delete is hard via API.
        // But we can try `emptyBucket` logic if Supabase supports it? No.

        // Strategy: Delete facilities folder itself?
        // Or fetch DB IDs and delete folder facilities/{ID}?

        // Better: Reset DB first, then Iterate DB to delete folders.
        // Or just list ALL files flatly? Not possible easily.

        // Let's try to list top level folder 'facilities'.
        // If we can delete the folder 'facilities', that deletes everything inside?
        // Usually object storage requires deleting objects.

        // Let's try iterating from DB. That's safer.
        break;
    }

    // Changing Strategy to maintain robustness:
    // 1. Clear DB columns first (Fast).
    // 2. Iterate DB to find expected paths and delete folders.

    console.log('   DB: Clearing "images" column for ALL facilities...');
    const { error: dbError } = await supabase
        .from('Facility')
        .update({ images: [] })
        .neq('id', 'placeholder'); // Update all

    if (dbError) {
        console.error('   ❌ DB Update Error:', dbError.message);
    } else {
        console.log('   ✅ DB "images" column cleared.');
    }

    // 3. Delete Storage Folders based on ID (Since we used ID-based paths)
    //    And also try to delete NAME based paths (old paths).
    console.log('   Storage: Deleting folders using Facility IDs...');

    const { data: facilities } = await supabase.from('Facility').select('id, name');

    // We will batch delete operations
    const MAX_CONCURRENT = 20;
    const chunks = [];
    for (let i = 0; i < facilities.length; i += MAX_CONCURRENT) {
        chunks.push(facilities.slice(i, i + MAX_CONCURRENT));
    }

    let deletedFolders = 0;

    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (f) => {
            // Try deleting ID-based folder
            const { data: list1 } = await supabase.storage.from(BUCKET_NAME).list(`facilities/${f.id}`);
            if (list1 && list1.length > 0) {
                const filesToRemove = list1.map(x => `facilities/${f.id}/${x.name}`);
                await supabase.storage.from(BUCKET_NAME).remove(filesToRemove);
            }

            // Try deleting Name-based folder (Old style: Number.Name)
            // It's hard to guess the exact number prefix.
            // But we can try listing 'facilities' root and matching.
        }));
        deletedFolders += chunk.length;
        if (deletedFolders % 100 === 0) process.stdout.write('.');
    }
    console.log('\n   Storage: ID-based folders cleared.');

    // 4. Clean up any remaining "Number.Name" folders
    console.log('   Storage: Cleaning up legacy "Number.Name" folders...');
    // List bucket root 'facilities/'
    // Since list is paginated, we loop.
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
        const { data: rootItems } = await supabase.storage.from(BUCKET_NAME).list('facilities', { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
        if (!rootItems || rootItems.length === 0) {
            hasMore = false;
        } else {
            // These are folders like '2000000169.물미묘원' or 'UUID'
            await Promise.all(rootItems.map(async (item) => {
                // List contents of this folder to delete files
                const { data: subFiles } = await supabase.storage.from(BUCKET_NAME).list(`facilities/${item.name}`);
                if (subFiles && subFiles.length > 0) {
                    const paths = subFiles.map(sf => `facilities/${item.name}/${sf.name}`);
                    await supabase.storage.from(BUCKET_NAME).remove(paths);
                }
                // Delete the folder itself? (Supabase/S3 removes empty folders automatically usually, but let's see)
            }));
            offset += 100;
            process.stdout.write('+');
        }
    }

    console.log('\n✅  CLEANUP FINISHED.');
}

main();
