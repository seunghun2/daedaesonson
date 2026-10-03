#!/usr/bin/env node
// Phase 0: 원본(DB) 스냅샷 → 원본 시트 + 크롤링 우선순위 큐
// 사용: node .agents/skills/facility-data-enrichment/scripts/export_master.mjs [--run 20261003_1730] [--include-inactive]
import fs from 'node:fs';
import path from 'node:path';
import { supabaseAdmin, fetchAll, writeCsv, OUT_ROOT, runId, args, normKey, round } from './lib.mjs';

const a = args();
const RUN = a.run || runId();
const OUT = path.join(OUT_ROOT, RUN);
fs.mkdirSync(OUT, { recursive: true });

const sb = supabaseAdmin();
const cols = 'id,name,category,"operatorType",isActive,address,phone,lat,lng,"websiteUrl","viewCount",images,thumbnail,pricing,"minPrice","maxPrice","representativePrice","updatedAt"';
let facilities = await fetchAll(sb, 'Facility', cols.replace(/"/g, ''));
if (!a['include-inactive']) facilities = facilities.filter((f) => f.isActive !== false);

const parse = (s, fb) => { try { return typeof s === 'string' ? JSON.parse(s) : (s ?? fb); } catch { return fb; } };

const facRows = [], priceRows = [], imageRows = [], master = [];
for (const f of facilities) {
    const images = (parse(f.images, []) || []).filter(Boolean);
    const pricing = parse(f.pricing, {}) || {};
    const table = pricing.priceTable || {};
    let rowCount = 0, positive = 0;
    for (const [cat, block] of Object.entries(table)) {
        (block?.rows || []).forEach((r, i) => {
            rowCount++;
            if (Number(r.price) > 0) positive++;
            priceRows.push({
                facility_id: f.id, facility_name: f.name, price_category: cat, row_index: i,
                item_name: r.name ?? '', grade: r.grade ?? '', group_type: r.groupType ?? '',
                price: r.price ?? '', is_representative: r.isRepresentative ? 'Y' : '',
                description: r.description ?? '', row_key: normKey(`${cat}|${r.name ?? ''}|${r.grade ?? ''}`),
            });
        });
    }
    images.forEach((u, i) => imageRows.push({ facility_id: f.id, facility_name: f.name, idx: i, url: u }));

    const gaps = [];
    if (positive === 0) gaps.push('가격없음');
    else if (positive < 3) gaps.push('가격항목부족');
    if (images.length === 0) gaps.push('이미지없음');
    else if (images.length < 4) gaps.push('이미지부족');
    if (!f.websiteUrl) gaps.push('홈페이지없음');
    if (!f.phone) gaps.push('전화없음');

    // 우선순위 = 결손 크기 × 수요(조회수) — 결손이 크고 많이 보는 시설부터
    const gapScore = (positive === 0 ? 0.5 : positive < 3 ? 0.25 : 0) + (images.length === 0 ? 0.3 : images.length < 4 ? 0.15 : 0) + (f.websiteUrl ? 0.1 : 0);
    const demand = Math.log10((f.viewCount || 0) + 10);
    const priority = round(gapScore * demand);

    facRows.push({
        facility_id: f.id, facility_name: f.name, category: f.category, operator_type: f.operatorType ?? '',
        is_active: f.isActive === false ? 'N' : 'Y', address: f.address ?? '', phone: f.phone ?? '',
        lat: f.lat ?? '', lng: f.lng ?? '', website_url: f.websiteUrl ?? '', view_count: f.viewCount ?? 0,
        image_count: images.length, price_rows: rowCount, price_rows_positive: positive,
        min_price: f.minPrice ?? '', max_price: f.maxPrice ?? '', gaps: gaps.join('|'), priority_score: priority,
        updated_at: f.updatedAt ?? '',
    });
    master.push({ id: f.id, name: f.name, category: f.category, operatorType: f.operatorType, address: f.address, phone: f.phone,
        lat: f.lat, lng: f.lng, websiteUrl: f.websiteUrl, viewCount: f.viewCount, images, thumbnail: f.thumbnail, priceTable: table, gaps, priority });
}

facRows.sort((x, y) => y.priority_score - x.priority_score);
const n = facRows.length;
facRows.forEach((r, i) => { r.priority_grade = r.priority_score === 0 ? 'D' : i < n * 0.1 ? 'S' : i < n * 0.3 ? 'A' : i < n * 0.6 ? 'B' : 'C'; });

writeCsv(path.join(OUT, '00_master_facilities.csv'), Object.keys(facRows[0]), facRows);
writeCsv(path.join(OUT, '01_master_prices.csv'), Object.keys(priceRows[0] || { facility_id: '' }), priceRows);
writeCsv(path.join(OUT, '01_master_images.csv'), ['facility_id', 'facility_name', 'idx', 'url'], imageRows);
fs.writeFileSync(path.join(OUT, 'master.json'), JSON.stringify({ run: RUN, exported_at: new Date().toISOString(), facilities: master }));

// 크롤링 작업 큐 (에이전트가 이 순서대로 순회)
const queue = facRows.filter((r) => r.priority_grade !== 'D').map((r) => {
    const m = master.find((x) => x.id === r.facility_id);
    return { facility_id: m.id, name: m.name, category: m.category, address: m.address, phone: m.phone, lat: m.lat, lng: m.lng,
        websiteUrl: m.websiteUrl, gaps: m.gaps, grade: r.priority_grade, existing_image_count: m.images.length,
        existing_price_keys: Object.entries(m.priceTable).flatMap(([c, b]) => (b?.rows || []).map((x) => `${c}|${x.name ?? ''}|${x.grade ?? ''}`)) };
});
fs.writeFileSync(path.join(OUT, 'crawl_queue.json'), JSON.stringify(queue, null, 1));
fs.mkdirSync(path.join(OUT, 'candidates'), { recursive: true });

const cnt = (g) => facRows.filter((r) => r.gaps.includes(g)).length;
console.log(`✅ RUN=${RUN}  →  ${path.relative(process.cwd(), OUT)}`);
console.log(`시설 ${n}개 | 가격행 ${priceRows.length} | 이미지 ${imageRows.length}`);
console.log(`결손: 가격없음 ${cnt('가격없음')} · 가격항목부족 ${cnt('가격항목부족')} · 이미지없음 ${cnt('이미지없음')} · 이미지부족 ${cnt('이미지부족')} · 홈페이지없음 ${cnt('홈페이지없음')}`);
console.log(`크롤링 큐 ${queue.length}개 (S ${facRows.filter((r) => r.priority_grade === 'S').length} / A ${facRows.filter((r) => r.priority_grade === 'A').length})`);
