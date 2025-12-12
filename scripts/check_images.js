
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
    db: { schema: 'public' }
});

async function main() {
    const { data: data2 } = await supabase
        .from('Facility')
        .select('id, name, images')
        .ilike('name', '광릉 더 크레스트 묘지');

    console.log('Result for 광릉 더 크레스트 묘지:');
    data2.forEach(f => {
        let count = 0;
        try {
            const parsed = JSON.parse(f.images);
            if (Array.isArray(parsed)) count = parsed.length;
        } catch (e) { }
        console.log(`- ${f.name} (${f.id}): ${count} images`);
    });
}

main();
