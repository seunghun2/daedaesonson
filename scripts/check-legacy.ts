import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function checkLegacy(id: string) {
    const { data } = await sb.from('Facility').select('name, pricing').eq('id', id).single();
    if (!data) return;
    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    console.log(`${data.name} (${id})\n`);
    const pt = pi.priceTable || {};
    Object.entries(pt).forEach(([tab, val]: [string, any]) => {
        const rows = val?.rows || [];
        if (rows.length === 0) return;
        console.log(`[${tab}]`);
        rows.forEach((r: any) => {
            console.log(`  ${r.name || '(없음)'} | ${r.grade || '-'} | ${(r.price ?? 0).toLocaleString()}원 | groupType:${r.groupType || '-'}`);
        });
    });
}

checkLegacy(process.argv[2] || 'park-0006');
