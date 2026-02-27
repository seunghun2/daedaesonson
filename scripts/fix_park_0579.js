/**
 * 호정공원 3곳 — 공홈 hjcloud9.com 기준 전면 업데이트
 * 
 * park-0032: (재)호정공원(묘지) → 매장묘 + 매장작업비/장례용품/수리
 * park-0579: (재)호정공원(봉안) → 봉안묘(야외→BURIAL) + 봉안담(BONGSAN)
 * park-1207: (재)호정공원(자연장) → 수목장 + 화초·잔디장 (NATURAL)
 * 
 * 가이드 규칙 적용:
 * - 봉안묘(야외형) → BURIAL
 * - 봉안담(벽체형) → BONGSAN
 * - 복합단(4,5단 등) 개별 분리
 * - 봉안담 개인/부부 분리
 * - isRepresentative: 사용료 행에만
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return null; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
        return p;
    }

    // =============================================
    // 1. park-0032: (재)호정공원(묘지) — 매장묘
    // =============================================
    update('park-0032', p => {
        // priceTable 업데이트 — 공홈 기준
        p.priceInfo.priceTable = {
            '매장묘': {
                category: 'grave',
                unit: '원',
                rows: [
                    { name: '매장 1단', price: 18050000, isRepresentative: true, grade: '합장, 5평' },
                    { name: '매장 2단', price: 19550000, grade: '합장, 5평' },
                    { name: '매장 특', price: 22950000, grade: '합장, 5평' },
                    { name: '호정(B)', price: 24550000, grade: '합장, 5평' },
                    { name: '호정(A)', price: 15500000, grade: '단장, 3평' },
                ]
            },
        };

        // standardizedPrices — 공홈 기준으로 업데이트
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL',
                subType: '매장묘',
                unit: '원',
                rows: [
                    {
                        name: '매장 1단', price: 18050000, feeType: 'USAGE', grade: '합장, 5평, 30년 사용', isRepresentative: true,
                        note: '포함: 사용료 + 석물(묘테·비석). 1회 연장 가능'
                    },
                    { name: '매장 2단', price: 19550000, feeType: 'USAGE', grade: '합장, 5평, 30년 사용' },
                    { name: '매장 특', price: 22950000, feeType: 'USAGE', grade: '합장, 5평, 30년 사용' },
                    { name: '호정(B)', price: 24550000, feeType: 'USAGE', grade: '합장, 5평, 30년 사용' },
                    {
                        name: '호정(A)', price: 15500000, feeType: 'USAGE', grade: '단장, 3평, 30년 사용',
                        note: '포함: 사용료 + 석물(묘테·비석). 1회 연장 가능'
                    },
                    // 관리비 안내
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '5년 단위 선납, 별도 문의' },
                ]
            },
            {
                serviceType: 'BURIAL',
                subType: '매장 작업비',
                unit: '원',
                rows: [
                    { name: '시신 매장 안장비', price: 3000000, feeType: 'USAGE', grade: '시신 매장 시' },
                    { name: '유골 매장 안장비', price: 1500000, feeType: 'USAGE', grade: '유골 매장 시' },
                ]
            },
            {
                serviceType: 'BURIAL',
                subType: '장례용품 및 부대비용',
                unit: '원',
                rows: [
                    { name: '횡대 (매장용 목재 받침)', price: 100000, feeType: 'USAGE' },
                    { name: '화강석관', price: 500000, feeType: 'USAGE' },
                    { name: '화병 (묘지용 돌꽃병)', price: 100000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BURIAL',
                subType: '수리 및 기타',
                unit: '원',
                rows: [
                    { name: '분상보수 수리', price: 300000, feeType: 'USAGE' },
                    { name: '1단묘테 수리', price: 300000, feeType: 'USAGE' },
                    { name: '2단/특묘테 수리', price: 400000, feeType: 'USAGE' },
                    { name: '각자비 (대)', price: 130000, feeType: 'USAGE', grade: '자당' },
                    { name: '각자비 (중)', price: 8000, feeType: 'USAGE', grade: '자당' },
                    { name: '각자비 (소)', price: 2000, feeType: 'USAGE', grade: '자당' },
                ]
            },
        ];

        p.priceInfo.priceVerified = true;

        // 가격 범위 (매장묘 기준)
        p.minPrice = 15500000;
        p.maxPrice = 24550000;
        p.representativePrice = 18050000; // 매장 1단 ★
        if (p.priceRange) {
            p.priceRange.min = 15500000;
            p.priceRange.max = 24550000;
        }
        p.websiteUrl = 'http://www.hjcloud9.com';
        p.hasDetailedPrices = true;
        p.phone = '063-214-1009';
    });

    // =============================================
    // 2. park-0579: (재)호정공원(봉안) — 봉안묘 + 봉안담
    // =============================================
    update('park-0579', p => {
        p.priceInfo.priceTable = {
            '봉안묘': {
                category: 'charnel',
                unit: '원',
                rows: [
                    { name: '부부 봉안 2기', price: 9300000, isRepresentative: true, grade: '2평, 영구 사용' },
                    { name: '가족 봉안 4기', price: 17300000, grade: '4평, 영구 사용' },
                    { name: '가족 봉안 8기', price: 22800000, grade: '5평, 영구 사용' },
                    { name: '가족 봉안 평장 4기', price: 14400000, grade: '2평, 영구 사용' },
                ]
            },
            '봉안담(개인)': {
                category: 'charnel',
                unit: '원',
                rows: [
                    { name: '1단', price: 2300000, isRepresentative: true, grade: '영구 사용' },
                    { name: '2단', price: 2900000, grade: '영구 사용' },
                    { name: '3단', price: 3300000, grade: '영구 사용' },
                    { name: '4단', price: 3500000, grade: '영구 사용' },
                    { name: '5단', price: 3500000, grade: '영구 사용' },
                    { name: '6단', price: 3300000, grade: '영구 사용' },
                    { name: '7단', price: 2900000, grade: '영구 사용' },
                ]
            },
            '봉안담(부부)': {
                category: 'charnel',
                unit: '원',
                rows: [
                    { name: '1단', price: 4100000, isRepresentative: true, grade: '영구 사용' },
                    { name: '2단', price: 5300000, grade: '영구 사용' },
                    { name: '3단', price: 5900000, grade: '영구 사용' },
                    { name: '4단', price: 6300000, grade: '영구 사용' },
                    { name: '5단', price: 6300000, grade: '영구 사용' },
                    { name: '6단', price: 5900000, grade: '영구 사용' },
                    { name: '7단', price: 5300000, grade: '영구 사용' },
                ]
            },
        };

        p.priceInfo.standardizedPrices = [
            // ===== 봉안묘 (야외형 → BURIAL) =====
            {
                serviceType: 'BURIAL',
                subType: '봉안묘',
                unit: '원',
                rows: [
                    {
                        name: '부부 봉안 2기', price: 9300000, feeType: 'USAGE', grade: '2평, 영구 사용', isRepresentative: true,
                        note: '별도: 안장비, 관리비(5년 선납), 각자비'
                    },
                    { name: '가족 봉안 4기', price: 17300000, feeType: 'USAGE', grade: '4평, 영구 사용' },
                    { name: '가족 봉안 8기', price: 22800000, feeType: 'USAGE', grade: '5평, 영구 사용' },
                    { name: '가족 봉안 평장 4기', price: 14400000, feeType: 'USAGE', grade: '2평, 영구 사용' },
                    // 관리비 안내
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '5년 단위 선납, 별도 문의' },
                ]
            },

            // ===== 봉안담(개인) (BONGSAN) — 복합단 분리 적용 =====
            {
                serviceType: 'BONGSAN',
                subType: '봉안담(개인)',
                unit: '원',
                rows: [
                    {
                        name: '1단', price: 2300000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true,
                        note: '별도: 안장비(20만원), 관리비(별도 문의)'
                    },
                    { name: '2단', price: 2900000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '3단', price: 3300000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '4단', price: 3500000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '5단', price: 3500000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '6단', price: 3300000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '7단', price: 2900000, feeType: 'USAGE', grade: '영구 사용' },
                ]
            },

            // ===== 봉안담(부부) (BONGSAN) =====
            {
                serviceType: 'BONGSAN',
                subType: '봉안담(부부)',
                unit: '원',
                rows: [
                    {
                        name: '1단', price: 4100000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true,
                        note: '별도: 안장비(20만원), 관리비(별도 문의)'
                    },
                    { name: '2단', price: 5300000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '3단', price: 5900000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '4단', price: 6300000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '5단', price: 6300000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '6단', price: 5900000, feeType: 'USAGE', grade: '영구 사용' },
                    { name: '7단', price: 5300000, feeType: 'USAGE', grade: '영구 사용' },
                ]
            },
        ];

        p.priceInfo.priceVerified = true;

        // 가격 범위
        p.minPrice = 2300000;   // 봉안담 개인 1단
        p.maxPrice = 22800000;  // 봉안묘 가족 8기
        p.representativePrice = 9300000; // 봉안묘 부부 봉안 2기 ★
        if (p.priceRange) {
            p.priceRange.min = 2300000;
            p.priceRange.max = 22800000;
        }
        p.websiteUrl = 'http://www.hjcloud9.com';
        p.website = 'http://www.hjcloud9.com';
        p.hasDetailedPrices = true;
        p.phone = p.phone || '063-214-1009';
    });

    // =============================================
    // 3. park-1207: (재)호정공원(자연장) — 수목장 + 화초·잔디장
    // =============================================
    update('park-1207', p => {
        p.priceInfo.priceTable = {
            '수목장': {
                category: 'natural',
                unit: '원',
                rows: [
                    { name: '개인목 1기', price: 3900000, isRepresentative: true, grade: '에메랄드 골드' },
                    { name: '부부목 2기', price: 7100000, grade: '작은 둥근 소나무, 분재형 소나무' },
                    { name: '가족목 4~8기', price: 11900000, grade: '반송, 황금소나무, 소나무 (최대 2,150만원)' },
                    { name: '공동수목', price: 2900000, grade: '조형소나무' },
                ]
            },
            '화초·잔디장': {
                category: 'natural',
                unit: '원',
                rows: [
                    { name: '화초장 1기', price: 2900000, isRepresentative: true, grade: '영구 사용' },
                    { name: '잔디장 1기', price: 2300000, grade: '영구 사용' },
                ]
            },
        };

        p.priceInfo.standardizedPrices = [
            // ===== 수목장 (NATURAL) =====
            {
                serviceType: 'NATURAL',
                subType: '수목장',
                unit: '원',
                rows: [
                    {
                        name: '개인목 1기', price: 3900000, feeType: 'USAGE', grade: '에메랄드 골드, 영구 사용', isRepresentative: true,
                        note: '별도: 안장비(30만원), 관리비(5년 선납), 수목표지석(15만원)'
                    },
                    { name: '부부목 2기', price: 7100000, feeType: 'USAGE', grade: '작은 둥근 소나무·분재형 소나무, 영구 사용' },
                    {
                        name: '가족목 4~8기', price: 11900000, feeType: 'USAGE', grade: '반송, 황금소나무, 소나무',
                        note: '가격범위: 1,190~2,150만원'
                    },
                    { name: '공동수목 (조형소나무)', price: 2900000, feeType: 'USAGE', grade: '영구 사용' },
                    // 관리비 안내
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '5년 단위 선납, 별도 문의' },
                ]
            },

            // ===== 화초·잔디장 (NATURAL) =====
            {
                serviceType: 'NATURAL',
                subType: '화초·잔디장',
                unit: '원',
                rows: [
                    {
                        name: '화초장 1기', price: 2900000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true,
                        note: '별도: 안장비(30만원), 관리비(5년 선납), 표지석'
                    },
                    { name: '잔디장 1기', price: 2300000, feeType: 'USAGE', grade: '영구 사용' },
                    // 관리비 안내
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '5년 단위 선납, 별도 문의' },
                ]
            },
        ];

        p.priceInfo.priceVerified = true;

        // 가격 범위
        p.minPrice = 2300000;    // 잔디장
        p.maxPrice = 21500000;   // 가족목 8기 최대
        p.representativePrice = 3900000; // 수목장 개인목 1기 ★
        p.priceRange = {
            min: 2300000,
            max: 21500000,
        };
        p.websiteUrl = 'http://www.hjcloud9.com';
        p.website = 'http://www.hjcloud9.com';
        p.hasDetailedPrices = true;
        p.phone = p.phone || '063-214-1009';
    });

    // =============================================
    // 결과 출력
    // =============================================
    const ids = ['park-0032', 'park-0579', 'park-1207'];
    ids.forEach(id => {
        const p = data.find(x => x.id === id);
        if (!p) return;
        console.log(`\n=== ${p.name} (${id}) ===`);
        console.log(`  가격범위: ${(p.minPrice / 10000).toLocaleString()}만 ~ ${(p.maxPrice / 10000).toLocaleString()}만`);
        console.log(`  대표가격: ${(p.representativePrice / 10000).toLocaleString()}만원`);
        console.log(`  standardizedPrices:`);
        (p.priceInfo?.standardizedPrices || []).forEach(g => {
            console.log(`    [${g.serviceType}] ${g.subType}${g.groupType ? ' / ' + g.groupType : ''} → ${g.rows.length}행`);
            g.rows.forEach(r => {
                const rep = r.isRepresentative ? ' ★' : '';
                const fee = r.feeType === 'MAINTENANCE' ? ' (관리비)' : '';
                console.log(`      ${r.name} = ${r.price > 0 ? (r.price / 10000).toLocaleString() + '만원' : '별도 문의'} | ${r.grade || ''}${fee}${rep}`);
            });
        });
    });

    // 로컬 JSON 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✅ data/facilities.json 저장 완료');

    // Supabase 동기화
    if (!SUPABASE_KEY) {
        console.log('⚠️ SUPABASE_KEY 없음 — DB 동기화 건너뜀');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase
            .from('Facility')
            .update({
                pricing: JSON.stringify(f.priceInfo),
                minPrice: f.minPrice,
                maxPrice: f.maxPrice,
                representativePrice: f.representativePrice,
                websiteUrl: f.websiteUrl || '',
                phone: f.phone || '',
            })
            .eq('id', id);

        if (error) console.log(`❌ ${id} 동기화 실패:`, error.message);
        else console.log(`✅ ${id} Supabase 동기화 완료`);
    }
}

fix().catch(console.error);
