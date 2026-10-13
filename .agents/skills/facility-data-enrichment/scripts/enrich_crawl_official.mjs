#!/usr/bin/env node
// 공식 홈페이지 크롤러 → candidates/official_sites.jsonl
// 시설 자체 공식 도메인에서 고화질 실사 및 가격/관리비 정보를 추출합니다.
// ★ 절대 원칙: DB 쓰기 금지 / 블로그 이미지 금지 / 고화질 다운스케일링(sharp) 압축 보관 ★

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { OUT_ROOT, args, runId, parseKrw, loadJson } from './lib.mjs';

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 필요 (export_master.mjs 를 먼저 실행하세요)');

const DIR = path.join(OUT_ROOT, RUN);
const masterPath = path.join(DIR, 'master.json');
if (!fs.existsSync(masterPath)) throw new Error(`${masterPath} 없음`);

const master = loadJson(masterPath);
const facs = master.facilities || [];

const candDir = path.join(DIR, 'candidates');
const stageDir = path.join(DIR, 'staged_images');
fs.mkdirSync(candDir, { recursive: true });
fs.mkdirSync(stageDir, { recursive: true });

const outPath = path.join(candDir, 'official_sites.jsonl');

const seenIds = new Set();
if (fs.existsSync(outPath)) {
    for (const line of fs.readFileSync(outPath, 'utf8').split('\n')) {
        const tr = line.trim();
        if (!tr) continue;
        try {
            const parsed = JSON.parse(tr);
            if (parsed.facility?.id) seenIds.add(parsed.facility.id);
        } catch {}
    }
}

// 블로그 및 중개 플랫폼 도메인 원천 차단
const BANNED_DOMAINS = [
    'blog.naver.com', 'blog.daum.net', 'tistory.com', 'cafe.naver.com', 'cafe.daum.net',
    'goifuneral.co.kr', 'myungdangga.com', 'cheotjang.com', 'post.naver.com'
];

// 크롤링 대상 선정
let targets = facs.filter((f) => {
    if (!f.websiteUrl || !f.websiteUrl.startsWith('http')) return false;
    const urlLower = f.websiteUrl.toLowerCase();
    return !BANNED_DOMAINS.some((b) => urlLower.includes(b));
});

// 이미 크롤링 완료된 시설 제외 (새로고침 옵션 없으면 기본 이어하기)
if (!a.fresh) {
    targets = targets.filter((f) => !seenIds.has(f.id));
}

// ID 필터링
if (a.ids) {
    const idSet = new Set(a.ids.split(',').map((s) => s.trim()));
    targets = targets.filter((f) => idSet.has(f.id));
}

// 우선순위 정렬 (조회수 높은 순 + 결손 우선)
targets.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

// 개수 제한 (기본값: 50개소, --limit all 로 전수 가능)
const limit = a.limit === 'all' ? targets.length : Math.max(1, parseInt(a.limit || '50', 10));
const selectedTargets = targets.slice(0, limit);

console.log(`\n============================================================`);
console.log(`🚀 [공식 홈페이지 크롤러] RUN=${RUN}`);
console.log(`📌 기존 크롤링 완료: ${seenIds.size}개소 | 남은 대상: ${targets.length}개소`);
console.log(`🎯 이번 배치 진행: ${selectedTargets.length}개소`);
console.log(`🔒 안전 규칙: DB 직접 쓰기 0% / 블로그 이미지 100% 차단 / Sharp 1400px 압축`);
console.log(`============================================================\n`);

// 64비트 dHash 계산 함수 (중복 제거용)
async function computeDHash(buffer) {
    try {
        const raw = await sharp(buffer)
            .resize(9, 8, { fit: 'fill' })
            .grayscale()
            .raw()
            .toBuffer();
        let hash = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const left = raw[row * 9 + col];
                const right = raw[row * 9 + col + 1];
                hash += left > right ? '1' : '0';
            }
        }
        return BigInt('0b' + hash).toString(16).padStart(16, '0');
    } catch {
        return null;
    }
}

// 대대손손 표준 명명 규칙에 맞춘 항목명/카테고리/등급 정제 함수
function standardizeItem({ rawCategory, rawName, rawSubLine, rawEvidence, krw, facCategory }) {
    let category = rawCategory || '사용료';
    let name = rawName || '';
    let grade = '개인';
    let unit = '1기';
    let groupType = '일반';

    const fullContext = `${rawCategory} ${rawName} ${rawSubLine} ${rawEvidence}`;

    // 1. 관리비 표준화
    if (category === '관리비' || /관리비/.test(fullContext)) {
        category = '관리비';
        const roomMatch = fullContext.match(/(천상관|황제관|봉황관|주작관|행복관|무지개관|특실|일반실|고급실|VIP)/);
        const room = roomMatch ? roomMatch[1] : '';

        const isCouple = /부부|2위/.test(fullContext);
        grade = isCouple ? '부부 (2위)' : '개인 (1위)';
        name = room ? `관리비(${room})` : isCouple ? '관리비(부부)' : '관리비(개인)';

        const periodMatch = fullContext.match(/(\d+)년\s*(?:단위\s*)?선납/);
        if (periodMatch) {
            unit = `1년 (${periodMatch[1]}년 선납)`;
        } else if (/15년/.test(fullContext)) {
            unit = '1년 (15년 선납)';
        } else if (/5년/.test(fullContext)) {
            unit = '1년 (5년 선납)';
        } else {
            unit = '연관리비';
        }

        return { category, item_name: name, grade, group_type: groupType, price: `${krw}원`, unit };
    }

    // 2. 사용료/분양가 표준화
    const NOISE_WORDS = [/구분/g, /사용기간/g, /단위/g, /사용료/g, /분양가/g, /비고/g, /내용/g, /금액/g, /•/g, /연장/g, /있음/g, /\t/g];
    let cleaned = `${rawName} ${rawSubLine}`;
    for (const nw of NOISE_WORDS) cleaned = cleaned.replace(nw, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (/매장|분묘/.test(cleaned)) {
        category = '매장묘';
    } else if (/평장/.test(cleaned)) {
        category = '평장묘';
    } else if (/수목|잔디|자연장|화초/.test(cleaned)) {
        category = '수목장';
    } else if (/봉안담|야외담|담장/.test(cleaned)) {
        category = '봉안담';
    } else if (/봉안당|납골당|실내/.test(cleaned)) {
        category = '봉안당';
    } else if (facCategory === 'NATURAL_BURIAL') {
        category = '수목장';
    } else if (facCategory === 'FAMILY_GRAVE') {
        category = '매장묘';
    } else {
        category = '봉안당';
    }

    if (/부부/.test(cleaned)) {
        grade = '부부';
    } else if (/가족/.test(cleaned)) {
        const numMatch = cleaned.match(/(\d+)[~\-](\d+)위|(\d+)위/);
        grade = numMatch ? `가족(${numMatch[0]})` : '가족';
    } else {
        grade = '개인';
    }

    const danMatch = cleaned.match(/(\d+)단|로얄단|로열단/);
    if (danMatch) {
        name = `${category} ${danMatch[0]}`;
    } else if (/매장\s*(\d+)단|매장\s*특/.test(cleaned)) {
        const m = cleaned.match(/매장\s*(\d+)단|매장\s*특/);
        name = m ? m[0] : `${category} ${grade}`;
    } else {
        name = `${category} ${grade}`;
    }

    return { category, item_name: name, grade, group_type: groupType, price: `${krw}원`, unit: '1기' };
}

// 이미지 다운로드 및 압축 (1400px WebP, 품질 82)
async function fetchAndCompressImage(url, referer, facilityId, imgIdx) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
                'Referer': referer
            },
            signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 5000) return null; // 너무 작은 파일 스킵

        const meta = await sharp(buf).metadata();
        if (!meta.width || !meta.height) return null;
        if (meta.width < 400 || meta.height < 300) return null; // 저해상도 배제

        const dhash = await computeDHash(buf);

        // 1400px 리사이즈 + WebP 압축
        const compressed = await sharp(buf)
            .resize({ width: 1400, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

        const fileName = `${facilityId}_${String(imgIdx).padStart(2, '0')}.webp`;
        const localRelPath = path.join('staged_images', fileName);
        const localFullPath = path.join(DIR, localRelPath);
        fs.writeFileSync(localFullPath, compressed);

        const compMeta = await sharp(compressed).metadata();

        return {
            url,
            local_path: localRelPath,
            width: compMeta.width,
            height: compMeta.height,
            size_kb: Math.round(compressed.length / 1024),
            dhash,
            license: 'official',
            is_original: true
        };
    } catch {
        return null;
    }
}

// 메인 크롤링 루프
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 }
    });

    const candidates = [];
    let totalImagesFound = 0;
    let totalPricesFound = 0;

    for (let i = 0; i < selectedTargets.length; i++) {
        const fac = selectedTargets[i];
        console.log(`\n[${i + 1}/${selectedTargets.length}] 🌐 [${fac.id}] ${fac.name}`);
        console.log(`   홈페이지: ${fac.websiteUrl}`);

        const candidate = {
            source: 'official_homepage',
            source_url: fac.websiteUrl,
            captured_at: new Date().toISOString().slice(0, 10),
            matched_facility_id: fac.id,
            facility: {
                id: fac.id,
                name: fac.name,
                address: fac.address,
                phone: fac.phone,
                lat: fac.lat,
                lng: fac.lng
            },
            prices: [],
            images: []
        };

        const page = await context.newPage();
        page.setDefaultTimeout(12000);

        try {
            // 1. 메인 페이지 로드
            await page.goto(fac.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
            await page.waitForTimeout(1000);

            // 레이지 로딩 방어: 스크롤 훑기
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.waitForTimeout(500);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(800);

            // 서브페이지 링크 탐색 (가격, 시설안내, 갤러리 등)
            const subLinks = await page.evaluate(() => {
                const keywords = ['안내', '시설', '비용', '가격', '이용', '갤러리', '풍경', '사진', '소개', '납골', '봉안', '수목', '묘역', '상품', '묘원', '추모', 'product', 'facility', 'guide', 'price', 'fee', 'about', 'gallery'];
                const links = [];
                const seen = new Set();
                const curHost = window.location.hostname.replace(/^www\./, '');

                for (const a of document.querySelectorAll('a')) {
                    const href = a.href;
                    if (!href || !href.startsWith('http')) continue;
                    try {
                        const u = new URL(href);
                        const linkHost = u.hostname.replace(/^www\./, '');
                        if (linkHost !== curHost && !linkHost.endsWith('.' + curHost) && !curHost.endsWith('.' + linkHost)) continue; // 외부 링크 배제
                        const text = (a.innerText || '').trim();
                        const title = (a.getAttribute('title') || '').trim();
                        const combined = `${text} ${title} ${href}`.toLowerCase();
                        if (keywords.some((k) => combined.includes(k)) && !seen.has(href)) {
                            seen.add(href);
                            links.push({ href, text });
                        }
                    } catch {}
                }
                return links.slice(0, 6); // 최대 6개 서브페이지
            });

            const pagesToVisit = [
                { href: page.url(), text: '메인' },
                ...subLinks
            ];

            const collectedImgUrls = new Set();
            const rawPriceTexts = [];

            // 각 페이지 방문 및 정보 추출
            for (const p of pagesToVisit) {
                try {
                    if (p.href !== page.url()) {
                        await page.goto(p.href, { waitUntil: 'domcontentloaded', timeout: 12000 });
                        await page.waitForTimeout(1000);
                        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                        await page.waitForTimeout(500);
                    }

                    // 1) 이미지 URL 수집
                    const imgs = await page.evaluate(() => {
                        const list = [];
                        // 1. img 및 a 태그 직링크
                        for (const el of document.querySelectorAll('img, a[href$=".jpg"], a[href$=".png"], a[href$=".jpeg"], a[href$=".webp"]')) {
                            let src = el.tagName === 'A' ? el.href : (el.currentSrc || el.src || el.getAttribute('data-original') || el.getAttribute('data-src') || el.getAttribute('data-lazy-src'));
                            if (!src || !src.startsWith('http')) continue;
                            const lower = src.toLowerCase();
                            if (lower.includes('logo') || lower.includes('icon') || lower.includes('btn') || lower.includes('arrow') || lower.includes('sns') || lower.includes('footer')) continue;
                            list.push(src);
                        }
                        // 2. background-image 인라인 스타일
                        for (const el of document.querySelectorAll('[style*="background"]')) {
                            const style = el.getAttribute('style') || '';
                            const m = style.match(/url\(['"]?(https?:\/\/[^'")]+)['"]?\)/i);
                            if (m && m[1]) {
                                const lower = m[1].toLowerCase();
                                if (!lower.includes('logo') && !lower.includes('icon') && !lower.includes('btn') && !lower.includes('arrow') && !lower.includes('sns')) {
                                    list.push(m[1]);
                                }
                            }
                        }
                        return list;
                    });
                    for (const u of imgs) collectedImgUrls.add(u);

                    // 2) 텍스트 및 가격 패턴 수집
                    const pageText = await page.evaluate(() => document.body.innerText || '');
                    rawPriceTexts.push({ url: p.href, text: pageText });
                } catch (pageErr) {
                    // 서브페이지 오류는 건너뜀
                }
            }

            // 3. 고화질 실사 이미지 다운로드 및 압축 (최대 6장)
            const imgCandidates = Array.from(collectedImgUrls).slice(0, 15);
            let imgSavedCount = 0;

            for (const imgUrl of imgCandidates) {
                if (imgSavedCount >= 6) break;
                // 블로그 도메인 이미지 2차 차단
                if (BANNED_DOMAINS.some((b) => imgUrl.toLowerCase().includes(b))) continue;

                const comp = await fetchAndCompressImage(imgUrl, fac.websiteUrl, fac.id, imgSavedCount + 1);
                if (comp) {
                    imgSavedCount++;
                    candidate.images.push(comp);
                }
            }
            totalImagesFound += candidate.images.length;
            console.log(`   📸 고화질 실사 수집/압축: ${candidate.images.length}장`);

            // 4. 가격/관리비 텍스트 분석 및 추출
            const parsedPrices = [];
            for (const { url: sourceUrl, text } of rawPriceTexts) {
                // 관리비 패턴: e.g. "관리비(1위기준): 일반실 1년 60,000원", "관리비: 1년 80,000원"
                const feeMatches = text.matchAll(/(관리비[^\n:]{0,20})[:\s]+([^\n]{3,60})/g);
                for (const m of feeMatches) {
                    const label = m[1].trim();
                    const valStr = m[2].trim();
                    // 금액 추출
                    const amtMatch = valStr.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(원|천원|만원)/);
                    if (amtMatch) {
                        const krw = parseKrw(amtMatch[0]);
                        if (krw && krw >= 10000 && krw <= 10000000) {
                            const std = standardizeItem({
                                rawCategory: '관리비',
                                rawName: label,
                                rawSubLine: valStr,
                                rawEvidence: `${label}: ${valStr.slice(0, 80)}`,
                                krw,
                                facCategory: fac.category
                            });
                            parsedPrices.push({
                                ...std,
                                extraction_conf: 0.9,
                                evidence: `${label}: ${valStr.slice(0, 80)}`
                            });
                        }
                    }
                }

                // 분양가/사용료 표 패턴
                const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
                for (let li = 0; li < lines.length; li++) {
                    const line = lines[li];
                    if (/분양가|사용료|안치료|봉안료/.test(line) && line.length < 50) {
                        // 다음 1~5줄 탐색
                        for (let k = 1; k <= 5 && li + k < lines.length; k++) {
                            const subLine = lines[li + k];
                            const krwMatch = subLine.match(/(\d{1,3}(?:,\d{3})+|\d+)\s*(원|천원|만원)/);
                            if (krwMatch) {
                                const krw = parseKrw(krwMatch[0]);
                                if (krw && krw >= 500000) {
                                    const std = standardizeItem({
                                        rawCategory: '사용료',
                                        rawName: line,
                                        rawSubLine: subLine,
                                        rawEvidence: `${line} -> ${subLine.slice(0, 60)}`,
                                        krw,
                                        facCategory: fac.category
                                    });
                                    parsedPrices.push({
                                        ...std,
                                        extraction_conf: 0.85,
                                        evidence: `${line} -> ${subLine.slice(0, 60)}`
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // 중복 가격 제거
            const seenPriceKeys = new Set();
            for (const p of parsedPrices) {
                const k = `${p.category}|${p.item_name}|${p.price}`;
                if (!seenPriceKeys.has(k)) {
                    seenPriceKeys.add(k);
                    candidate.prices.push(p);
                }
            }
            totalPricesFound += candidate.prices.length;
            console.log(`   💰 가격/관리비 후보 발견: ${candidate.prices.length}건`);

            candidates.push(candidate);
            fs.appendFileSync(outPath, JSON.stringify(candidate) + '\n', 'utf8');
        } catch (facErr) {
            console.log(`   ⚠️ 크롤링 오류 (${facErr.message}) - 스킵`);
            const stub = {
                source: 'official_site',
                crawled_at: new Date().toISOString(),
                facility: { id: fac.id, name: fac.name, phone: fac.phone, address: fac.address, websiteUrl: fac.websiteUrl },
                images: [],
                prices: [],
                status: 'crawl_failed'
            };
            candidates.push(stub);
            fs.appendFileSync(outPath, JSON.stringify(stub) + '\n', 'utf8');
        } finally {
            await page.close().catch(() => {});
        }
    }

    await browser.close();

    console.log(`\n============================================================`);
    console.log(`✅ [공식 홈페이지 크롤링 완료]`);
    console.log(`📁 저장 경로: ${outPath}`);
    console.log(`📸 총 압축 저장된 고화질 이미지: ${totalImagesFound}장 (위치: ${stageDir})`);
    console.log(`💰 총 발견된 가격/관리비 후보: ${totalPricesFound}건`);
    console.log(`🔒 안전 확인: DB 또는 어드민 API에는 단 1건도 반영되지 않았습니다.`);
    console.log(`============================================================\n`);
})();
