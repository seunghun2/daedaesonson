#!/usr/bin/env node
// Gemini 2.5 Flash Vision을 활용한 공홈 수집 데이터 정밀 감사 및 라벨링 스크립트
// 1. 수집된 고화질 이미지 중 실제 시설 실사(전경, 봉안실, 제례실 등)만 엄선하고 배너/공지 포스터 필터링
// 2. 팜플렛/포스터 내에 숨겨진 층별 분양가 및 관리비 표 OCR 추출 및 표준화
// ★ 절대 원칙: DB 쓰기 금지 / 오직 로컬 candidate 갱신만 수행 ★

import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OUT_ROOT, args, loadJson, loadEnv } from './lib.mjs';

loadEnv();

let apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey && fs.existsSync('.env.local')) {
    for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
        const m = l.match(/^\s*(?:GEMINI_API_KEY|GOOGLE_API_KEY)\s*=\s*['\"]?(.*?)['\"]?\s*$/);
        if (m && m[1]) { apiKey = m[1]; break; }
    }
}

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY 또는 GOOGLE_API_KEY가 필요합니다.');
    process.exit(1);
}

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 필요');

const DIR = path.join(OUT_ROOT, RUN);
const candFile = path.join(DIR, 'candidates', 'official_sites.jsonl');
if (!fs.existsSync(candFile)) throw new Error(`${candFile} 없음. 크롤러를 먼저 실행하세요.`);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
});

const candidates = fs.readFileSync(candFile, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(JSON.parse);

console.log(`\n============================================================`);
console.log(`🧠 [Gemini Flash Vision 정밀 판독기] RUN=${RUN}`);
console.log(`📌 대상 후보 시설: ${candidates.length}개소`);
console.log(`🔒 안전 규칙: DB 직접 쓰기 0% / 오직 로컬 후보 정제 및 라벨링만 수행`);
console.log(`============================================================\n`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function analyzeImageWithFlash(localFullPath, facName) {
    if (!fs.existsSync(localFullPath)) return null;
    const buf = fs.readFileSync(localFullPath);
    const base64 = buf.toString('base64');

    const prompt = `
당신은 대한민국 최고의 장사시설(추모공원, 봉안당, 수목장, 묘지) 데이터 검수 전문가입니다.
시설명: "${facName}"

제공된 이미지를 정밀 분석하여 다음 JSON 스키마로만 응답하세요:
{
  "is_facility_photo": boolean, // 실제 장사시설(건물 외관, 묘역 전경, 실내 봉안실, 안치단, 야외 봉안담, 수목, 제례실, 휴게실) 실사 사진이면 true. 단순 버스광고, 텍스트 배너, 약도, 할인 이벤트 팝업, 공지 포스터면 false.
  "label": string, // '전경' | '봉안실' | '야외봉안담' | '수목장' | '매장묘' | '제례실' | '휴게시설' | '포스터_공지' | '기타'
  "caption": string, // 10자 이내의 대대손손 표준 사진 설명 (예: "본관 전경", "실내 봉안당 안치단", "야외 봉안담 전경", "제례실 제단")
  "has_price_table": boolean, // 이미지 내에 사용료, 분양가, 관리비 등의 가격표가 포함되어 있는지 여부
  "extracted_prices": [ // 가격표가 있는 경우만 추출
    {
      "category": string, // '봉안당' | '봉안담' | '수목장' | '평장묘' | '매장묘' | '관리비'
      "item_name": string, // 대대손손 표준 명칭 (예: "봉안당 개인 1단", "관리비(일반실)", "수목장 부부형")
      "grade": string, // '개인' | '부부' | '가족' | '개인 (1위)' | '부부 (2위)'
      "price_krw": number, // 원 단위 정수 숫자 (예: 5000000, 60000)
      "unit": string // '1기' 또는 '1년' 또는 '1년 (5년 선납)'
    }
  ]
}
`;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await model.generateContent([
                prompt,
                { inlineData: { data: base64, mimeType: 'image/webp' } }
            ]);
            const text = res.response.text();
            return JSON.parse(text);
        } catch (err) {
            if (attempt < 3) {
                await sleep(1500 * attempt);
            } else {
                console.error(`   ⚠️ Flash 호출 에러:`, err.message);
                return null;
            }
        }
    }
}

(async () => {
    let approvedImagesCount = 0;
    let rejectedImagesCount = 0;
    let newPricesFromOcr = 0;

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        console.log(`[${i + 1}/${candidates.length}] 🔍 [${c.facility.id}] ${c.facility.name} (이미지 ${c.images.length}장 판독 중...)`);

        const refinedImages = [];
        for (let j = 0; j < c.images.length; j++) {
            const im = c.images[j];
            if (im.label_conf === 0.95 && im.label) {
                refinedImages.push(im);
                approvedImagesCount++;
                continue;
            }

            const fullPath = path.join(DIR, im.local_path);
            const analysis = await analyzeImageWithFlash(fullPath, c.facility.name);
            await sleep(400); // 레이트 리밋 방지

            if (!analysis) {
                refinedImages.push(im);
                continue;
            }

            if (analysis.is_facility_photo) {
                approvedImagesCount++;
                im.label = analysis.label;
                im.caption = analysis.caption;
                im.label_conf = 0.95;
                refinedImages.push(im);
                console.log(`   ✅ [사진 승인] [${analysis.label}] ${analysis.caption} (${path.basename(im.local_path)})`);
            } else {
                rejectedImagesCount++;
                console.log(`   🚫 [사진 제외] ${analysis.label} (광고/포스터 제외: ${path.basename(im.local_path)})`);
            }

            // 이미지 내 가격표 발견 시 표준 가격 배열에 추가
            if (analysis.has_price_table && Array.isArray(analysis.extracted_prices) && analysis.extracted_prices.length > 0) {
                for (const ep of analysis.extracted_prices) {
                    if (ep.price_krw && ep.price_krw > 0) {
                        c.prices.push({
                            category: ep.category || '사용료',
                            item_name: ep.item_name || '사용료',
                            grade: ep.grade || '개인',
                            price: `${ep.price_krw}원`,
                            unit: ep.unit || '1기',
                            extraction_conf: 0.95,
                            evidence: `[Gemini Vision 팜플렛 OCR] ${im.url}`
                        });
                        newPricesFromOcr++;
                        console.log(`   💎 [팜플렛 가격 발견] [${ep.category}] ${ep.item_name}: ${ep.price_krw.toLocaleString()}원 (${ep.unit})`);
                    }
                }
            }
        }

        c.images = refinedImages;
        // 시설 단위 즉시 저장 (안전성 보장)
        fs.writeFileSync(candFile, candidates.map((c) => JSON.stringify(c)).join('\n') + '\n', 'utf8');
    }

    // 정제된 candidates 파일 덮어쓰기
    const jsonlContent = candidates.map((c) => JSON.stringify(c)).join('\n') + '\n';
    fs.writeFileSync(candFile, jsonlContent, 'utf8');

    console.log(`\n============================================================`);
    console.log(`🎉 [Gemini Flash 정밀 감사 및 라벨링 완료]`);
    console.log(`✅ 승인된 순수 시설 실사 사진: ${approvedImagesCount}장 (표준 라벨 부여 완료)`);
    console.log(`🚫 필터링된 비시설 사진(포스터/광고): ${rejectedImagesCount}장 (제외 완료)`);
    console.log(`💰 팜플렛 OCR로 신규 발굴된 가격: ${newPricesFromOcr}건`);
    console.log(`🔒 안전 확인: DB 또는 어드민 API에는 단 1건도 반영되지 않았습니다.`);
    console.log(`============================================================\n`);
})();
