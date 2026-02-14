import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

async function analyze() {
    // 전체 시설 로드 (페이지네이션)
    let allFacilities: any[] = [];
    let from = 0;
    const PAGE_SIZE = 500;
    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, category, pricing')
            .range(from, from + PAGE_SIZE - 1);
        if (error) { console.error(error); break; }
        if (data) allFacilities.push(...data);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    console.log(`\n📊 전체 ${allFacilities.length}개 시설 분석\n`);

    // 수집할 통계
    const stats = {
        // 봉안 / 자연장 / 매장 별 분석
        byServiceType: {} as Record<string, {
            names: Map<string, number>;       // 항목명
            grades: Map<string, number>;      // grade (설명)
            units: Map<string, number>;       // 단위
            feeTypes: Map<string, number>;    // 비용유형
            durations: Map<string, number>;   // 기간
            capacities: Map<string, number>;  // 인원 (개인/부부/가족)
            areas: Map<string, number>;       // 면적값
            areaUnits: Map<string, number>;   // 면적 단위
            residencies: Map<string, number>; // 관내/관외
            totalRows: number;
            facilityCount: number;
        }>,
        // grade 필드에서 기간 패턴 추출
        gradeDurationPatterns: Map<string, number>,
        // grade 필드에서 단위 패턴 추출
        gradeUnitPatterns: Map<string, number>,
        // grade 필드에서 면적 패턴 추출
        gradeAreaPatterns: Map<string, number>,
    };

    stats.gradeDurationPatterns = new Map();
    stats.gradeUnitPatterns = new Map();
    stats.gradeAreaPatterns = new Map();

    const initServiceStats = () => ({
        names: new Map<string, number>(),
        grades: new Map<string, number>(),
        units: new Map<string, number>(),
        feeTypes: new Map<string, number>(),
        durations: new Map<string, number>(),
        capacities: new Map<string, number>(),
        areas: new Map<string, number>(),
        areaUnits: new Map<string, number>(),
        residencies: new Map<string, number>(),
        totalRows: 0,
        facilityCount: 0,
    });

    let totalV2 = 0;

    for (const f of allFacilities) {
        if (!f.pricing) continue;

        let parsed: any;
        try {
            parsed = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
        } catch { continue; }

        const standardized = parsed?.standardizedPrices;
        if (!standardized || !Array.isArray(standardized)) continue;

        totalV2++;
        const seenTypes = new Set<string>();

        for (const group of standardized) {
            const st = group.serviceType || 'UNKNOWN';
            if (!stats.byServiceType[st]) {
                stats.byServiceType[st] = initServiceStats();
            }
            const s = stats.byServiceType[st];

            if (!seenTypes.has(st)) {
                s.facilityCount++;
                seenTypes.add(st);
            }

            // unit (그룹 레벨)
            if (group.unit) s.units.set(group.unit, (s.units.get(group.unit) || 0) + 1);

            for (const row of group.rows || []) {
                s.totalRows++;

                // name
                const name = (row.name || '').trim();
                if (name) s.names.set(name, (s.names.get(name) || 0) + 1);

                // grade (설명)
                const grade = (row.grade || '').trim();
                if (grade) {
                    s.grades.set(grade, (s.grades.get(grade) || 0) + 1);

                    // grade에서 기간 패턴 추출
                    const durationMatch = grade.match(/(\d+)\s*년/);
                    if (durationMatch) {
                        const pattern = `${durationMatch[1]}년`;
                        stats.gradeDurationPatterns.set(pattern, (stats.gradeDurationPatterns.get(pattern) || 0) + 1);
                    }
                    if (/영구|영안|무기한/.test(grade)) {
                        stats.gradeDurationPatterns.set('영구', (stats.gradeDurationPatterns.get('영구') || 0) + 1);
                    }

                    // grade에서 단위 패턴 추출
                    const unitMatch = grade.match(/(\d+)\s*(기|위|구|체)/);
                    if (unitMatch) {
                        const pattern = `${unitMatch[2]}`;
                        stats.gradeUnitPatterns.set(pattern, (stats.gradeUnitPatterns.get(pattern) || 0) + 1);
                    }

                    // grade에서 면적 패턴 추출
                    const areaMatch = grade.match(/([\d.]+)\s*(평|㎡|m²|m2)/);
                    if (areaMatch) {
                        stats.gradeAreaPatterns.set(areaMatch[2], (stats.gradeAreaPatterns.get(areaMatch[2]) || 0) + 1);
                    }
                }

                // feeType
                if (row.feeType) s.feeTypes.set(row.feeType, (s.feeTypes.get(row.feeType) || 0) + 1);

                // duration
                if (row.duration) {
                    const d = `${row.duration}${row.durationType || ''}`;
                    s.durations.set(d, (s.durations.get(d) || 0) + 1);
                }

                // capacity
                if (row.capacity) s.capacities.set(row.capacity, (s.capacities.get(row.capacity) || 0) + 1);

                // area
                if (row.area) {
                    const a = `${row.area}${row.areaUnit || ''}`;
                    s.areas.set(a, (s.areas.get(a) || 0) + 1);
                }
                if (row.areaUnit) s.areaUnits.set(row.areaUnit, (s.areaUnits.get(row.areaUnit) || 0) + 1);

                // residency
                if (row.residency) s.residencies.set(row.residency, (s.residencies.get(row.residency) || 0) + 1);
            }
        }
    }

    console.log(`✅ V2 데이터 있는 시설: ${totalV2}개\n`);

    // ===== 서비스 타입별 상세 출력 =====
    const sortedTop = (map: Map<string, number>, n = 30) =>
        [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

    for (const [type, s] of Object.entries(stats.byServiceType)) {
        const typeLabel = type === 'BONGSAN' ? '봉안' : type === 'NATURAL' ? '자연장' : type === 'BURIAL' ? '매장' : type;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📦 ${typeLabel} (${type})`);
        console.log(`   시설 수: ${s.facilityCount}개 | 행(row) 수: ${s.totalRows}개`);
        console.log('='.repeat(70));

        console.log(`\n  🏷️ 항목명 (name) TOP 30:`);
        for (const [name, cnt] of sortedTop(s.names)) {
            console.log(`    "${name}" → ${cnt}회`);
        }

        console.log(`\n  📝 설명 (grade) TOP 30:`);
        for (const [grade, cnt] of sortedTop(s.grades)) {
            console.log(`    "${grade}" → ${cnt}회`);
        }

        console.log(`\n  📏 단위 (unit):`);
        for (const [unit, cnt] of sortedTop(s.units)) {
            console.log(`    "${unit}" → ${cnt}회`);
        }

        console.log(`\n  💰 비용유형 (feeType):`);
        for (const [ft, cnt] of sortedTop(s.feeTypes)) {
            console.log(`    "${ft}" → ${cnt}회`);
        }

        console.log(`\n  ⏳ 기간 (duration):`);
        for (const [d, cnt] of sortedTop(s.durations)) {
            console.log(`    "${d}" → ${cnt}회`);
        }

        console.log(`\n  👥 인원 (capacity):`);
        for (const [c, cnt] of sortedTop(s.capacities)) {
            console.log(`    "${c}" → ${cnt}회`);
        }

        console.log(`\n  📐 면적 (area):`);
        for (const [a, cnt] of sortedTop(s.areas)) {
            console.log(`    "${a}" → ${cnt}회`);
        }

        console.log(`\n  📐 면적 단위 (areaUnit):`);
        for (const [au, cnt] of sortedTop(s.areaUnits)) {
            console.log(`    "${au}" → ${cnt}회`);
        }

        console.log(`\n  🏠 관내/관외 (residency):`);
        for (const [r, cnt] of sortedTop(s.residencies)) {
            console.log(`    "${r}" → ${cnt}회`);
        }
    }

    // ===== grade 필드에서 추출한 패턴 =====
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 grade 필드에서 추출한 주요 패턴`);
    console.log('='.repeat(70));

    console.log(`\n  ⏳ 기간 패턴:`);
    for (const [p, cnt] of sortedTop(stats.gradeDurationPatterns)) {
        console.log(`    "${p}" → ${cnt}회`);
    }

    console.log(`\n  📦 안치 단위 패턴:`);
    for (const [p, cnt] of sortedTop(stats.gradeUnitPatterns)) {
        console.log(`    "${p}" → ${cnt}회`);
    }

    console.log(`\n  📐 면적 단위 패턴:`);
    for (const [p, cnt] of sortedTop(stats.gradeAreaPatterns)) {
        console.log(`    "${p}" → ${cnt}회`);
    }
}

analyze().catch(console.error);
