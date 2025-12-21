const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

async function compare() {
    // 로컬 JSON
    const json = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));
    console.log('로컬 JSON:', json.length, '개');

    // Supabase - 전체 개수
    const { count } = await supabase.from('Facility').select('*', { count: 'exact', head: true });
    console.log('Supabase DB:', count, '개');

    // DB에서 모든 ID 가져오기
    let allDbIds = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data } = await supabase.from('Facility').select('id').range(from, from + PAGE_SIZE - 1);
        if (data) allDbIds.push(...data.map(d => d.id));
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    const dbIdSet = new Set(allDbIds);

    // 누락 확인
    const missingInDb = json.filter(f => !dbIdSet.has(f.id));
    console.log('DB에 없는 시설:', missingInDb.length, '개');

    if (missingInDb.length > 0 && missingInDb.length <= 20) {
        missingInDb.forEach(f => console.log('  -', f.id, f.name));
    }
}
compare();
