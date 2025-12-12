const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function run() {
    console.log('--- Deleting Mock Facility from Supabase (V2) ---');

    // 1. Delete '수유 모의 시설'
    const { data: searchData } = await supabase
        .from('Facility')
        .select('id, name')
        .eq('name', '수유 모의 시설');

    if (searchData && searchData.length > 0) {
        console.log(`Found ${searchData.length} mock facilities. Deleting...`);
        const ids = searchData.map(f => f.id);

        const { error } = await supabase
            .from('Facility')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('Error deleting mock:', error);
        } else {
            console.log('Deleted mock facilities.');
        }
    } else {
        console.log('Mock facility not found in Supabase.');
    }

    // 2. Final Verify Count
    const { count } = await supabase.from('Facility').select('*', { count: 'exact', head: true });
    console.log(`Final Supabase Count: ${count}`);
}

run();
