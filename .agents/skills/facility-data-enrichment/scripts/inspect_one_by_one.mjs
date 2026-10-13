#!/usr/bin/env node
/**
 * 🔍 시설별 1:1 초정밀 대조 검수 도구 (One-by-One Facility Inspector)
 * 
 * 특정 시설 ID를 지정하거나, 검증 통과 목록을 순서대로 넘겨보며
 * 지점 주소, 개인단/부부단/층단수 규격, 분양가 vs 관리비 분리를 정밀하게 확인할 수 있습니다.
 * 
 * 사용법:
 *   node inspect_one_by_one.mjs --id park-0565
 *   node inspect_one_by_one.mjs --index 0
 */

import fs from 'node:fs';
import path from 'node:path';
import { OUT_ROOT, args, loadJson } from './lib.mjs';

const a = args();
const RUN = a.run || '20261003_1750';
const DIR = path.join(OUT_ROOT, RUN);

const reportPath = path.join(DIR, '초정밀_적시적소_검증_보고서.md');
if (!fs.existsSync(reportPath)) {
    console.error('초정밀 검증 보고서가 없습니다. 먼저 validate_precision.mjs를 실행하세요.');
    process.exit(1);
}

const master = loadJson(path.join(DIR, 'master.json'));
const facMap = new Map(master.facilities.map((f) => [f.id, f]));

const candFile = path.join(DIR, 'candidates', 'official_sites.jsonl');
const cands = fs.readFileSync(candFile, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(JSON.parse);
const candMap = new Map(cands.map((c) => [c.facility.id, c]));

const targetId = a.id || (a.index !== undefined ? cands[parseInt(a.index, 10)]?.facility?.id : 'park-0565');

if (!targetId || !candMap.has(targetId)) {
    console.error(`시설 ID [${targetId}]를 찾을 수 없습니다.`);
    process.exit(1);
}

const fac = facMap.get(targetId);
const cand = candMap.get(targetId);

console.log(`\n======================================================================`);
console.log(`🏛️ [시설 정밀 대조 카드] ID: ${fac.id} | ${fac.name}`);
console.log(`📍 실제 주소: ${fac.address}`);
console.log(`🏷️ 종별: ${fac.category} | 전화: ${fac.phone || '없음'}`);
console.log(`🌐 공식 홈페이지: ${fac.websiteUrl || '없음'}`);
console.log(`======================================================================\n`);

console.log(`💰 [추출된 세부 가격 목록 (${cand.prices.length}건)]:`);
if (cand.prices.length === 0) {
    console.log(`   (추출된 가격 없음)`);
} else {
    cand.prices.forEach((p, idx) => {
        console.log(`   [${idx + 1}] 분류: ${p.category} | 항목: ${p.item_name} | 등급/규격: ${p.grade || '개인'} | 단위: ${p.unit || '1기'}`);
        console.log(`       금액: ${p.price}`);
        console.log(`       원문 근거: ${p.evidence || '없음'}`);
        console.log(`       -----------------------------------------------------------`);
    });
}

console.log(`\n📸 [추출된 현장 실사 사진 (${cand.images.length}장)]:`);
if (cand.images.length === 0) {
    console.log(`   (추출된 이미지 없음)`);
} else {
    cand.images.forEach((im, idx) => {
        console.log(`   [${idx + 1}] [${im.label || '미분류'}] ${im.caption || ''} (${im.width}x${im.height}, ${im.size_kb}KB)`);
        console.log(`       로컬: ${im.local_path}`);
        console.log(`       원문 URL: ${im.url}`);
    });
}
console.log(`\n======================================================================\n`);
