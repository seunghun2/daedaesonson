#!/usr/bin/env node
/**
 * 🌟 자동 대표가격(★) 설정 스크립트
 * 
 * 각 시설의 priceTable을 분석하여, 카테고리별로 가장 적절한 대표항목에 ★를 설정합니다.
 * 
 * 대표항목 선정 로직:
 *   1순위: 이름에 "기본", "사용료", "표준" 등 기본형 키워드가 포함된 항목
 *   2순위: 카테고리별 일반적인 항목명 매칭 (봉안당→"1단/기본단", 매장묘→"사용료/단장", 수목장→"개인/1위")
 *   3순위: 가격이 있는 첫 번째 항목 (위에서부터)
 * 
 * 사용법: node scripts/auto_set_representative.js
 *   --dry-run  실제 업데이트 없이 결과만 출력
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

// 카테고리 그룹 정의
const CATEGORY_GROUPS = {
    '봉안당': {
        keywords: ['봉안', '납골', '안치'],
        // 대표항목 선호 이름 (순서대로 우선)
        preferredNames: [
            '기본단', '기본형', '1단', '기본', '표준', '일반',
            '개인단', '소형', '사용료',
        ],
    },
    '매장묘지': {
        keywords: ['매장', '평장', '단장', '합장', '쌍분', '묘지', '묘원', '분양', '복합'],
        preferredNames: [
            '사용료', '기본', '단장', '단장형', '평장', '1기', '표준',
            '매장', '대지', '기본형',
        ],
    },
    '수목장': {
        keywords: ['수목', '자연', '잔디', '화초', '암석', '가족형'],
        preferredNames: [
            '개인', '1위', '기본', '기본형', '표준', '사용료',
            '개인형', '소형',
        ],
    },
};

// 제외 카테고리 패턴
const EXCLUDE_PATTERN = /옵션|관리비|기타|공통|제외|석물|비고|안내|별도|봉안벽/;

/**
 * 카테고리 키가 어느 그룹에 속하는지 판별
 */
function getCategoryGroup(catKey) {
    for (const [groupName, config] of Object.entries(CATEGORY_GROUPS)) {
        if (config.keywords.some(kw => catKey.includes(kw))) {
            return groupName;
        }
    }
    return null;
}

/**
 * 주어진 rows에서 가장 적절한 대표항목을 선택
 */
function pickBestRepresentative(rows, groupName) {
    if (!rows || rows.length === 0) return null;

    // 가격이 있는 항목만 필터
    const validRows = rows.filter(r => {
        const price = Number(r.price);
        return !isNaN(price) && price > 0;
    });

    if (validRows.length === 0) return null;

    const config = CATEGORY_GROUPS[groupName];
    if (!config) return validRows[0]; // 그룹 설정 없으면 첫 번째 항목

    // 1순위: preferredNames 매칭 (순서 우선)
    for (const preferred of config.preferredNames) {
        const match = validRows.find(r => {
            const name = (r.name || r.item || '').toString().trim();
            return name.includes(preferred);
        });
        if (match) return match;
    }

    // 2순위: "기본", "표준", "일반" 등 범용 키워드
    const genericKeywords = ['기본', '표준', '일반', '사용료'];
    for (const kw of genericKeywords) {
        const match = validRows.find(r => {
            const name = (r.name || r.item || '').toString().trim();
            return name.includes(kw);
        });
        if (match) return match;
    }

    // 3순위: 가격이 중간값에 가까운 항목 (극단값 회피)
    const sorted = [...validRows].sort((a, b) => Number(a.price) - Number(b.price));
    if (sorted.length <= 2) return sorted[0]; // 2개 이하면 최저가
    const midIdx = Math.floor(sorted.length / 2);
    // 중간값보다 낮은 쪽에서 선택 (합리적 대표가격)
    return sorted[Math.max(0, midIdx - 1)];
}

async function main() {
    console.log(`🌟 대표가격(★) 자동 설정 스크립트 ${DRY_RUN ? '[DRY-RUN]' : ''}`);
    console.log('');

    // 1. 전체 시설 가져오기
    const PAGE_SIZE = 1000;
    let allFacilities = [];
    let page = 0;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('id, name, category, pricing')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order('id');

        if (error) { console.error('❌', error.message); process.exit(1); }
        if (!data || data.length === 0) break;
        allFacilities = allFacilities.concat(data);
        page++;
        if (data.length < PAGE_SIZE) break;
    }

    console.log(`📊 총 ${allFacilities.length}개 시설 로드됨\n`);

    let totalUpdated = 0;
    let totalStarsAdded = 0;
    let alreadyHasStar = 0;
    let noPriceTable = 0;

    for (const facility of allFacilities) {
        let pricing = facility.pricing;
        if (!pricing) { noPriceTable++; continue; }
        if (typeof pricing === 'string') {
            try { pricing = JSON.parse(pricing); } catch { noPriceTable++; continue; }
        }

        const pt = pricing.priceTable || pricing;
        if (!pt || typeof pt !== 'object') { noPriceTable++; continue; }

        let modified = false;
        let starsForThisFacility = [];

        // 각 카테고리 그룹별로 ★ 확인/설정
        const groupsProcessed = new Set();

        for (const [catKey, catData] of Object.entries(pt)) {
            if (EXCLUDE_PATTERN.test(catKey)) continue;
            if (!catData || !Array.isArray(catData.rows)) continue;

            const group = getCategoryGroup(catKey);
            if (!group) continue;

            // 이 그룹에서 이미 ★가 있는지 확인 (다른 catKey에서 설정됐을 수도)
            if (groupsProcessed.has(group)) continue;

            // 이 그룹의 모든 카테고리에서 ★ 확인
            let existingRepInGroup = false;
            for (const [ck, cd] of Object.entries(pt)) {
                if (EXCLUDE_PATTERN.test(ck)) continue;
                if (getCategoryGroup(ck) !== group) continue;
                if (cd && Array.isArray(cd.rows)) {
                    const hasRep = cd.rows.some(r => r.isRepresentative && Number(r.price) > 0);
                    if (hasRep) {
                        existingRepInGroup = true;
                        break;
                    }
                }
            }

            if (existingRepInGroup) {
                alreadyHasStar++;
                groupsProcessed.add(group);
                continue;
            }

            // 이 그룹의 모든 카테고리 rows를 모아서 최적 항목 선택
            let allGroupRows = [];
            let allGroupCatKeys = [];
            for (const [ck, cd] of Object.entries(pt)) {
                if (EXCLUDE_PATTERN.test(ck)) continue;
                if (getCategoryGroup(ck) !== group) continue;
                if (cd && Array.isArray(cd.rows)) {
                    for (const row of cd.rows) {
                        allGroupRows.push({ ...row, __catKey: ck });
                    }
                    allGroupCatKeys.push(ck);
                }
            }

            const bestRow = pickBestRepresentative(allGroupRows, group);
            if (bestRow) {
                // 실제 priceTable에서 해당 row를 찾아 isRepresentative 설정
                const targetCatKey = bestRow.__catKey;
                const targetRows = pt[targetCatKey].rows;
                const targetIdx = targetRows.findIndex(r =>
                    (r.name || r.item) === (bestRow.name || bestRow.item) &&
                    Number(r.price) === Number(bestRow.price)
                );

                if (targetIdx >= 0) {
                    targetRows[targetIdx].isRepresentative = true;
                    modified = true;
                    totalStarsAdded++;
                    const price = Number(bestRow.price);
                    const displayPrice = price < 10000 ? `${price}만원` : `${Math.round(price / 10000).toLocaleString()}만원`;
                    starsForThisFacility.push(`${group}→[${targetCatKey}] "${bestRow.name || bestRow.item}" ${displayPrice}`);
                }
            }

            groupsProcessed.add(group);
        }

        if (modified) {
            console.log(`✅ ${facility.id} (${facility.name})`);
            starsForThisFacility.forEach(s => console.log(`   ★ ${s}`));

            if (!DRY_RUN) {
                // pricing 객체에 priceTable 업데이트
                const updatedPricing = typeof facility.pricing === 'string'
                    ? JSON.parse(facility.pricing)
                    : { ...facility.pricing };
                updatedPricing.priceTable = pt;

                const { error } = await supabase
                    .from('Facility')
                    .update({ pricing: updatedPricing })
                    .eq('id', facility.id);

                if (error) {
                    console.log(`   ❌ 업데이트 실패: ${error.message}`);
                } else {
                    totalUpdated++;
                }
            } else {
                totalUpdated++;
            }
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 결과 요약 ${DRY_RUN ? '[DRY-RUN]' : ''}`);
    console.log(`   총 시설: ${allFacilities.length}개`);
    console.log(`   priceTable 없음: ${noPriceTable}개`);
    console.log(`   이미 ★ 있음: ${alreadyHasStar}개 그룹`);
    console.log(`   새 ★ 추가: ${totalStarsAdded}개`);
    console.log(`   업데이트된 시설: ${totalUpdated}개`);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
