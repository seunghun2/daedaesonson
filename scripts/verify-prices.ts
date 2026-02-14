/**
 * 검증 스크립트: V1 priceTable vs V2 standardizedPrices 비교
 * 30개씩 시설 확인
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

async function verify() {
    const startId = parseInt(process.argv[2] || '1');
    const count = parseInt(process.argv[3] || '30');

    const ids: string[] = [];
    for (let i = startId; i < startId + count; i++) {
        ids.push('park-' + String(i).padStart(4, '0'));
    }

    const { data, error } = await supabase
        .from('Facility')
        .select('id, name, category, pricing')
        .in('id', ids);

    if (error) { console.error('DB 에러:', error); return; }

    console.log(`\n${'='.repeat(100)}`);
    console.log(`📋 V1/V2 비교 검증 (${startId} ~ ${startId + count - 1})`);
    console.log(`${'='.repeat(100)}\n`);

    let match = 0, mismatch = 0, noData = 0, noV2 = 0;
    const issues: string[] = [];

    const sorted = data!.sort((a, b) => a.id.localeCompare(b.id));

    for (const f of sorted) {
        let pricing: any;
        try {
            pricing = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
        } catch { continue; }

        if (!pricing) { noData++; continue; }

        const pt = pricing.priceTable || {};
        const sp: any[] = pricing.standardizedPrices || [];

        // V1: rows가 있는 카테고리만
        const v1Active = Object.entries(pt)
            .filter(([k, v]: [string, any]) => v?.rows?.length > 0 && k !== '제외됨' && k !== '기타')
            .map(([k, v]: [string, any]) => ({
                key: k,
                serviceType: SERVICE_TYPE_MAP[k] || 'OTHER',
                rowCount: v.rows.length,
                totalPrice: v.rows.reduce((s: number, r: any) => s + (r.price || 0), 0),
            }));

        if (sp.length === 0 && v1Active.length > 0) {
            noV2++;
            console.log(`⚠️  [${f.id}] ${f.name} — V1에 ${v1Active.length}개 카테고리 있지만 V2 없음!`);
            issues.push(`${f.id}: V2 누락`);
            continue;
        }

        if (v1Active.length === 0 && sp.length === 0) {
            noData++;
            continue;
        }

        // V2 그룹별 정보
        const v2Groups = sp.map((g: any) => ({
            serviceType: g.serviceType,
            subType: g.subType,
            rowCount: g.rows.length,
            totalPrice: g.rows.reduce((s: number, r: any) => s + (r.price || 0), 0),
        }));

        // 비교: V1 카테고리 수 == V2 그룹 수, 각 항목 수 일치
        let isMatch = v1Active.length === v2Groups.length;

        // 각 V1 카테고리에 대응하는 V2 그룹이 있는지
        for (const v1 of v1Active) {
            const v2Match = v2Groups.find(g => g.subType === v1.key);
            if (!v2Match) {
                isMatch = false;
                issues.push(`${f.id}: V1 "${v1.key}" → V2에 없음`);
            } else if (v2Match.rowCount !== v1.rowCount) {
                isMatch = false;
                issues.push(`${f.id}: "${v1.key}" 행 수 불일치 V1=${v1.rowCount} V2=${v2Match.rowCount}`);
            }
        }

        if (isMatch) {
            match++;
            const types = v2Groups.map(g => `${g.serviceType}/${g.subType}(${g.rowCount})`).join(', ');
            console.log(`✅ [${f.id}] ${(f.name || '').padEnd(20)} ${types}`);
        } else {
            mismatch++;
            console.log(`❌ [${f.id}] ${f.name}`);
            console.log(`   V1: ${v1Active.map(v => `${v.key}(${v.rowCount})`).join(', ')}`);
            console.log(`   V2: ${v2Groups.map(g => `${g.serviceType}/${g.subType}(${g.rowCount})`).join(', ')}`);
        }
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log('📊 검증 결과');
    console.log(`${'='.repeat(100)}`);
    console.log(`  ✅ 완전 일치: ${match}개`);
    console.log(`  ❌ 불일치: ${mismatch}개`);
    console.log(`  ⚠️  V2 누락: ${noV2}개`);
    console.log(`  ⏭️  데이터 없음: ${noData}개`);

    if (issues.length > 0) {
        console.log(`\n🔍 문제 상세:`);
        issues.forEach(i => console.log(`  - ${i}`));
    }

    console.log(`\n💡 다음 30개 확인: npx tsx scripts/verify-prices.ts ${startId + count} 30`);
}

verify().catch(console.error);
