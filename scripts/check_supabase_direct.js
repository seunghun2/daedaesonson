const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

async function checkDatabase() {
    console.log('🔍 Supabase DB 직접 조회...\n');

    try {
        // 1. PriceCategory 조회
        const { data: categories, error: catError } = await supabase
            .from('PriceCategory')
            .select('*')
            .eq('facilityId', 'park-0001');

        if (catError) throw catError;

        console.log('📁 Categories:', categories.length);
        console.log(JSON.stringify(categories, null, 2));
        console.log();

        // 2. PriceItem 조회
        const { data: items, error: itemError } = await supabase
            .from('PriceItem')
            .select('*')
            .eq('facilityId', 'park-0001');

        if (itemError) throw itemError;

        console.log('📝 Items:', items.length);
        console.log(JSON.stringify(items, null, 2));

    } catch (error) {
        console.error('❌ 에러:', error);
    }
}

checkDatabase();
