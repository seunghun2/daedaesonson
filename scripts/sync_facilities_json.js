#!/usr/bin/env node
/**
 * 🔄 facilities.json 동기화 스크립트
 * Supabase DB의 최신 데이터를 facilities.json에 반영합니다.
 * 
 * 사용법: node scripts/sync_facilities_json.js
 * 
 * 이 스크립트는:
 * 1. Supabase에서 모든 시설 데이터를 가져옵니다
 * 2. 기존 facilities.json의 데이터와 병합합니다 (DB에 없는 필드는 유지)
 * 3. representativePrice를 priceTable에서 재계산합니다
 * 4. facilities.json을 업데이트합니다
 */

const fs = require('fs');
const path = require('path');

// .env.local에서 환경변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FACILITIES_JSON_PATH = path.join(__dirname, '..', 'data', 'facilities.json');

function normalizePrice(p) {
    if (!p || p <= 0) return 0;
    return p < 10000 ? p * 10000 : p;
}

/**
 * priceTable에서 대표가격 계산
 */
function computeRepPriceFromTable(priceInfo, category) {
    const pt = priceInfo?.priceTable;
    if (!pt || typeof pt !== 'object') return 0;

    const categoryKeywords = {
        'FAMILY_GRAVE': ['매장', '묘지', '분양', '평장', '단장', '합장'],
        'CHARNEL_HOUSE': ['봉안', '납골', '안치'],
        'NATURAL_BURIAL': ['수목', '자연', '잔디', '화초'],
    };
    const preferredKeywords = categoryKeywords[category] || [];

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

    return repPrice;
}

async function main() {
    console.log('🔄 Supabase에서 시설 데이터 가져오는 중...');

    // 1. Supabase에서 모든 데이터 가져오기 (페이지네이션)
    const PAGE_SIZE = 1000;
    let allDbData = [];
    let page = 0;

    while (true) {
        const { data, error } = await supabase
            .from('Facility')
            .select('*')
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
            .order('id');

        if (error) {
            console.error('❌ Supabase 오류:', error.message);
            process.exit(1);
        }

        if (!data || data.length === 0) break;
        allDbData = allDbData.concat(data);
        page++;

        if (data.length < PAGE_SIZE) break;
    }

    console.log(`✅ DB에서 ${allDbData.length}개 시설 로드됨`);

    // 2. 기존 facilities.json 로드
    let existingData = [];
    try {
        const raw = fs.readFileSync(FACILITIES_JSON_PATH, 'utf-8');
        existingData = JSON.parse(raw);
        console.log(`📁 기존 facilities.json: ${existingData.length}개`);
    } catch (e) {
        console.log('📁 기존 facilities.json 없음, 새로 생성합니다.');
    }

    // 기존 데이터를 Map으로
    const existingMap = new Map();
    existingData.forEach(f => existingMap.set(f.id, f));

    // 3. DB 데이터로 업데이트
    let updated = 0;
    let priceChanged = 0;

    const mergedData = allDbData.map(db => {
        const existing = existingMap.get(db.id) || {};

        // pricing JSON 파싱
        let priceInfo = null;
        if (db.pricing) {
            try {
                priceInfo = typeof db.pricing === 'string' ? JSON.parse(db.pricing) : db.pricing;
            } catch (e) { }
        }

        // 이미지 파싱
        let images = [];
        if (db.images) {
            try {
                images = typeof db.images === 'string' ? JSON.parse(db.images) : db.images;
            } catch (e) { }
        }

        // representativePrice 계산
        let repPrice = normalizePrice(db.representativePrice || 0);
        if (repPrice === 0 && priceInfo) {
            repPrice = computeRepPriceFromTable(priceInfo, db.category);
        }

        const oldRepPrice = existing.representativePrice || 0;
        if (repPrice !== oldRepPrice && repPrice > 0) {
            priceChanged++;
        }

        if (existingMap.has(db.id)) updated++;

        return {
            // 기존 데이터 유지 (좌표, priceInfo 등 정밀 데이터)
            ...existing,
            // DB 메타데이터 업데이트 (좌표는 기존 JSON 유지! DB는 소수점 2자리로 반올림됨)
            id: db.id,
            name: db.name,
            address: db.address || existing.address || '',
            // 🔥 좌표: 기존 JSON의 정밀 좌표 우선 사용 (DB 좌표는 반올림됨)
            coordinates: existing.coordinates || { lat: db.lat || 0, lng: db.lng || 0 },
            lat: existing.lat || db.lat || 0,
            lng: existing.lng || db.lng || 0,
            category: db.category || 'OTHER',
            operatorType: db.operatorType,
            isPublic: db.isPublic ?? false,
            hasParking: db.hasParking ?? false,
            hasRestaurant: db.hasRestaurant ?? false,
            hasStore: db.hasStore ?? false,
            hasAccessibility: db.hasAccessibility ?? false,
            isActive: db.isActive ?? true,
            phone: db.phone || '',
            fax: db.fax || '',
            capacity: db.capacity,
            rating: db.rating || 0,
            reviewCount: db.reviewCount || 0,
            description: db.description || '',
            websiteUrl: db.websiteUrl || '',
            viewCount: db.viewCount || 0,
            lastUpdated: db.lastUpdated,
            updatedAt: db.updatedAt,
            originalName: db.originalName,
            thumbnail: db.thumbnail || '',
            images: images.length > 0 ? images : (existing.images || []),
            // 가격 (DB 최신값으로!)
            representativePrice: repPrice,
            minPrice: normalizePrice(db.minPrice || 0),
            maxPrice: normalizePrice(db.maxPrice || 0),
            priceRange: {
                min: normalizePrice(db.minPrice || 0),
                max: normalizePrice(db.maxPrice || 0),
            },
            // priceInfo (DB에서 파싱된 최신 JSON)
            priceInfo: priceInfo || existing.priceInfo,
        };
    });

    // 4. 저장
    const output = JSON.stringify(mergedData, null, 2);
    fs.writeFileSync(FACILITIES_JSON_PATH, output);

    console.log(`\n✅ facilities.json 동기화 완료!`);
    console.log(`   총 시설: ${mergedData.length}개`);
    console.log(`   업데이트: ${updated}개`);
    console.log(`   가격 변경: ${priceChanged}개`);
}

main().catch(e => {
    console.error('❌ 오류:', e);
    process.exit(1);
});
