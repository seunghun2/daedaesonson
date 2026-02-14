import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
    const { data, error } = await sb.from('facilities').select('*').eq('id', 'park-0001').single();
    if (error || !data) { console.log('Error:', error?.message); return; }

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    if (!pi) { console.log('No pricing data'); return; }

    console.log('시설명:', data.name);
    console.log('\n=== Legacy priceTable 탭 이름들 ===');
    console.log(Object.keys(pi.priceTable || {}));

    console.log('\n=== V2 standardizedPrices ===');
    if (pi.standardizedPrices && pi.standardizedPrices.length > 0) {
        pi.standardizedPrices.forEach((g: any) => {
            console.log(`${g.serviceType} / ${g.subType} -> ${g.rows?.length || 0}개 항목`);
            g.rows?.slice(0, 3).forEach((r: any) => console.log(`  - ${r.name}: ${r.price}`));
            if (g.rows?.length > 3) console.log(`  ... 외 ${g.rows.length - 3}개`);
        });
    } else {
        console.log('V2 데이터 없음!');
    }
}

main();
