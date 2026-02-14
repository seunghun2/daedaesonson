import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function fix(id: string) {
    const { data } = await sb.from('Facility').select('*').eq('id', id).single();
    if (!data) return;
    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    const sp = pi.standardizedPrices;
    const changes: string[] = [];

    if (id === 'park-0003') {
        // 매장묘 사용료: area 1평 추가
        const burial = sp.find((g: any) => g.serviceType === 'BURIAL' && g.subType === '매장묘');
        if (burial) {
            const usage = burial.rows.find((r: any) => r.name === '묘지 사용료');
            if (usage && !usage.area) { usage.area = 1; usage.areaUnit = 'PYEONG'; usage.grade = '1평 기준'; changes.push('매장묘 사용료: area 1평 추가'); }
        }
        // 봉안묘: grade "봉안묘" → "부부 봉안묘"  
        const bongsan = sp.find((g: any) => g.subType === '봉안묘');
        if (bongsan) {
            const row = bongsan.rows.find((r: any) => r.grade === '봉안묘');
            if (row) { row.grade = '부부 봉안묘'; changes.push('봉안묘: grade "봉안묘" → "부부 봉안묘"'); }
        }
    }

    if (changes.length > 0) {
        console.log(`✏️ ${id} 수정 ${changes.length}건:`);
        changes.forEach(c => console.log(`  - ${c}`));
        pi.standardizedPrices = sp;
        const { error } = await sb.from('Facility').update({ pricing: pi }).eq('id', id);
        console.log(error ? `❌ 실패` : `✅ 저장 완료`);
    } else {
        console.log(`✅ ${id} 수정 없음`);
    }
}

fix(process.argv[2] || 'park-0003');
