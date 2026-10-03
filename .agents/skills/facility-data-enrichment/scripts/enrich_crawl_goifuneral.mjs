#!/usr/bin/env node
// 고이장례(goifuneral.co.kr) 크롤링 데이터 변환기 → candidates/goifuneral.jsonl
// data/goifuneral_prices.csv 의 5,866개 가격 데이터를 시설별로 그룹화하여
// 규격화된 후보 JSONL 형식으로 생성합니다.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { OUT_ROOT, args } from './lib.mjs';

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 필요');
const candDir = path.join(OUT_ROOT, RUN, 'candidates');
fs.mkdirSync(candDir, { recursive: true });
const outPath = path.join(candDir, 'goifuneral.jsonl');

const csvPath = path.resolve('data/goifuneral_prices.csv');
if (!fs.existsSync(csvPath)) {
    console.log(`⚠️ ${csvPath} 파일이 없습니다.`);
    process.exit(0);
}

console.log(`🚀 [고이장례 변환기] RUN=${RUN} 시작...`);

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true
});

console.log(`  -> 총 ${records.length}개 가격 행 로드`);

// 시설별 그룹화 (넘버 + 이름 기준)
const byFacility = new Map();

for (const row of records) {
    const facNo = row['넘버']?.trim() || '';
    const facName = row['이름']?.trim() || '';
    if (!facName) continue;

    const groupKey = `${facNo}_${facName}`;
    if (!byFacility.has(groupKey)) {
        byFacility.set(groupKey, {
            facNo,
            facName,
            rows: []
        });
    }
    byFacility.get(groupKey).rows.push(row);
}

const results = [];

for (const [groupKey, { facNo, facName, rows }] of byFacility) {
    const prices = [];

    for (const r of rows) {
        const itemHeader = r['사용료 항목']?.trim() || '';
        const detailDesc = r['사용료 내역']?.trim() || '';
        const priceRaw = r['요금']?.trim() || '';

        if (!priceRaw || priceRaw === '0' || priceRaw === '0 원') continue;

        // 카테고리 판별 (사용료 / 관리비 / 안치료 / 조성비)
        let category = '사용료';
        if (detailDesc.includes('관리') || itemHeader.includes('관리')) {
            category = '관리비';
        } else if (detailDesc.includes('안치') || itemHeader.includes('안치')) {
            category = '안치료';
        } else if (detailDesc.includes('조성') || itemHeader.includes('조성')) {
            category = '조성비';
        }

        // 품목명 구성
        const itemName = `${itemHeader} ${detailDesc}`.trim();

        // 등급 / 구분 추출 (관내, 관외, 개인, 부부 등)
        let grade = '';
        if (itemHeader.includes('관내')) grade = '관내';
        else if (itemHeader.includes('관외')) grade = '관외';

        // 단위 추출 (예: 30년, 1기당, 15년)
        let unit = '';
        const unitMatch = detailDesc.match(/(\d+년(?:\(연장불가\))?|\d+기당|개인|부부|가족)/g);
        if (unitMatch) unit = unitMatch.join(' / ');

        prices.push({
            category,
            item_name: itemName,
            grade,
            price: priceRaw,
            unit,
            extraction_conf: 0.85,
            evidence: `${facName} [${itemHeader}] ${detailDesc}: ${priceRaw}`
        });
    }

    if (prices.length > 0) {
        results.push({
            source: 'goifuneral',
            source_url: `https://www.goifuneral.co.kr/facilities/${facNo}/`,
            captured_at: '2025-12-25',
            facility: {
                name: facName
            },
            prices,
            images: [] // 고이장례는 가격만 추출
        });
    }
}

fs.writeFileSync(outPath, results.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`✅ [고이장례 변환 완료] 후보 시설 ${results.length}건 (가격 총 ${results.reduce((s, r) => s + r.prices.length, 0)}건) -> ${outPath}`);
