const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🔥 FORCE CLEARING ALL IMAGES...');

    // Get all facilities
    const { data: facilities, error } = await supabase
        .from('Facility')
        .select('id, name');

    if (error) {
        console.error('Error fetching facilities:', error);
        return;
    }

    console.log(`Found ${facilities.length} facilities to process.`);

    let processed = 0;
    let success = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the server
    const BATCH_SIZE = 50;

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (facility) => {
            try {
                const { error: updateError } = await supabase
                    .from('Facility')
                    .update({ images: '[]' })
                    .eq('id', facility.id);

                if (updateError) {
                    console.error(`Failed for ${facility.name}:`, updateError.message);
                    failed++;
                } else {
                    success++;
                }
            } catch (e) {
                console.error(`Error processing ${facility.name}:`, e.message);
                failed++;
            }
            processed++;
        }));

        // Progress indicator
        if (processed % 100 === 0) {
            process.stdout.write(`.`);
        }
    }

    console.log('\n✅ DONE!');
    console.log(`Processed: ${processed}`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
}

main();
