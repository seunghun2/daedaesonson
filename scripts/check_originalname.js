
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
    console.log("Checking DB for originalName...");
    const { data, error } = await supabase
        .from('Facility')
        .select('id, name, originalName')
        .limit(10);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data sample:", JSON.stringify(data, null, 2));
    }
}

check();
