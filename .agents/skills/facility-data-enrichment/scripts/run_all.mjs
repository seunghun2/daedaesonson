#!/usr/bin/env node
// 데이터 보강 통합 파이프라인 원클릭 실행기
// 1. export_master (DB 스냅샷 & 큐 생성)
// 2. enrich_crawl_esky (e하늘 공공 데이터 수집)
// 3. enrich_crawl_goifuneral (고이장례 가격 데이터 수집)
// 4. enrich_crawl_ordinance (지자체 조례 데이터 수집)
// 5. build_update_sheets (업데이트 시트 생성 및 점수 산정)
//
// ⚠️ 안전 원칙: 이 스크립트는 DB/어드민을 절대 수정하지 않고, 시트(CSV/MD)만 생성합니다.
// 실제 DB 반영은 사람이 시트 검수 후 별도로 apply_approved.mjs --apply 를 실행할 때만 동작합니다.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runId, args } from './lib.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const a = args();
const RUN = a.run || runId();

console.log(`\n==================================================`);
console.log(`🚀 [대대손손 데이터 보강 파이프라인] RUN=${RUN}`);
console.log(`🔒 안전 모드: DB 쓰기 없음 (업데이트 시트 생성 전용)`);
console.log(`==================================================\n`);

const steps = [
    { name: '0단계: 원본 DB 스냅샷 & 작업 큐 생성', script: 'export_master.mjs', args: ['--run', RUN] },
    { name: '1-1단계: e하늘(15774129) 공공 사진/가격 수집', script: 'enrich_crawl_esky.mjs', args: ['--run', RUN] },
    { name: '1-2단계: 고이장례 가격 데이터 추출/변환', script: 'enrich_crawl_goifuneral.mjs', args: ['--run', RUN] },
    { name: '1-3단계: 지자체 조례 자치법규 요금 추출/변환', script: 'enrich_crawl_ordinance.mjs', args: ['--run', RUN] },
    { name: '2단계: 통합 업데이트 시트 생성 & 신뢰도 산정', script: 'build_update_sheets.mjs', args: ['--run', RUN] },
];

for (const step of steps) {
    console.log(`\n▶️ ${step.name}...`);
    const scriptPath = path.join(SCRIPT_DIR, step.script);
    const res = spawnSync('node', [scriptPath, ...step.args], {
        stdio: 'inherit',
        env: process.env,
    });
    if (res.status !== 0) {
        console.error(`❌ [오류 발생] ${step.script} 실행 실패 (종료 코드: ${res.status})`);
        process.exit(res.status || 1);
    }
}

console.log(`\n==================================================`);
console.log(`🎉 [파이프라인 완료] data/enrichment/${RUN}/ 확인`);
console.log(`   - 02_price_updates.csv  : 가격 업데이트 시트`);
console.log(`   - 03_image_updates.csv  : 이미지 업데이트 시트`);
console.log(`   - 04_unmatched.csv      : 미매칭 목록`);
console.log(`   - 05_summary.md         : 요약 리포트`);
console.log(`==================================================\n`);
