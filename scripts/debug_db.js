const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

async function debug() {
    let from = 0;
    const PAGE_SIZE = 1000;
    let all = [];

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, isActive')
            .range(from, from + PAGE_SIZE - 1);

        console.log('Range ' + from + ' - ' + (from + PAGE_SIZE - 1) + ': ' + (data?.length || 0) + ' items');

        if (error) {
            console.log('Error:', error.message);
            break;
        }

        if (data) all.push(...data);

        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    console.log('\n총: ' + all.length + '개');
    const p1 = all.find(x => x.id === 'park-0001');
    console.log('park-0001 in result:', p1 ? 'Found, isActive=' + p1.isActive : 'NOT FOUND');
}
debug();
