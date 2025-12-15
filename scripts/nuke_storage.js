const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const BUCKET_NAME = 'facilities';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteAllFiles(prefix = '') {
    console.log(`🔥 Deleting files in: ${prefix || '(root)'}`);

    const { data: files, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(prefix, { limit: 1000 });

    if (error) {
        console.error('Error listing:', error.message);
        return;
    }

    if (!files || files.length === 0) {
        console.log('   No files found.');
        return;
    }

    console.log(`   Found ${files.length} items.`);

    // Separate folders and files
    const folders = files.filter(f => f.id === null); // Folders have no id
    const actualFiles = files.filter(f => f.id !== null);

    // Delete files first
    if (actualFiles.length > 0) {
        const filePaths = actualFiles.map(f => prefix ? `${prefix}/${f.name}` : f.name);
        const { error: removeError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(filePaths);

        if (removeError) {
            console.error('   Error removing files:', removeError.message);
        } else {
            console.log(`   ✅ Deleted ${actualFiles.length} files.`);
        }
    }

    // Recursively delete folders
    for (const folder of folders) {
        const folderPath = prefix ? `${prefix}/${folder.name}` : folder.name;
        await deleteAllFiles(folderPath);
    }
}

async function main() {
    console.log('🗑️  NUKING STORAGE: Deleting EVERYTHING in facilities bucket...');
    await deleteAllFiles('');
    console.log('✅  STORAGE NUKED!');
}

main();
