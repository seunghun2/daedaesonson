#!/usr/bin/env node
// Phase 3: 검수 완료된 시트를 DB에 반영. 기본은 미리보기(dry-run), --apply 일 때만 실제 쓰기.
// 사용: node .agents/skills/facility-data-enrichment/scripts/apply_approved.mjs --run <RUN> [--apply] [--only prices|images] [--allow-unlicensed]
// 승인 규칙: review_decision 이 Y/E → 반영, N → 제외, 비어있으면 auto_status=AUTO_APPROVE 일 때만 반영.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin, OUT_ROOT, readCsv, args, parseKrw, normKey, loadScoring } from './lib.mjs';

const a = args();
const RUN = a.run;
if (!RUN) throw new Error('--run <RUN> 필요');
const DIR = path.join(OUT_ROOT, RUN);
const APPLY = !!a.apply;
const only = a.only || 'all';
const cfg = loadScoring();
const sb = supabaseAdmin();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = 'facilities';

const decide = (r) => {
    const d = String(r.review_decision || '').trim().toUpperCase();
    if (d === 'Y' || d === 'E') return d;
    if (d === 'N' || d === 'X') return 'N';
    return r.auto_status === 'AUTO_APPROVE' ? 'Y' : '';
};
const parseJ = (s, fb) => { try { return typeof s === 'string' ? JSON.parse(s) : (s ?? fb); } catch { return fb; } };
const readIf = (f) => (fs.existsSync(path.join(DIR, f)) ? readCsv(path.join(DIR, f)) : []);

const priceRows = only === 'images' ? [] : readIf('02_price_updates.csv').map((r) => ({ ...r, _d: decide(r) })).filter((r) => r._d === 'Y' || r._d === 'E');
const imageRows = only === 'prices' ? [] : readIf('03_image_updates.csv').map((r) => ({ ...r, _d: decide(r) })).filter((r) => r._d === 'Y' || r._d === 'E');

const byFac = new Map();
const bucket = (id) => { if (!byFac.has(id)) byFac.set(id, { prices: [], images: [] }); return byFac.get(id); };
priceRows.forEach((r) => bucket(r.facility_id).prices.push(r));
imageRows.forEach((r) => bucket(r.facility_id).images.push(r));

console.log(`${APPLY ? '🔴 실제 반영' : '🟢 미리보기(dry-run)'} | RUN=${RUN} | 시설 ${byFac.size}곳 | 가격 ${priceRows.length}행 | 이미지 ${imageRows.length}장`);
if (!byFac.size) process.exit(0);

const backups = [], log = [];
let nPrice = 0, nImg = 0, nSkip = 0;

for (const [fid, { prices, images }] of byFac) {
    const { data: fac, error } = await sb.from('Facility').select('id,name,images,pricing,thumbnail').eq('id', fid).single();
    if (error || !fac) { log.push(`❌ ${fid} 조회 실패`); nSkip++; continue; }
    backups.push({ id: fid, images: fac.images, pricing: fac.pricing, thumbnail: fac.thumbnail });
    const patch = {};

    // ----- 가격 -----
    if (prices.length) {
        const pricing = parseJ(fac.pricing, {}) || {};
        pricing.priceTable = pricing.priceTable || {};
        for (const p of prices) {
            const price = p._d === 'E' ? parseKrw(p.final_price) : parseKrw(p.new_price);
            if (!price || price <= 0) { log.push(`⚠️ ${p.update_id} 가격 해석 불가 → 건너뜀`); nSkip++; continue; }
            const cat = p.price_category;
            const block = (pricing.priceTable[cat] = pricing.priceTable[cat] || { rows: [] });
            block.rows = block.rows || [];
            const row = block.rows.find((r) => normKey(`${cat}|${r.name ?? ''}|${r.grade ?? ''}`) === p.row_key);
            if (row) { log.push(`  ${fac.name} · ${cat}/${p.item_name} ${row.price || '-'} → ${price} (${p.action})`); row.price = price; row.enrichedFrom = p.source; }
            else {
                block.rows.push({ name: p.item_name, grade: p.grade || undefined, price, isRepresentative: false, groupType: p.group_type || undefined, description: '', enrichedFrom: p.source });
                log.push(`  ${fac.name} · ${cat}/${p.item_name} 신규 ${price}`);
            }
            nPrice++;
        }
        patch.pricing = typeof fac.pricing === 'string' ? JSON.stringify(pricing) : pricing;
    }

    // ----- 이미지 -----
    if (images.length) {
        const cur = parseJ(fac.images, []) || [];
        const added = [];
        let n = 0;
        for (const im of images) {
            if (n >= cfg.image.max_new_per_facility) break;
            const licOk = im.license === 'official' || im.license === 'public';
            if (!licOk && !a['allow-unlicensed']) { log.push(`⛔ ${im.update_id} 저작권 불명(${im.license}) → 건너뜀 (--allow-unlicensed 로 강제 가능, 권장하지 않음)`); nSkip++; continue; }
            try {
                if (!APPLY) { log.push(`  ${fac.name} 이미지 추가 예정: ${im.image_url}`); n++; nImg++; continue; }
                const res = await fetch(im.image_url, { headers: { 'User-Agent': 'Mozilla/5.0 daedaesonson-enrich' } });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const buf = Buffer.from(await res.arrayBuffer());
                const out = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
                const meta = await sharp(out).metadata();
                if ((meta.width || 0) < cfg.image.min_width || (meta.height || 0) < cfg.image.min_height) throw new Error(`해상도 부족 ${meta.width}x${meta.height}`);
                const hash = crypto.createHash('sha1').update(out).digest('hex').slice(0, 8);
                const key = `facilities/${fid}/enrich_${hash}.jpg`;
                const { error: ue } = await sb.storage.from(BUCKET).upload(key, out, { contentType: 'image/jpeg', upsert: true });
                if (ue) throw ue;
                const url = `${SUPA}/storage/v1/object/public/${BUCKET}/${key}`;
                if (!cur.includes(url)) added.push(url);
                if (String(im.as_thumbnail).toUpperCase() === 'Y') patch.thumbnail = url;
                log.push(`  ${fac.name} 이미지 업로드 ✅ ${key}`);
                n++; nImg++;
            } catch (e) { log.push(`❌ ${im.update_id} 이미지 실패: ${e.message}`); nSkip++; }
        }
        if (added.length) patch.images = typeof fac.images === 'string' ? JSON.stringify([...cur, ...added]) : [...cur, ...added];
    }

    if (APPLY && Object.keys(patch).length) {
        const { error: pe } = await sb.from('Facility').update({ ...patch, updatedAt: new Date().toISOString() }).eq('id', fid);
        if (pe) log.push(`❌ ${fid} 저장 실패: ${pe.message}`);
    }
}

console.log(log.join('\n'));
console.log(`\n가격 ${nPrice}행 / 이미지 ${nImg}장 ${APPLY ? '반영 완료' : '반영 예정'} / 건너뜀 ${nSkip}`);
if (APPLY) {
    const bf = path.join(DIR, `backup_${Date.now()}.json`);
    fs.writeFileSync(bf, JSON.stringify(backups));
    console.log(`💾 백업: ${path.relative(process.cwd(), bf)}  (복구: restore_backup 방식 — 해당 JSON의 images/pricing/thumbnail 을 Facility 에 되돌려 쓰기)`);
    console.log('⚠️ SSR/사이트맵이 쓰는 data/facilities.json 은 DB와 별개입니다. 필요하면 별도 동기화하세요.');
    console.log('⚠️ minPrice/maxPrice/representativePrice 컬럼은 건드리지 않았습니다. 목록 가격 표시가 필요하면 재계산하세요.');
} else console.log('\n실제 반영하려면 --apply 를 붙이세요.');
