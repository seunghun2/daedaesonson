require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' }); // Fallback

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // If available

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase environment variables');
    console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.log('Key:', supabaseKey ? 'Set' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log(`Connecting to ${supabaseUrl}...`);
    const start = Date.now();

    // Simple query: Count facilities
    const { count, error } = await supabase
        .from('Facility')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Connection Failed via HTTP:');
        console.error(error);
    } else {
        console.log('✅ Connection Successful via HTTP!');
        console.log(`Response time: ${Date.now() - start}ms`);
        console.log(`Facility Count: ${count}`);

        // Storage check (if direct DB failed, maybe storage is accessible?)
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
            console.log('⚠️ Storage access failed:', bucketError.message);
        } else {
            console.log(`📦 Storage Buckets found: ${buckets.length}`);
            buckets.forEach(b => console.log(` - ${b.name}`));
        }
    }
}

testConnection();
