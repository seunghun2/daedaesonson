/**
 * 전체 시설 V1/V2 검증 (DB 전체 조회)
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SERVICE_TYPE_MAP: Record<string, string> = {
    '매장묘': 'BURIAL', '단장형': 'BURIAL', '합장형': 'BURIAL',
    '쌍분형': 'BURIAL', '복합묘': 'BURIAL', '평장묘': 'BURIAL',
    '봉안당': 'BONGSAN', '봉안담': 'BONGSAN', '봉안묘': 'BONGSAN',
    '수목형': 'NATURAL', '잔디형': 'NATURAL', '화초형': 'NATURAL',
    '암석형': 'NATURAL', '가족형': 'NATURAL', '수목장': 'NATURAL',
};

async function verifyAll() {
    // 전체 시설 가져오기 (페이지네이션)
    let all: any[] = [];
    let from = 0;
    const pageSize = 500;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, category, pricing')
            .order('id')
            .range(from, from + pageSize - 1);

        if (error) { console.error('DB 에러:', error); return; }
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 전체 시설 V1/V2 검증 — 총 ${all.length}개`);
    console.log(`${'='.repeat(80)}\n`);

    let match = 0, mismatch = 0, noData = 0, noV2 = 0;
    const issues: string[] = [];

    for (const f of all) {
        let pricing: any;
        try {
            pricing = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
        } catch { continue; }

        if (!pricing) { noData++; continue; }

        const pt = pricing.priceTable || {};
        const sp: any[] = pricing.standardizedPrices || [];

        const v1Active = Object.entries(pt)
            .filter(([k, v]: [string, any]) => v?.rows?.length > 0 && k !== '제외됨' && k !== '기타')
            .map(([k, v]: [string, any]) => ({ key: k, rowCount: (v as any).rows.length }));

        if (sp.length === 0 && v1Active.length > 0) {
            noV2++;
            issues.push(`${f.id} ${f.name}: V1에 ${v1Active.length}개 있지만 V2 없음`);
            continue;
        }

        if (v1Active.length === 0 && sp.length === 0) { noData++; continue; }

        let isMatch = v1Active.length === sp.length;
        for (const v1 of v1Active) {
            const v2 = sp.find((g: any) => g.subType === v1.key);
            if (!v2) { isMatch = false; issues.push(`${f.id}: V1 "${v1.key}" → V2에 없음`); }
            else if (v2.rows.length !== v1.rowCount) { isMatch = false; issues.push(`${f.id}: "${v1.key}" 행수 V1=${v1.rowCount} V2=${v2.rows.length}`); }
        }

        if (isMatch) match++;
        else { mismatch++; console.log(`❌ [${f.id}] ${f.name}`); }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 전체 검증 결과');
    console.log(`${'='.repeat(80)}`);
    console.log(`  📦 전체 시설: ${all.length}개`);
    console.log(`  ✅ 완전 일치: ${match}개`);
    console.log(`  ❌ 불일치: ${mismatch}개`);
    console.log(`  ⚠️  V2 누락: ${noV2}개`);
    console.log(`  ⏭️  데이터 없음: ${noData}개`);

    if (issues.length > 0) {
        console.log(`\n🔍 문제 목록 (${issues.length}건):`);
        issues.forEach(i => console.log(`  - ${i}`));
    } else {
        console.log(`\n🎉 문제 없음! 전체 데이터 정합성 확인 완료!`);
    }
}

verifyAll().catch(console.error);
