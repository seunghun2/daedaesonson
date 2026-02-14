import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function reviewFacility(id: string) {
    const { data, error } = await sb.from('Facility').select('*').eq('id', id).single();
    if (error || !data) { console.log(`Error fetching ${id}:`, error?.message); return null; }

    const pi = typeof data.pricing === 'string' ? JSON.parse(data.pricing) : data.pricing;
    if (!pi) { console.log(`No pricing for ${id}`); return null; }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`시설: ${data.name} (${id})`);
    console.log(`카테고리: ${data.category}`);
    console.log(`주소: ${data.address}`);
    console.log(`${'='.repeat(60)}`);

    // Legacy data summary
    const legacy = pi.priceTable || {};
    const legacyTabs = Object.keys(legacy);
    console.log(`\n📋 레거시 탭: ${legacyTabs.join(', ')}`);
    legacyTabs.forEach(tab => {
        const rows = legacy[tab]?.rows || [];
        console.log(`  [${tab}] ${rows.length}개 항목`);
        rows.forEach((r: any) => {
            const issues: string[] = [];
            if (r.price === 0) issues.push('⚠️ 0원');
            if (!r.name) issues.push('⚠️ 이름없음');
            console.log(`    - ${r.name || '(없음)'} | ${r.grade || '-'} | ${r.price?.toLocaleString()}원 | groupType: ${r.groupType || '-'} ${issues.length ? issues.join(' ') : ''}`);
        });
    });

    // V2 data summary
    const v2 = pi.standardizedPrices || [];
    console.log(`\n📊 V2 standardizedPrices: ${v2.length}개 그룹`);
    const issues: any[] = [];

    v2.forEach((g: any, gi: number) => {
        console.log(`\n  [${g.serviceType} / ${g.subType}] ${g.rows?.length || 0}개 항목`);

        // Group by groupType
        const byGroup: Record<string, any[]> = {};
        (g.rows || []).forEach((r: any) => {
            const gt = r.groupType || '기본';
            if (!byGroup[gt]) byGroup[gt] = [];
            byGroup[gt].push(r);
        });

        Object.entries(byGroup).forEach(([gt, rows]) => {
            console.log(`    📁 ${gt} (${rows.length}개)`);
            rows.forEach((r: any, ri: number) => {
                const rowIssues: string[] = [];

                // Issue checks
                if (r.price === 0) rowIssues.push('🔴 0원');
                if (!r.name?.trim()) rowIssues.push('🔴 이름없음');
                if (!r.feeType) rowIssues.push('🟡 비용유형 미설정');
                if (r.residency && r.residency !== 'ALL' && !/관내|관외|시민|군민/.test(r.name || '')) {
                    // residency set but name doesn't reflect it - OK
                }
                if ((!r.residency || r.residency === 'ALL') && /관내|관외|시민|군민|구민|거주/.test(`${r.name} ${r.grade}`)) {
                    rowIssues.push('🟡 거주구분 미세팅');
                }
                if (!r.capacity && /단장|합장|개인|부부|가족|1인|2인/.test(r.grade || '')) {
                    rowIssues.push('🟡 인원구분 미세팅');
                }
                if (r.feeType === 'USAGE' && /관리비|관리료/.test(r.name || '')) {
                    rowIssues.push('🟡 관리비인데 USAGE로 설정됨');
                }
                if (r.feeType === 'MAINTENANCE' && !/관리/.test(r.name || '')) {
                    rowIssues.push('🟡 관리비가 아닌데 MAINTENANCE로 설정됨');
                }
                if (r.grade && /년/.test(r.grade) && !r.duration) {
                    rowIssues.push('🟡 기간정보 미추출');
                }

                if (rowIssues.length > 0) {
                    issues.push({ groupIdx: gi, groupType: gt, name: r.name, grade: r.grade, price: r.price, issues: rowIssues });
                }

                const priceStr = r.price?.toLocaleString() || '0';
                const issueStr = rowIssues.length ? ` ${rowIssues.join(' ')}` : '';
                console.log(`      ${r.name || '(없음)'} | ${r.grade || '-'} | ${priceStr}원 | ${r.feeType || '-'} | 거주:${r.residency || '-'} | 인원:${r.capacity || '-'}${issueStr}`);
            });
        });
    });

    console.log(`\n${'─'.repeat(60)}`);
    if (issues.length > 0) {
        console.log(`⚠️ 총 ${issues.length}개 이슈 발견:`);
        issues.forEach(i => {
            console.log(`  - [${i.groupType}] ${i.name} (${i.price?.toLocaleString()}원): ${i.issues.join(', ')}`);
        });
    } else {
        console.log(`✅ 이슈 없음`);
    }

    return { data, pi, issues };
}

// park-0001부터 시작
reviewFacility('park-0001');
