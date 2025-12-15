const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

// NOTE: Ideally use process.env but for this specific cleanup task we use the known key.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('Starting cleanup of FUNERAL_HOME...');

    // Check if category works with 'FUNERAL_HOME'
    // First count
    const { count, error: countError } = await supabase
        .from('Facility')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'FUNERAL_HOME');

    if (countError) {
        console.error('Count error:', countError);
        // Retry with Korean label just in case data is messy
        console.log("Retrying with '장례식장'...");
        const { count: kCount, error: kError } = await supabase
            .from('Facility')
            .select('*', { count: 'exact', head: true })
            .eq('category', '장례식장');

        if (kError) console.error('Count error (Korean):', kError);
        else console.log(`Found ${kCount} '장례식장' facilities.`);

        return;
    }
    console.log(`Found ${count} FUNERAL_HOME facilities.`);

    if (count > 0) {
        const { error } = await supabase
            .from('Facility')
            .delete()
            .eq('category', 'FUNERAL_HOME');

        if (error) {
            console.error('Delete error:', error);
        } else {
            console.log('Successfully deleted FUNERAL_HOME facilities.');
        }
    }

    // Also check Korean label '장례식장' just in case
    const { count: kCount } = await supabase
        .from('Facility')
        .select('*', { count: 'exact', head: true })
        .eq('category', '장례식장');

    if (kCount && kCount > 0) {
        console.log(`Found ${kCount} '장례식장' facilities. Deleting...`);
        const { error } = await supabase
            .from('Facility')
            .delete()
            .eq('category', '장례식장');

        if (error) {
            console.error('Delete error (Korean):', error);
        } else {
            console.log('Successfully deleted 장례식장 facilities.');
        }
    }
}

run();
