#!/usr/bin/env node
/**
 * 🔄 DB representativePrice 일괄 업데이트
 * priceTable(pricing JSON)에서 대표가격(★)을 찾아 representativePrice 컬럼을 업데이트합니다.
 * 이렇게 하면 마커 가격이 priceTable과 항상 일치합니다.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 환경변수 누락');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizePrice(p) {
    if (!p || p <= 0) return 0;
    return p < 10000 ? p * 10000 : p;
}

async function main() {
    console.log('🔄 DB에서 시설 데이터 로드...');

    // 모든 시설의 pricing JSON과 representativePrice 컬럼 가져오기
    const PAGE_SIZE = 1000;
    let allData = [];
    let page = 0;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, category, pricing, representativePrice, minPrice')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order('id');

        if (error) { console.error('❌', error.message); process.exit(1); }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        page++;
        if (data.length < PAGE_SIZE) break;
    }

    console.log(`✅ ${allData.length}개 시설 로드됨`);

    let updateCount = 0;
    let skipCount = 0;
    const updates = [];

    for (const f of allData) {
        // pricing JSON 파싱
        let priceInfo = null;
        if (f.pricing) {
            try {
                priceInfo = typeof f.pricing === 'string' ? JSON.parse(f.pricing) : f.pricing;
            } catch (e) { continue; }
        }

        const pt = priceInfo?.priceTable;
        if (!pt || typeof pt !== 'object') {
            skipCount++;
            continue;
        }

        // priceTable에서 대표가격 계산
        const categoryKeywords = {
            'FAMILY_GRAVE': ['매장', '묘지', '분양', '평장', '단장', '합장'],
            'CHARNEL_HOUSE': ['봉안', '납골', '안치'],
            'NATURAL_BURIAL': ['수목', '자연', '잔디', '화초'],
        };
        const preferredKeywords = categoryKeywords[f.category] || [];

        let repPrice = 0;

        // 1순위: 카테고리 매칭 + isRepresentative
        for (const [catKey, cat] of Object.entries(pt)) {
            if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(catKey)) continue;
            const isMatching = preferredKeywords.some(kw => catKey.includes(kw));
            if (!isMatching) continue;

            if (cat && Array.isArray(cat.rows)) {
                const rep = cat.rows.find(r => r.isRepresentative && r.price > 0);
                if (rep) {
                    repPrice = normalizePrice(rep.price);
                    break;
                }
            }
        }

        // 2순위: 전체에서 첫 번째 isRepresentative
        if (repPrice === 0) {
            for (const [catKey, cat] of Object.entries(pt)) {
                if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(catKey)) continue;
                if (cat && Array.isArray(cat.rows)) {
                    const rep = cat.rows.find(r => r.isRepresentative && r.price > 0);
                    if (rep) {
                        repPrice = normalizePrice(rep.price);
                        break;
                    }
                }
            }
        }

        const currentRepPrice = normalizePrice(f.representativePrice || 0);

        if (repPrice !== currentRepPrice) {
            updates.push({ id: f.id, representativePrice: repPrice, minPrice: repPrice || normalizePrice(f.minPrice || 0) });
            updateCount++;
        }
    }

    console.log(`\n📊 분석 결과:`);
    console.log(`   priceTable 없음 (스킵): ${skipCount}개`);
    console.log(`   업데이트 필요: ${updateCount}개`);

    if (updates.length === 0) {
        console.log('✅ 모든 시설의 representativePrice가 최신입니다.');
        return;
    }

    // 배치 업데이트
    console.log(`\n🔄 ${updates.length}개 시설 업데이트 중...`);

    const BATCH_SIZE = 20;
    let successCount = 0;
    for (let i = 0; i < updates.length; i++) {
        const u = updates[i];
        const { error } = await supabase
            .from('Facility')
            .update({ representativePrice: u.representativePrice, minPrice: u.minPrice })
            .eq('id', u.id);

        if (error) {
            console.error(`  ❌ ${u.id}: ${error.message}`);
        } else {
            successCount++;
        }
        if ((i + 1) % 20 === 0) process.stdout.write(`  ${i + 1}/${updates.length}\r`);
    }

    console.log(`\n✅ DB representativePrice 업데이트 완료!`);
    console.log(`   ${updateCount}개 시설 업데이트됨`);
}

main().catch(e => {
    console.error('❌', e);
    process.exit(1);
});
