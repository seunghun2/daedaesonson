#!/usr/bin/env node
// Phase 2: 후보(candidates/*.jsonl) → 업데이트 시트 (가격/이미지/미매칭/요약)
// 사용: node .agents/skills/facility-data-enrichment/scripts/build_update_sheets.mjs --run 20261003_1750
// 후보 스키마는 references/sheet-schema.md 참고.
import fs from 'node:fs';
import path from 'node:path';
import {
    OUT_ROOT, loadScoring, loadSources, loadJson, readJsonl, writeCsv, args, round, normKey,
    matchScore, freshness, priceSanity, parseKrw, normName, normAddr, digits,
} from './lib.mjs';

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 이 필요합니다 (export_master.mjs 를 먼저 실행하세요)');
const DIR = path.join(OUT_ROOT, RUN);
const cfg = loadScoring();
const sources = loadSources();
const master = loadJson(path.join(DIR, 'master.json'));
if (!master) throw new Error(`${DIR}/master.json 없음`);
const facs = master.facilities;
for (const f of facs) {
    f._normName = normName(f.name);
    f._normAddr = normAddr(f.address);
    f._digitsPhone = digits(f.phone);
}
const byId = new Map(facs.map((f) => [f.id, f]));
const byNormName = new Map();
const byPhone = new Map();
for (const f of facs) {
    if (f._normName) {
        if (!byNormName.has(f._normName)) byNormName.set(f._normName, []);
        byNormName.get(f._normName).push(f);
    }
    const p = f._digitsPhone.slice(-8);
    if (p.length >= 7) {
        if (!byPhone.has(p)) byPhone.set(p, []);
        byPhone.get(p).push(f);
    }
}
const masterHashes = loadJson(path.join(DIR, 'image_hashes.json'), {}); // { url: dhashHex } 선택

// ---------- 후보 로드 ----------
const candDir = path.join(DIR, 'candidates');
const files = fs.existsSync(candDir) ? fs.readdirSync(candDir).filter((f) => f.endsWith('.jsonl')) : [];
const cands = files.flatMap((f) => readJsonl(path.join(candDir, f)).map((c) => ({ ...c, _file: f })));
if (!cands.length) { console.log(`후보 없음: ${candDir}/*.jsonl 에 에이전트 결과를 넣어주세요.`); process.exit(0); }

const srcById = new Map((sources.sources || []).map((s) => [s.id, s]));
const trustOf = (src) => srcById.get(src)?.trust ?? 0.4;
const licenseOf = (src, declared) => srcById.get(src)?.image_license === 'none' ? 'none' : (declared || srcById.get(src)?.image_license || 'none');
const hamming = (h1, h2) => {
    if (!h1 || !h2 || h1.length !== h2.length) return 64;
    let d = 0;
    for (let i = 0; i < h1.length; i++) { let x = parseInt(h1[i], 16) ^ parseInt(h2[i], 16); while (x) { d += x & 1; x >>= 1; } }
    return d;
};

// ---------- 시설 매칭 ----------
function matchFacility(c) {
    if (c.facility) {
        c.facility._normName = normName(c.facility.name);
        c.facility._normAddr = normAddr(c.facility.address);
        c.facility._digitsPhone = digits(c.facility.phone);
    }
    if (c.matched_facility_id && byId.has(c.matched_facility_id)) {
        const f = byId.get(c.matched_facility_id);
        const r = matchScore(c.facility || {}, f, cfg);
        return { f, M: Math.max(r.score, 0.9), features: r.features, via: 'hint' };
    }

    // 1) 고속 색인 우선 탐색 (정확한 정규화 이름 또는 동일 전화번호)
    const candidatesToScan = new Set();
    const cNorm = c.facility?._normName;
    if (cNorm && byNormName.has(cNorm)) {
        for (const f of byNormName.get(cNorm)) candidatesToScan.add(f);
    }
    const cPhone = c.facility?._digitsPhone?.slice(-8);
    if (cPhone && cPhone.length >= 7 && byPhone.has(cPhone)) {
        for (const f of byPhone.get(cPhone)) candidatesToScan.add(f);
    }

    let best = null, second = 0;
    for (const f of candidatesToScan) {
        const r = matchScore(c.facility || {}, f, cfg);
        if (!best || r.score > best.M) { second = best?.M ?? 0; best = { f, M: r.score, features: r.features, via: 'index' }; }
        else if (r.score > second) second = r.score;
    }

    // 색인 탐색 결과가 합격선(0.85) 이상이면 즉시 확정
    if (best && best.M >= cfg.match.accept) {
        best.margin = round(best.M - second);
        return best;
    }

    // 2) 합격선 미달 시 전체 시설 전수 탐색
    for (const f of facs) {
        if (candidatesToScan.has(f)) continue;
        const r = matchScore(c.facility || {}, f, cfg);
        if (!best || r.score > best.M) { second = best?.M ?? 0; best = { f, M: r.score, features: r.features, via: 'search' }; }
        else if (r.score > second) second = r.score;
    }
    if (best) best.margin = round(best.M - second);
    return best;
}

const priceRows = [], imageRows = [], unmatched = [];
let seq = 0;

for (const c of cands) {
    const m = matchFacility(c);
    const src = c.source || 'unknown';
    const trust = trustOf(src);
    const fresh = freshness(c.published_at, c.captured_at, cfg);
    const feat = m?.features || {};
    const matchStatus = !m ? 'none' : m.M >= cfg.match.accept ? 'accept' : m.M >= cfg.match.review ? 'review' : 'none';
    if (matchStatus === 'none') {
        unmatched.push({ source: src, source_url: c.source_url ?? '', cand_name: c.facility?.name ?? '', cand_address: c.facility?.address ?? '',
            cand_phone: c.facility?.phone ?? '', best_facility_id: m?.f.id ?? '', best_facility_name: m?.f.name ?? '', match_score: m?.M ?? 0,
            n_prices: (c.prices || []).length, n_images: (c.images || []).length, review_decision: '', correct_facility_id: '', note: '' });
        continue;
    }
    const f = m.f;

    // ----- 가격 -----
    const exist = new Map();
    for (const [cat, block] of Object.entries(f.priceTable || {})) for (const r of block?.rows || []) {
        exist.set(normKey(`${cat}|${r.name ?? ''}|${r.grade ?? ''}`), { cat, ...r });
    }
    for (const p of c.prices || []) {
        const price = parseKrw(p.price ?? p.price_raw);
        const cat = p.category || '사용료';
        const key = normKey(`${cat}|${p.item_name ?? ''}|${p.grade ?? ''}`);
        const cur = exist.get(key);
        const curPrice = Number(cur?.price) || 0;
        const sanity = priceSanity(price, cat, curPrice, cfg);
        const ext = p.extraction_conf ?? 0.8;
        const conf = round(m.M * trust * ext * fresh * sanity);
        let action = 'NEW', diffPct = '';
        if (cur && curPrice > 0 && price > 0) {
            const d = Math.abs(price - curPrice) / curPrice;
            diffPct = round(d);
            action = d <= cfg.diff.same_pct ? 'CONFIRM' : d >= cfg.diff.conflict_pct ? 'CONFLICT' : 'UPDATE';
        } else if (cur) action = 'FILL'; // 기존 행은 있으나 가격 비어있음
        const auto = conf >= cfg.confidence.auto_approve && matchStatus === 'accept' && (action === 'NEW' || action === 'FILL' || action === 'CONFIRM');
        const status = !price || sanity === 0 || conf < cfg.confidence.review_min ? 'REJECT' : auto ? 'AUTO_APPROVE' : 'REVIEW';
        priceRows.push({
            update_id: `P${String(++seq).padStart(5, '0')}`, facility_id: f.id, facility_name: f.name, action,
            price_category: cat, item_name: p.item_name ?? '', grade: p.grade ?? '', group_type: p.group_type ?? '',
            current_price: curPrice || '', new_price: price ?? '', diff_pct: diffPct, unit: p.unit ?? '',
            source: src, source_url: c.source_url ?? '', evidence: (p.evidence ?? '').slice(0, 200), captured_at: c.captured_at ?? '', published_at: c.published_at ?? '',
            match_score: m.M, match_status: matchStatus, ...Object.fromEntries(Object.entries(feat).map(([k, v]) => [`f_${k}`, v])),
            trust, extraction_conf: ext, freshness: fresh, sanity, confidence: conf, auto_status: status,
            review_decision: '', final_price: '', note: '', row_key: key,
        });
    }

    // ----- 이미지 -----
    const seenHashes = (f.images || []).map((u) => masterHashes[u]).filter(Boolean);
    const existingUrls = new Set(f.images || []);
    const newList = [];
    for (const im of c.images || []) {
        if (!im.url || existingUrls.has(im.url)) continue;
        const license = licenseOf(src, im.license);
        const w = im.width || 0, h = im.height || 0;
        const sizeOk = !w || !h || (w >= cfg.image.min_width && h >= cfg.image.min_height);
        const sizeScore = !w || !h ? 0.7 : sizeOk ? Math.min(1, (w * h) / (cfg.image.min_width * cfg.image.min_height * 2)) * 0.5 + 0.5 : 0;
        const label = im.label || '';
        const labelScore = cfg.image.bad_labels.includes(label) ? 0 : cfg.image.good_labels.includes(label) ? (im.label_conf ?? 0.8) : (im.label_conf ?? 0.5) * 0.6;
        const dupAgainst = [...seenHashes, ...newList.map((x) => x.dhash).filter(Boolean)];
        const minHam = im.dhash && dupAgainst.length ? Math.min(...dupAgainst.map((x) => hamming(im.dhash, x))) : 64;
        const novelty = minHam <= cfg.image.novelty_hamming_dup ? 0 : 1;
        const licOk = license === 'official' || license === 'public';
        const conf = round(m.M * labelScore * sizeScore * novelty * (licOk ? 1 : 0.6));
        const reasons = [];
        if (!sizeOk) reasons.push('저해상도');
        if (cfg.image.bad_labels.includes(label)) reasons.push(`부적합라벨:${label}`);
        if (novelty === 0) reasons.push('기존/중복이미지');
        if (!licOk) reasons.push('저작권:공식/공공 출처 아님');
        const status = reasons.some((r) => /저해상도|부적합|중복/.test(r)) || conf < cfg.image.review_min ? 'REJECT'
            : licOk && conf >= cfg.image.auto_approve && matchStatus === 'accept' && newList.length < cfg.image.max_new_per_facility ? 'AUTO_APPROVE' : 'REVIEW';
        if (status !== 'REJECT') newList.push({ dhash: im.dhash });
        imageRows.push({
            update_id: `I${String(++seq).padStart(5, '0')}`, facility_id: f.id, facility_name: f.name, existing_image_count: (f.images || []).length,
            image_url: im.url, width: w || '', height: h || '', label, label_conf: im.label_conf ?? '', dhash: im.dhash ?? '', min_hamming: minHam === 64 && !dupAgainst.length ? '' : minHam,
            license, source: src, source_url: c.source_url ?? '', match_score: m.M, match_status: matchStatus,
            size_score: round(sizeScore), label_score: round(labelScore), novelty, confidence: conf, auto_status: status, reasons: reasons.join('|'),
            review_decision: '', as_thumbnail: '', note: '',
        });
    }
}

// ---------- 출력 ----------
const rank = { AUTO_APPROVE: 0, REVIEW: 1, REJECT: 2 };
const sortFn = (x, y) => rank[x.auto_status] - rank[y.auto_status] || y.confidence - x.confidence;
priceRows.sort(sortFn); imageRows.sort(sortFn);
const H = (rows, fb) => (rows[0] ? Object.keys(rows[0]) : fb);
writeCsv(path.join(DIR, '02_price_updates.csv'), H(priceRows, ['update_id']), priceRows);
writeCsv(path.join(DIR, '03_image_updates.csv'), H(imageRows, ['update_id']), imageRows);
writeCsv(path.join(DIR, '04_unmatched.csv'), H(unmatched, ['source']), unmatched);

const cnt = (rows, k, v) => rows.filter((r) => r[k] === v).length;
const md = `# 업데이트 요약 — RUN ${RUN}

후보 파일 ${files.length}개 / 후보 시설 ${cands.length}건 / 미매칭 ${unmatched.length}건

## 가격 (${priceRows.length}행)
| 구분 | 건수 |
|---|---|
| NEW(신규) | ${cnt(priceRows, 'action', 'NEW')} |
| FILL(빈 가격 채움) | ${cnt(priceRows, 'action', 'FILL')} |
| UPDATE(5~15% 차이) | ${cnt(priceRows, 'action', 'UPDATE')} |
| CONFLICT(15%+ 차이, 반드시 검수) | ${cnt(priceRows, 'action', 'CONFLICT')} |
| CONFIRM(기존값 재확인) | ${cnt(priceRows, 'action', 'CONFIRM')} |
| 자동승인 / 검수필요 / 반려 | ${cnt(priceRows, 'auto_status', 'AUTO_APPROVE')} / ${cnt(priceRows, 'auto_status', 'REVIEW')} / ${cnt(priceRows, 'auto_status', 'REJECT')} |

## 이미지 (${imageRows.length}장)
| 구분 | 건수 |
|---|---|
| 자동승인 / 검수필요 / 반려 | ${cnt(imageRows, 'auto_status', 'AUTO_APPROVE')} / ${cnt(imageRows, 'auto_status', 'REVIEW')} / ${cnt(imageRows, 'auto_status', 'REJECT')} |
| 저작권 불명(공식/공공 아님) | ${imageRows.filter((r) => r.license !== 'official' && r.license !== 'public').length} |

## 다음 단계
1. \`02_price_updates.csv\` / \`03_image_updates.csv\` 의 \`review_decision\` 열에 **Y / N / E(수정, final_price 기입)** 입력
2. \`node scripts/apply_approved.mjs --run ${RUN}\` (미리보기) → 문제 없으면 \`--apply\`
3. 검수 완료분으로 \`node scripts/tune_formula.mjs --run ${RUN}\` → 공식 개선안 확인
`;
fs.writeFileSync(path.join(DIR, '05_summary.md'), md);
console.log(md);
