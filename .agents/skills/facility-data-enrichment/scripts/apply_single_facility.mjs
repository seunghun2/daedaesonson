#!/usr/bin/env node
/**
 * 🎯 단일 시설 초정밀 1:1 안전 반영 도구 (Single Facility Precision Applier)
 * 
 * 1개 시설씩 사람 검수 기준에 맞춰 완벽히 검증하고 DB에 안전하게 반영합니다.
 * 
 * 사용법:
 *   # 1. 검증 및 변경 내역 미리보기 (Dry-run)
 *   node apply_single_facility.mjs --id park-0765
 * 
 *   # 2. 검증 완료 후 단 1곳만 실제 DB 반영
 *   node apply_single_facility.mjs --id park-0765 --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { supabaseAdmin, OUT_ROOT, args, parseKrw, loadJson } from './lib.mjs';

const a = args();
const RUN = a.run || '20261003_1750';
const DIR = path.join(OUT_ROOT, RUN);
const APPLY = !!a.apply;
const targetId = a.id;

if (!targetId) {
    console.error('❌ --id <facility_id> 가 필요합니다. 예: --id park-0765');
    process.exit(1);
}

const master = loadJson(path.join(DIR, 'master.json'));
const fac = master.facilities.find((f) => f.id === targetId);
if (!fac) {
    console.error(`❌ master.json에서 시설 [${targetId}]를 찾을 수 없습니다.`);
    process.exit(1);
}

const candFile = path.join(DIR, 'candidates', 'official_sites.jsonl');
const cands = fs.readFileSync(candFile, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(JSON.parse);
const cand = cands.find((c) => c.facility?.id === targetId);

if (!cand) {
    console.error(`❌ candidates 파일에서 시설 [${targetId}]의 수집 데이터를 찾을 수 없습니다.`);
    process.exit(1);
}

console.log(`\n======================================================================`);
console.log(`🏛️ [1:1 단일 시설 초정밀 반영기] ${APPLY ? '🔴 실제 DB 반영' : '🟢 사전 검증 미리보기'}`);
console.log(`📌 대상: [${fac.id}] ${fac.name}`);
console.log(`📍 주소: ${fac.address}`);
console.log(`🏷️ 종별: ${fac.category} | 전화: ${fac.phone || '없음'}`);
console.log(`🌐 홈페이지: ${fac.websiteUrl || '없음'}`);
console.log(`======================================================================\n`);

// 1. 적시적소 가격 검증 & 정제
const verifiedPrices = [];
for (const p of (cand.prices || [])) {
    const rawContext = `${p.category} ${p.item_name} ${p.evidence || ''}`.toLowerCase();
    const krw = parseKrw(p.price);
    if (!krw) continue;

    let cat = p.category || '사용료';
    let grade = p.grade || '개인';
    let unit = p.unit || '1기';
    let groupType = p.group_type || '일반';
    let name = p.item_name;

    // 개인 / 부부 / 가족
    if (/부부|2위/.test(rawContext)) {
        grade = '부부 (2위)';
        unit = '2위';
    } else if (/가족|4위|8위|12위|문중/.test(rawContext)) {
        const numMatch = rawContext.match(/(\d+)위/);
        grade = numMatch ? `가족 (${numMatch[1]}위)` : '가족';
        unit = numMatch ? `${numMatch[1]}위` : '가족';
    } else {
        grade = '개인 (1위)';
        unit = '1기';
    }

    // 관리비 vs 분양가
    if (/관리비/.test(rawContext)) {
        cat = '관리비';
        groupType = '관리비';
        if (krw > 500000 && !/영구|선납|10년|5년/.test(rawContext)) {
            console.warn(`⚠️ [경고] 관리비(${krw.toLocaleString()}원) 금액 이상 → 건너뜀`);
            continue;
        }
    } else {
        if (fac.category === 'CHARNEL_HOUSE') cat = '봉안당';
        else if (fac.category === 'NATURAL_BURIAL') cat = '수목장/자연장';
        else if (fac.category === 'FAMILY_GRAVE') cat = '매장묘';
    }

    // 종별 교차오염 방어
    if (fac.category === 'CHARNEL_HOUSE' && /매장|봉분|묘지/.test(rawContext)) {
        console.warn(`🚨 [경고] 봉안당에 매장묘(${p.item_name}) 유입 차단`);
        continue;
    }

    verifiedPrices.push({
        cat,
        name,
        grade,
        unit,
        price: krw,
        groupType,
        evidence: p.evidence
    });
}

// 2. 이미지 검증 & 정제
const verifiedImages = [];
for (const im of (cand.images || [])) {
    if (im.label_conf === 0.95 && im.label && im.label !== '기타' && im.label !== '포스터_공지') {
        if ((im.width && im.width < 600) || (im.height && im.height < 500) || (im.size_kb && im.size_kb < 15)) continue;
        if (fac.category === 'CHARNEL_HOUSE' && im.label === '매장묘') continue;
        if (fac.category === 'FAMILY_GRAVE' && im.label === '봉안실') continue;
        if (fac.category === 'NATURAL_BURIAL' && im.label === '매장묘') continue;

        verifiedImages.push(im);
    }
}

const extraImages = [];
if (a['extra-images']) {
    const rawList = a['extra-images'].split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of rawList) {
        if (fs.existsSync(p)) {
            extraImages.push({
                local_path: p,
                isAbsolute: true,
                label: '실내봉안/시설',
                caption: path.basename(p)
            });
        }
    }
    console.log(`📸 [--extra-images] 추가 검증된 실사 ${extraImages.length}장 포함`);
}

if (a['skip-prices']) {
    verifiedPrices.length = 0;
    console.log(`🛑 [--skip-prices] 플래그에 의해 후보 가격을 배제하고 기존 DB 가격을 보존합니다.`);
}

if (a['skip-images']) {
    verifiedImages.length = 0;
    console.log(`🛑 [--skip-images] 플래그에 의해 후보 이미지를 배제하고 기존 DB 이미지를 보존합니다.`);
}

console.log(`📋 [검증 완료된 정밀 가격표 (${verifiedPrices.length}건)]:`);
verifiedPrices.forEach((p, idx) => {
    console.log(`   [${idx + 1}] [${p.cat}] ${p.name} | 규격: ${p.grade} | 금액: ${p.price.toLocaleString()}원 (${p.unit})`);
});

const totalImgs = [...verifiedImages, ...extraImages];
console.log(`\n📸 [검증 완료된 고화질 실사 (${totalImgs.length}장)]:`);
totalImgs.forEach((im, idx) => {
    console.log(`   [${idx + 1}] [${im.label}] ${im.caption || im.label} ${im.width ? `(${im.width}x${im.height})` : ''}`);
});

if (a['clean-foreign-images']) {
    console.log(`🧹 [--clean-foreign-images] 플래그: 타 시설 오매칭 이미지(/facilities/park-XXXX/)를 자동 정제합니다.`);
}

if (!APPLY) {
    console.log(`\n💡 실제 DB에 반영하려면 뒤에 --apply 를 붙여 실행하세요:`);
    console.log(`   node .agents/skills/facility-data-enrichment/scripts/apply_single_facility.mjs --id ${targetId} --apply\n`);
    process.exit(0);
}

// ======================================================================
// 실제 반영 단계 (--apply)
// ======================================================================
const sb = supabaseAdmin();
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = 'facilities';

console.log(`\n🚀 [실제 DB 반영 시작]...`);
const { data: dbFac, error: qErr } = await sb.from('Facility').select('id, name, pricing, images, thumbnail, phone, fax, websiteUrl').eq('id', targetId).single();
if (qErr || !dbFac) throw new Error(`DB 조회 실패: ${qErr?.message}`);

// 안전 백업
const backupDir = path.join(DIR, 'single_backups');
fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `${targetId}_backup_${Date.now()}.json`);
fs.writeFileSync(backupPath, JSON.stringify(dbFac, null, 2), 'utf8');
console.log(`💾 원본 롤백 백업 저장: ${backupPath}`);

const patch = {};

if (a.fax && (!dbFac.fax || dbFac.fax.trim() === '')) {
    patch.fax = a.fax;
    console.log(`📠 팩스 번호 보강: ${a.fax}`);
}
if (a.phone && (!dbFac.phone || dbFac.phone.trim() === '' || dbFac.phone === '000-000-0000' || a['force-phone'])) {
    patch.phone = a.phone;
    console.log(`📞 전화번호 보강/수정: ${a.phone}`);
}
if (a['clear-website'] || a.website === 'none' || a.website === 'null') {
    patch.websiteUrl = null;
    console.log(`🌐 웹사이트 주소 제거 (오매칭/무관한 웹사이트 격리)`);
} else if (a.website) {
    patch.websiteUrl = a.website;
    console.log(`🌐 웹사이트 주소 보강: ${a.website}`);
}
if (a.public) {
    patch.isPublic = true;
    console.log(`🏛️ 공설(isPublic: true) 설정 반영`);
}

// 1. 가격 병합
if (verifiedPrices.length > 0) {
    let pricing = typeof dbFac.pricing === 'string' ? JSON.parse(dbFac.pricing || '{}') : (dbFac.pricing || {});
    if (!pricing || Object.keys(pricing).length === 0 || !pricing.priceTable) {
        const facJsonPath = path.join(process.cwd(), 'data', 'facilities.json');
        if (fs.existsSync(facJsonPath)) {
            try {
                const facList = JSON.parse(fs.readFileSync(facJsonPath, 'utf8'));
                const cur = facList.find(f => f.id === targetId);
                if (cur && cur.priceInfo) {
                    pricing = JSON.parse(JSON.stringify(cur.priceInfo));
                }
            } catch (e) {}
        }
    }
    pricing.priceTable = pricing.priceTable || {};

    for (const p of verifiedPrices) {
        const block = (pricing.priceTable[p.cat] = pricing.priceTable[p.cat] || { rows: [] });
        block.rows = block.rows || [];
        // 0원 더미 행 정리
        block.rows = block.rows.filter(r => !(r.price === 0 && (!r.name || r.name.trim() === '')));
        const exists = block.rows.some((r) => r.name === p.name && (r.grade === p.grade || (!r.grade && !p.grade)) && r.price === p.price);
        if (!exists) {
            block.rows.push({
                name: p.name,
                grade: p.grade,
                price: p.price,
                isRepresentative: false,
                groupType: p.groupType,
                description: `${p.unit || ''}`.trim(),
                enrichedFrom: 'official_homepage'
            });
        }
    }

    // 대표 가격 지정 (0원이 아닌 최저가 기준)
    for (const cat of Object.keys(pricing.priceTable)) {
        const block = pricing.priceTable[cat];
        if (block && block.rows && block.rows.length > 0) {
            const hasRep = block.rows.some(r => r.isRepresentative && r.price > 0);
            if (!hasRep) {
                const positiveRows = block.rows.filter(r => r.price > 0);
                if (positiveRows.length > 0) {
                    const minRow = positiveRows.reduce((min, cur) => cur.price < min.price ? cur : min, positiveRows[0]);
                    minRow.isRepresentative = true;
                }
            }
        }
    }

    // standardizedPrices 동기화 및 minPrice/maxPrice/representativePrice 갱신
    let sp = Array.isArray(pricing.standardizedPrices) ? pricing.standardizedPrices : [];
    const existingSpKeys = new Set();
    let spPosCount = 0;
    for (const grp of sp) {
        for (const r of grp.rows || []) {
            if (Number(r.price) > 0) spPosCount++;
            existingSpKeys.add(`${r.name}:${Number(r.price)}`);
        }
    }
    if (spPosCount === 0 && verifiedPrices.some(p => Number(p.price) > 0)) {
        sp = [];
    }
    for (const p of verifiedPrices) {
        const pr = Number(p.price);
        if (pr <= 0 || existingSpKeys.has(`${p.name}:${pr}`)) continue;
        const isMaint = p.cat.includes('관리비') || (p.name || '').includes('관리비');
        const st = p.cat.includes('화장') ? 'CREMATION'
            : (p.cat.includes('수목') || p.cat.includes('자연') || p.cat.includes('잔디') || p.cat.includes('해양')) ? 'NATURAL'
            : p.cat.includes('봉안') ? 'BONGSAN' : 'BURIAL';
        const subType = isMaint ? '관리비' : p.cat;
        let grp = sp.find(g => g.serviceType === st && g.subType === subType);
        if (!grp) {
            grp = { serviceType: st, subType, unit: '원', rows: [] };
            sp.push(grp);
        }
        grp.rows.push({
            name: p.name,
            price: pr,
            grade: p.grade || '',
            feeType: isMaint ? 'MAINTENANCE' : 'USAGE',
            residency: 'ALL',
            isRepresentative: false
        });
    }
    pricing.standardizedPrices = sp;
    const usagePrices = sp.flatMap(g => (g.rows || [])).filter(r => Number(r.price) > 0 && r.feeType !== 'MAINTENANCE').map(r => Number(r.price));
    if (usagePrices.length > 0) {
        patch.minPrice = Math.min(...usagePrices);
        patch.maxPrice = Math.max(...usagePrices);
        patch.representativePrice = patch.minPrice;
    }

    patch.pricing = typeof dbFac.pricing === 'string' ? JSON.stringify(pricing) : pricing;
}

// 2. 이미지 업로드 & 병합
const allImagesToUpload = [...verifiedImages, ...extraImages];
if (allImagesToUpload.length > 0 || a['clean-foreign-images']) {
    let curImgs = typeof dbFac.images === 'string' ? JSON.parse(dbFac.images || '[]') : (dbFac.images || []);
    if (a['clean-foreign-images']) {
        const prevCount = curImgs.length;
        curImgs = curImgs.filter((u) => !u.includes('/facilities/park-') || u.includes(`/facilities/${targetId}/`));
        console.log(`🧹 타 시설 오매칭 이미지 정리: ${prevCount - curImgs.length}장 제거됨 (남은 이미지: ${curImgs.length}장)`);
    }
    const addedUrls = [];

    for (const im of allImagesToUpload) {
        const localFile = im.isAbsolute ? im.local_path : path.join(DIR, im.local_path);
        if (!fs.existsSync(localFile)) continue;
        const buf = fs.readFileSync(localFile);
        const out = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        const hash = crypto.createHash('sha1').update(out).digest('hex').slice(0, 8);
        const key = `facilities/${targetId}/enrich_${hash}.jpg`;

        const { error: ue } = await sb.storage.from(BUCKET).upload(key, out, { contentType: 'image/jpeg', upsert: true });
        if (ue) {
            console.error(`스토리지 업로드 실패 (${key}):`, ue.message);
            continue;
        }
        const publicUrl = `${SUPA}/storage/v1/object/public/${BUCKET}/${key}`;
        if (!curImgs.includes(publicUrl)) addedUrls.push(publicUrl);
    }

    if (addedUrls.length > 0 || a['clean-foreign-images']) {
        const finalImgs = [...curImgs, ...addedUrls];
        patch.images = typeof dbFac.images === 'string' ? JSON.stringify(finalImgs) : finalImgs;
        if (!dbFac.thumbnail || (dbFac.thumbnail.includes('/facilities/park-') && !dbFac.thumbnail.includes(`/facilities/${targetId}/`))) {
            patch.thumbnail = finalImgs[0] || null;
            console.log(`🖼️ 대표 썸네일 자체 시설 고화질 이미지로 교체: ${patch.thumbnail}`);
        }
    }
}

if (Object.keys(patch).length > 0) {
    const { error: uErr } = await sb.from('Facility').update({ ...patch, updatedAt: new Date().toISOString() }).eq('id', targetId);
    if (uErr) throw new Error(`DB 업데이트 실패: ${uErr.message}`);
    console.log(`✅ [성공] Supabase DB [${targetId}] ${fac.name} 반영 완료!`);
}

console.log(`\n======================================================================\n`);
