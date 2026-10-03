#!/usr/bin/env node
// 지자체 조례 데이터 변환기 → candidates/ordinance.jsonl
// data/ordinance_hwp/ordinance_summary.csv 의 자치법규 별표 사용료/관리비를
// 규격화된 후보 JSONL 형식으로 변환합니다.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { OUT_ROOT, args } from './lib.mjs';

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 필요');
const candDir = path.join(OUT_ROOT, RUN, 'candidates');
fs.mkdirSync(candDir, { recursive: true });
const outPath = path.join(candDir, 'ordinance.jsonl');

const csvPath = path.resolve('data/ordinance_hwp/ordinance_summary.csv');
if (!fs.existsSync(csvPath)) {
    console.log(`⚠️ ${csvPath} 파일이 없습니다.`);
    process.exit(0);
}

console.log(`🚀 [조례 변환기] RUN=${RUN} 시작...`);

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true
});

const results = [];

for (const row of records) {
    const region = row['지자체']?.trim() || '';
    const filename = row['파일명']?.trim() || '';
    const priceStr = row['가격목록']?.trim() || '';
    const labelStr = row['라벨목록']?.trim() || '';

    if (!priceStr || !region) continue;

    // 시설명 추정 (조례 별표 파일명에서 추출)
    // 예: "[별표 1] 공설묘역시설 사용료 및 관리비(강릉시 장사시설 설치 및 운영 조례).hwpx" -> 강릉시 공설묘지
    let facName = '';
    const m = filename.match(/\((.*?조례)\)/);
    const ordName = m ? m[1] : filename;

    if (filename.includes('화장시설') || filename.includes('화장장')) {
        facName = `${region}공설화장장`;
    } else if (filename.includes('봉안') || filename.includes('추모의 집') || filename.includes('추모의집')) {
        facName = `${region}공설봉안당`;
    } else if (filename.includes('공원묘지') || filename.includes('공설묘역') || filename.includes('공설묘지')) {
        facName = `${region}공설묘지`;
    } else if (filename.includes('안식공원')) {
        facName = `${region}안식공원`;
    } else {
        facName = `${region}공설장사시설`;
    }

    const pricesList = priceStr.split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s) && Number(s) >= 1000);
    const labelsList = labelStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (pricesList.length === 0) continue;

    const prices = [];
    for (let i = 0; i < Math.min(pricesList.length, 10); i++) {
        const pVal = pricesList[i];
        const lbl = labelsList[i] || (i % 2 === 0 ? '사용료' : '관리비');
        const cat = lbl.includes('관리비') ? '관리비' : '사용료';

        prices.push({
            category: cat,
            item_name: `${lbl} (조례 기준)`,
            grade: lbl.includes('관외') ? '관외' : '관내',
            price: `${pVal}원`,
            unit: '조례규정',
            extraction_conf: 0.92,
            evidence: `${region} 자치법규 [${ordName}]: ${lbl} ${pVal}원`
        });
    }

    if (prices.length > 0) {
        results.push({
            source: 'ordinance',
            source_url: `https://www.elis.go.kr/`,
            captured_at: '2025-12-17',
            facility: {
                name: facName,
                address: region
            },
            prices,
            images: []
        });
    }
}

fs.writeFileSync(outPath, results.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`✅ [조례 변환 완료] 후보 시설 ${results.length}건 (가격 총 ${results.reduce((s, r) => s + r.prices.length, 0)}건) -> ${outPath}`);
