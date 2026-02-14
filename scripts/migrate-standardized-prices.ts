/**
 * 마이그레이션 스크립트: 레거시 priceTable → standardizedPrices 변환
 * 
 * 사용법: npx tsx scripts/migrate-standardized-prices.ts
 * 
 * - Supabase에서 모든 시설의 pricing JSON을 읽음
 * - priceTable 카테고리를 serviceType(BURIAL/BONGSAN/NATURAL)으로 매핑
 * - standardizedPrices 배열을 pricing JSON에 추가
 * - 하나씩 업데이트 (dry-run 모드 지원)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env + .env.local 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ========== 매핑 테이블 ==========
const SERVICE_TYPE_MAP: Record<string, string> = {
    '매장묘': 'BURIAL', '단장형': 'BURIAL', '합장형': 'BURIAL',
    '쌍분형': 'BURIAL', '복합묘': 'BURIAL', '평장묘': 'BURIAL',
    '봉안당': 'BONGSAN', '봉안담': 'BONGSAN', '봉안묘': 'BONGSAN',
    '수목형': 'NATURAL', '잔디형': 'NATURAL', '화초형': 'NATURAL',
    '암석형': 'NATURAL', '가족형': 'NATURAL', '수목장': 'NATURAL',
};

// ========== 변환 함수 ==========
function transformToStandardized(priceTable: Record<string, any>) {
    const groups: any[] = [];

    for (const [categoryName, categoryData] of Object.entries(priceTable)) {
        const rows = categoryData?.rows;
        if (!rows || rows.length === 0) continue;
        if (categoryName === '제외됨' || categoryName === '기타') continue;

        const serviceType = SERVICE_TYPE_MAP[categoryName] || 'OTHER';
        groups.push({
            serviceType,
            subType: categoryName,
            unit: categoryData.unit || '원',
            rows: rows.map((r: any) => ({
                name: r.name || categoryName,
                price: r.price || 0,
                feeType: r.feeType || 'USAGE',
                grade: r.grade || '',
                note: r.note || '',
                isRepresentative: r.isRepresentative || false,
                ...(r.area && { area: r.area }),
                ...(r.areaUnit && { areaUnit: r.areaUnit }),
                ...(r.duration && { duration: r.duration }),
                ...(r.durationType && { durationType: r.durationType }),
                ...(r.capacity && { capacity: r.capacity }),
                ...(r.residency && { residency: r.residency }),
                ...(r.groupType && { groupType: r.groupType }),
                ...(r.paymentCycle && { paymentCycle: r.paymentCycle }),
                ...(r.taxIncluded !== undefined && { taxIncluded: r.taxIncluded }),
            })),
        });
    }

    return groups;
}

// ========== 메인 ==========
async function main() {
    const DRY_RUN = process.argv.includes('--dry-run');

    console.log('='.repeat(60));
    console.log(`🔄 standardizedPrices 마이그레이션 ${DRY_RUN ? '(DRY RUN)' : ''}`);
    console.log('='.repeat(60));

    // 모든 시설의 pricing 데이터 가져오기 (페이지네이션)
    let facilities: any[] = [];
    let from = 0;
    const pageSize = 500;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, category, pricing')
            .order('id')
            .range(from, from + pageSize - 1);

        if (error) {
            console.error('❌ 시설 목록 로드 실패:', error);
            process.exit(1);
        }
        if (!data || data.length === 0) break;
        facilities = facilities.concat(data);
        console.log(`  📥 ${from + 1}~${from + data.length}번째 로드 완료`);
        if (data.length < pageSize) break;
        from += pageSize;
    }

    console.log(`📋 총 ${facilities.length}개 시설\n`);

    let updated = 0;
    let skipped = 0;
    let alreadyDone = 0;
    let noPricing = 0;
    let errors = 0;

    for (const facility of facilities) {
        const label = `[${facility.id}] ${facility.name}`;

        // pricing이 없는 시설
        if (!facility.pricing) {
            noPricing++;
            continue;
        }

        // pricing 파싱
        let pricing: any;
        try {
            pricing = typeof facility.pricing === 'string'
                ? JSON.parse(facility.pricing)
                : facility.pricing;
        } catch {
            console.log(`  ⚠️ ${label} — JSON 파싱 실패`);
            errors++;
            continue;
        }

        // 이미 standardizedPrices가 있으면 스킵
        if (pricing.standardizedPrices && pricing.standardizedPrices.length > 0) {
            alreadyDone++;
            continue;
        }

        // priceTable 찾기
        const priceTable = pricing.priceTable || pricing;
        if (!priceTable || typeof priceTable !== 'object') {
            skipped++;
            continue;
        }

        // 변환
        const standardized = transformToStandardized(priceTable);
        if (standardized.length === 0) {
            skipped++;
            continue;
        }

        // 새 pricing 객체 (priceTable 유지 + standardizedPrices 추가)
        const newPricing = {
            ...pricing,
            priceTable: pricing.priceTable || priceTable,
            standardizedPrices: standardized,
        };

        const totalRows = standardized.reduce((sum: number, g: any) => sum + g.rows.length, 0);
        console.log(`✅ ${label} — ${standardized.length}그룹, ${totalRows}항목`);
        standardized.forEach((g: any) => {
            console.log(`     ${g.serviceType} / ${g.subType} (${g.rows.length}개)`);
        });

        if (!DRY_RUN) {
            const { error: updateError } = await supabase
                .from('Facility')
                .update({ pricing: newPricing })
                .eq('id', facility.id);

            if (updateError) {
                console.log(`  ❌ 업데이트 실패: ${updateError.message}`);
                errors++;
                continue;
            }
        }

        updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 결과 요약');
    console.log('='.repeat(60));
    console.log(`  ✅ 변환 완료: ${updated}개`);
    console.log(`  ⏭️ 이미 완료: ${alreadyDone}개`);
    console.log(`  ⏭️ 가격 없음: ${noPricing}개`);
    console.log(`  ⏭️ 빈 데이터: ${skipped}개`);
    console.log(`  ❌ 에러: ${errors}개`);
    if (DRY_RUN) {
        console.log('\n💡 실제 적용하려면 --dry-run 없이 실행하세요.');
    }
}

main().catch(console.error);
