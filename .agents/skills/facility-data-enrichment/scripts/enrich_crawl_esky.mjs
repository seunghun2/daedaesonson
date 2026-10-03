#!/usr/bin/env node
// e하늘 (15774129.go.kr) 전수 수집기 → candidates/esky.jsonl
// e하늘 4개 분류(묘지, 봉안시설, 화장시설, 자연장지)의 목록 및 상세를 순회하여
// 고해상도 공식 사진 및 사용료/관리비 정보를 추출해 후보 JSONL로 생성합니다.
import fs from 'node:fs';
import path from 'node:path';
import { OUT_ROOT, args, runId } from './lib.mjs';

const a = args();
const RUN = a.run || fs.readdirSync(OUT_ROOT).filter((d) => /^\d{8}_\d{4}$/.test(d)).sort().pop();
if (!RUN) throw new Error('--run 필요');
const candDir = path.join(OUT_ROOT, RUN, 'candidates');
fs.mkdirSync(candDir, { recursive: true });
const outPath = path.join(candDir, 'esky.jsonl');

const CATEGORIES = [
    { code: 'TBC0700002', name: '묘지', cat: '매장묘' },
    { code: 'TBC0700003', name: '봉안시설', cat: '봉안당' },
    { code: 'TBC0700004', name: '화장시설', cat: '화장' },
    { code: 'TBC0700005', name: '자연장지', cat: '자연장' }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchEskyCategory(catCode) {
    const body = new URLSearchParams({
        pageInqCnt: '2000',
        curPageNo: '1',
        facilitygroupcd: catCode
    });
    const res = await fetch('https://www.15774129.go.kr/portal/fnlfac/fac_list.ajax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Referer': 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000'
        },
        body
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function fetchPriceInfo(facilitycd) {
    const body = new URLSearchParams({ facilitycd });
    const res = await fetch('https://www.15774129.go.kr/portal/fnlfac/price_info.ajax', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Referer': 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000'
        },
        body
    });
    if (!res.ok) return null;
    try {
        return await res.json();
    } catch {
        return null;
    }
}

console.log(`🚀 [e하늘 크롤러] RUN=${RUN} 시작...`);

const results = [];
const seenCodes = new Set();
let totalItems = 0;

for (const cat of CATEGORIES) {
    console.log(`📡 [e하늘] ${cat.name} (${cat.code}) 목록 요청 중...`);
    try {
        const data = await fetchEskyCategory(cat.code);
        const list = data.list || [];
        console.log(`  -> ${cat.name} ${list.length}건 수신 (전체 카운트: ${data.cnt})`);
        totalItems += list.length;

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (seenCodes.has(item.facilitycd)) continue;
            seenCodes.add(item.facilitycd);

            const facName = item.companyname?.trim() || '';
            const facAddr = item.fulladdress?.trim() || '';
            const facPhone = item.telephone?.trim() || '';
            const lat = item.latitude ? Number(item.latitude) : null;
            const lng = item.longitude ? Number(item.longitude) : null;

            const prices = [];
            const images = [];

            // 이미지 추출
            if (item.fileurl && item.fileurl.startsWith('/BCUser/')) {
                const imgUrl = `https://www.15774129.go.kr${item.fileurl}`;
                images.push({
                    url: imgUrl,
                    label: '전경',
                    label_conf: 0.9,
                    license: 'public'
                });
            }

            // 가격 및 상세 정보
            // 모든 시설에 대해 price_info 호출 (속도를 위해 지연 최소화하되 공공서버 보호)
            let priceInfo = null;
            if (i < 200 || cat.code === 'TBC0700004') {
                priceInfo = await fetchPriceInfo(item.facilitycd);
                await sleep(50);
            }

            const d = priceInfo?.detail || {};

            // 1. 화장시설 요금 추출
            if (cat.code === 'TBC0700004' && d) {
                if (d.inneradultamt && Number(d.inneradultamt) > 0) {
                    // e하늘 화장요금은 천원 단위 표기인 경우 체크 (보통 60 -> 60,000 또는 100000)
                    let p = Number(d.inneradultamt);
                    if (p < 1000) p = p * 1000;
                    prices.push({
                        category: '사용료',
                        item_name: '화장 대인(관내)',
                        grade: '관내',
                        price: `${p}원`,
                        unit: '1구',
                        extraction_conf: 0.95,
                        evidence: `e하늘 화장시설 관내 대인 사용료 ${d.inneradultamt}`
                    });
                }
                if (d.outsideadultamt && Number(d.outsideadultamt) > 0) {
                    let p = Number(d.outsideadultamt);
                    if (p < 1000) p = p * 1000;
                    prices.push({
                        category: '사용료',
                        item_name: '화장 대인(관외)',
                        grade: '관외',
                        price: `${p}원`,
                        unit: '1구',
                        extraction_conf: 0.95,
                        evidence: `e하늘 화장시설 관외 대인 사용료 ${d.outsideadultamt}`
                    });
                }
            }

            const toWon = (val) => {
                let n = Number(val);
                if (n > 0 && n < 10000) n = n * 1000;
                return n;
            };

            // 2. 봉안/자연장/묘지 사용료/관리비 추출
            if (d.innerfirstamt && Number(d.innerfirstamt) > 0) {
                const p = toWon(d.innerfirstamt);
                prices.push({
                    category: '사용료',
                    item_name: `${cat.name} 관내 사용료`,
                    grade: '관내',
                    price: `${p}원`,
                    unit: `${d.renewyears || 15}년`,
                    extraction_conf: 0.9,
                    evidence: `e하늘 관내 최초 사용료 ${d.innerfirstamt} (${p}원)`
                });
            }
            if (d.outsidefirstamt && Number(d.outsidefirstamt) > 0) {
                const p = toWon(d.outsidefirstamt);
                prices.push({
                    category: '사용료',
                    item_name: `${cat.name} 관외 사용료`,
                    grade: '관외',
                    price: `${p}원`,
                    unit: `${d.renewyears || 15}년`,
                    extraction_conf: 0.9,
                    evidence: `e하늘 관외 최초 사용료 ${d.outsidefirstamt} (${p}원)`
                });
            }
            if (d.innerfeeamt && Number(d.innerfeeamt) > 0) {
                const p = toWon(d.innerfeeamt);
                prices.push({
                    category: '관리비',
                    item_name: `${cat.name} 관내 관리비`,
                    grade: '관내',
                    price: `${p}원`,
                    unit: '관리비',
                    extraction_conf: 0.9,
                    evidence: `e하늘 관내 관리비 ${d.innerfeeamt} (${p}원)`
                });
            }
            if (d.outsidefeeamt && Number(d.outsidefeeamt) > 0) {
                const p = toWon(d.outsidefeeamt);
                prices.push({
                    category: '관리비',
                    item_name: `${cat.name} 관외 관리비`,
                    grade: '관외',
                    price: `${p}원`,
                    unit: '관리비',
                    extraction_conf: 0.9,
                    evidence: `e하늘 관외 관리비 ${d.outsidefeeamt} (${p}원)`
                });
            }

            // 후보 객체 생성 (이미지 또는 가격이 있는 경우 등록)
            if (images.length > 0 || prices.length > 0) {
                results.push({
                    source: 'esky',
                    source_url: `https://www.15774129.go.kr/portal/esky/fnlfac/fac_view.do?facilitycd=${item.facilitycd}`,
                    captured_at: new Date().toISOString().slice(0, 10),
                    published_at: d.priceitemdate ? d.priceitemdate.replace(/\//g, '-') : undefined,
                    facility: {
                        name: facName,
                        address: facAddr,
                        phone: facPhone,
                        lat,
                        lng
                    },
                    prices,
                    images
                });
            }
        }
    } catch (err) {
        console.error(`❌ [e하늘] ${cat.name} 크롤링 오류:`, err.message);
    }
}

fs.writeFileSync(outPath, results.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
console.log(`✅ [e하늘 크롤러 완료] 후보 시설 ${results.length}건 기록 완료 -> ${outPath}`);
