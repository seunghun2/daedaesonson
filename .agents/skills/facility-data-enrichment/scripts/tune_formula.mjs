#!/usr/bin/env node
// Phase 4: 사람 검수 결과로 점수 공식 개선안 도출 (config/scoring.suggested.json + tuning_report.md)
// 사용: node .agents/skills/facility-data-enrichment/scripts/tune_formula.mjs [--run <RUN>|--all] [--min-samples 30]
// 검수 라벨: Y/E=정답, N=시설은 맞지만 가격/이미지가 부적합, X=엉뚱한 시설에 매칭됨(매칭 오류)
import fs from 'node:fs';
import path from 'node:path';
import { OUT_ROOT, SKILL_DIR, loadScoring, loadSources, readCsv, args, round } from './lib.mjs';

const a = args();
const minN = Number(a['min-samples'] || 30);
const cfg = loadScoring();
const sources = loadSources();
const runs = a.all || !a.run ? fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)) : [a.run];

const load = (f) => runs.flatMap((r) => { const p = path.join(OUT_ROOT, r, f); return fs.existsSync(p) ? readCsv(p).map((x) => ({ ...x, _run: r })) : []; });
const lab = (r) => String(r.review_decision || '').trim().toUpperCase();
const prices = load('02_price_updates.csv').filter((r) => 'YENX'.includes(lab(r)) && lab(r));
const images = load('03_image_updates.csv').filter((r) => 'YENX'.includes(lab(r)) && lab(r));
const good = (r) => lab(r) === 'Y' || lab(r) === 'E';
const num = (v) => (v === '' || v === undefined ? null : Number(v));

console.log(`검수 라벨: 가격 ${prices.length}행 / 이미지 ${images.length}장 (필요 최소 ${minN})`);
if (prices.length + images.length < minN) {
    console.log(`⚠️ 표본이 부족합니다. 시트의 review_decision 을 더 채운 뒤 다시 실행하세요. (공식을 바꾸지 않음)`);
    process.exit(0);
}

const fBeta = (tp, fp, fn, b = 0.5) => { const p = tp / (tp + fp || 1), r = tp / (tp + fn || 1); return p + r ? ((1 + b * b) * p * r) / (b * b * p + r) : 0; };
const prec = (tp, fp) => (tp + fp ? tp / (tp + fp) : 0);

// ---------- 1) 매칭 가중치/임계값 ----------
const feats = ['name_sim', 'addr_sim', 'phone_score', 'geo_score'];
const seen = new Set();
const matchSet = [...prices, ...images].filter((r) => { const k = `${r.facility_id}|${r.source_url}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((r) => ({ f: Object.fromEntries(feats.map((k) => [k, num(r[`f_${k}`])])), ok: lab(r) !== 'X' }));
const scoreWith = (w, f) => { let n = 0, d = 0; for (const k of feats) if (f[k] !== null && f[k] !== undefined) { n += w[k] * f[k]; d += w[k]; } let s = d ? n / d : 0; if (f.name_sim !== null && f.name_sim < cfg.match.name_floor) s = Math.min(s, cfg.match.review); return s; };
let bestMatch = null;
const hasFeat = matchSet.filter((x) => feats.some((k) => x.f[k] !== null));
if (hasFeat.length >= 10 && hasFeat.some((x) => !x.ok)) {
    const step = 0.05;
    for (let a1 = 0.1; a1 <= 0.7; a1 += step) for (let a2 = 0; a2 <= 0.5; a2 += step) for (let a3 = 0; a3 <= 0.4; a3 += step) {
        const a4 = 1 - a1 - a2 - a3; if (a4 < -1e-9 || a4 > 0.4) continue;
        const w = { name_sim: a1, addr_sim: a2, phone_score: a3, geo_score: Math.max(0, a4) };
        for (let th = 0.6; th <= 0.95; th += 0.025) {
            let tp = 0, fp = 0, fn = 0;
            for (const x of hasFeat) { const pred = scoreWith(w, x.f) >= th; if (pred && x.ok) tp++; else if (pred && !x.ok) fp++; else if (!pred && x.ok) fn++; }
            const sc = fBeta(tp, fp, fn) - 0.001 * Math.abs(a1 - cfg.match.weights.name_sim); // 동점이면 현행 가중치에 가까운 쪽
            if (!bestMatch || sc > bestMatch.sc) bestMatch = { sc, w, th, tp, fp, fn };
        }
    }
}

// ---------- 2) 신뢰도 자동승인 임계값 (정밀도 우선) ----------
function bestThreshold(rows, target = 0.98) {
    let best = null;
    for (let th = 0.5; th <= 0.99; th += 0.01) {
        const sel = rows.filter((r) => num(r.confidence) >= th);
        const tp = sel.filter(good).length, fp = sel.length - tp;
        const p = prec(tp, fp), rec = rows.filter(good).length ? tp / rows.filter(good).length : 0;
        if (sel.length >= 5 && p >= target && (!best || rec > best.rec)) best = { th: round(th, 2), p: round(p), rec: round(rec), n: sel.length };
    }
    return best;
}
const pTh = bestThreshold(prices), iTh = bestThreshold(images, 0.95);

// ---------- 3) 출처별 정밀도 → trust 제안 ----------
const bySource = {};
for (const r of prices) { const s = (bySource[r.source] ||= { tp: 0, n: 0 }); s.n++; if (good(r)) s.tp++; }
const trustSuggest = {};
for (const s of sources.sources) {
    const st = bySource[s.id]; if (!st || st.n < 5) continue;
    const post = (st.tp + 2 * s.trust) / (st.n + 2); // 베이지안 평활: 사전값 s.trust 에 2건 가중
    trustSuggest[s.id] = { current: s.trust, suggested: round(Math.min(1, post), 2), samples: st.n, precision: round(st.tp / st.n, 2) };
}

// ---------- 4) 액션별 정밀도 (CONFLICT 기준 점검) ----------
const byAction = {};
for (const r of prices) { const s = (byAction[r.action] ||= { tp: 0, n: 0 }); s.n++; if (good(r)) s.tp++; }

// ---------- 출력 ----------
const sug = JSON.parse(JSON.stringify(cfg));
sug.version = (cfg.version || 1) + 1;
if (bestMatch) { sug.match.weights = Object.fromEntries(Object.entries(bestMatch.w).map(([k, v]) => [k, round(v, 2)])); sug.match.accept = round(bestMatch.th, 2); }
if (pTh) sug.confidence.auto_approve = pTh.th;
if (iTh) sug.image.auto_approve = iTh.th;
sug._suggested_trust = trustSuggest;
fs.writeFileSync(path.join(SKILL_DIR, 'config', 'scoring.suggested.json'), JSON.stringify(sug, null, 2));

const md = `# 공식 튜닝 리포트 (${runs.join(', ')})

라벨: 가격 ${prices.length} / 이미지 ${images.length} (정답 ${[...prices, ...images].filter(good).length})

## 매칭 가중치
${bestMatch ? `- 제안: ${JSON.stringify(sug.match.weights)}, accept=${sug.match.accept}  (TP ${bestMatch.tp} / FP ${bestMatch.fp} / FN ${bestMatch.fn})\n- 현행: ${JSON.stringify(cfg.match.weights)}, accept=${cfg.match.accept}` : '- 표본/오매칭(X) 라벨 부족 → 변경 없음'}

## 자동승인 임계값 (정밀도 목표: 가격 98%, 이미지 95%)
- 가격: ${pTh ? `${pTh.th} (정밀도 ${pTh.p}, 재현율 ${pTh.rec}, n=${pTh.n})` : '조건을 만족하는 임계값 없음 → 현행 유지(자동승인 비권장)'}
- 이미지: ${iTh ? `${iTh.th} (정밀도 ${iTh.p}, 재현율 ${iTh.rec}, n=${iTh.n})` : '조건을 만족하는 임계값 없음 → 현행 유지'}

## 출처별 정밀도 / trust 제안
| 출처 | 표본 | 정밀도 | 현행 trust | 제안 |
|---|---|---|---|---|
${Object.entries(trustSuggest).map(([k, v]) => `| ${k} | ${v.samples} | ${v.precision} | ${v.current} | ${v.suggested} |`).join('\n') || '| (5건 이상 표본 없음) | | | | |'}

## 액션별 정답률
| 액션 | 표본 | 정답률 |
|---|---|---|
${Object.entries(byAction).map(([k, v]) => `| ${k} | ${v.n} | ${round(v.tp / v.n, 2)} |`).join('\n')}

> 제안값은 \`config/scoring.suggested.json\` 에 저장됨. 사람이 확인한 뒤 \`scoring.json\` 에 반영하세요(자동 덮어쓰기 안 함).
`;
fs.writeFileSync(path.join(OUT_ROOT, 'tuning_report.md'), md);
console.log(md);
