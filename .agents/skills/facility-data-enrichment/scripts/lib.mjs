// 공용 유틸: env 로드, Supabase, CSV 입출력, 정규화, 유사도, 점수 공식
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PROJECT_ROOT = path.resolve(SKILL_DIR, '../../..');
export const OUT_ROOT = path.join(PROJECT_ROOT, 'data', 'enrichment');

// ---------- env / supabase ----------
export function loadEnv() {
    for (const f of ['.env.local', '.env']) {
        const p = path.join(PROJECT_ROOT, f);
        if (!fs.existsSync(p)) continue;
        for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
        }
    }
}

export function supabaseAdmin() {
    loadEnv();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY 가 .env.local 에 필요합니다.');
    return createClient(url, key, { auth: { persistSession: false } });
}

/** Supabase 1000행 제한을 넘어 전체 조회 */
export async function fetchAll(sb, table, columns, pageSize = 1000) {
    const out = [];
    for (let page = 0; ; page++) {
        const { data, error } = await sb.from(table).select(columns)
            .order('id', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        out.push(...data);
        if (data.length < pageSize) break;
    }
    return out;
}

// ---------- config ----------
export function loadJson(p, fallback = null) {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}
export const loadScoring = () => loadJson(path.join(SKILL_DIR, 'config', 'scoring.json'));
export const loadSources = () => loadJson(path.join(SKILL_DIR, 'config', 'sources.json'));

// ---------- CSV ----------
const q = (v) => {
    if (v === null || v === undefined) return '""';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
};
/** UTF-8 BOM 포함 CSV (엑셀/구글시트 한글 깨짐 방지) */
export function writeCsv(file, headers, rows) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const lines = [headers.map(q).join(',')];
    for (const r of rows) lines.push(headers.map((h) => q(r[h])).join(','));
    fs.writeFileSync(file, '\uFEFF' + lines.join('\r\n') + '\r\n', 'utf8');
}
export function readCsv(file) {
    const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
}
export function readJsonl(file) {
    return fs.readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
        try { return JSON.parse(l); } catch { throw new Error(`${file}:${i + 1} JSON 파싱 실패`); }
    });
}

// ---------- 정규화 ----------
const SIDO = {
    서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시', 광주: '광주광역시',
    대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시', 경기: '경기도', 강원: '강원특별자치도',
    충북: '충청북도', 충남: '충청남도', 전북: '전북특별자치도', 전남: '전라남도', 경북: '경상북도',
    경남: '경상남도', 제주: '제주특별자치도',
};
export function normName(s = '') {
    return String(s)
        .replace(/\(재\)|\(주\)|\(사\)|재단법인|사단법인|주식회사|종교법인/g, '')
        .replace(/[()\[\]{}·.,\-_/\s]/g, '')
        .toLowerCase();
}
export function normAddr(s = '') {
    let a = String(s).replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim();
    const first = a.split(' ')[0];
    for (const [k, v] of Object.entries(SIDO)) {
        if (first === k || first === k + '시' || first === k + '도' || (first.startsWith(k) && first !== v)) {
            a = a.replace(first, v); break;
        }
    }
    return a.replace(/강원도/, '강원특별자치도').replace(/전라북도/, '전북특별자치도').replace(/\s/g, '');
}
export const digits = (s = '') => String(s).replace(/\D/g, '');
export const normKey = (s = '') => String(s).replace(/[\s()\[\]·.,\-_/]/g, '').toLowerCase();

/** "500만원", "1,200,000원", "3억 5천만원" → 원 단위 정수. 해석 불가 시 null */
export function parseKrw(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? Math.round(raw) : null;
    const s = String(raw).replace(/[,\s원₩]/g, '');
    if (/^\d+(\.\d+)?$/.test(s)) return Math.round(Number(s));
    let total = 0, matched = false;
    const re = /(\d+(?:\.\d+)?)(억|천만|백만|십만|만|천)/g;
    let m;
    const mult = { 억: 1e8, 천만: 1e7, 백만: 1e6, 십만: 1e5, 만: 1e4, 천: 1e3 };
    while ((m = re.exec(s))) { total += Number(m[1]) * mult[m[2]]; matched = true; }
    return matched ? Math.round(total) : null;
}

// ---------- 유사도 ----------
export function dice(a = '', b = '') {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const grams = (s) => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); } return m; };
    const A = grams(a), B = grams(b);
    let inter = 0, total = 0;
    for (const [g, c] of A) { inter += Math.min(c, B.get(g) || 0); total += c; }
    for (const c of B.values()) total += c;
    return total ? (2 * inter) / total : 0;
}
export function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * 시설 매칭 점수 M (0~1). 신호가 없는 항목은 가중치에서 제외 후 재정규화.
 * 반환: { score, features: {name_sim, addr_sim, phone_score, geo_score} }
 */
export function matchScore(src, fac, cfg) {
    const w = cfg.match.weights;
    const srcNormName = src._normName ?? (src.name ? normName(src.name) : '');
    const facNormName = fac._normName ?? (fac.name ? normName(fac.name) : '');
    const srcNormAddr = src._normAddr ?? (src.address ? normAddr(src.address) : '');
    const facNormAddr = fac._normAddr ?? (fac.address ? normAddr(fac.address) : '');
    const f = {
        name_sim: srcNormName && facNormName ? Math.max(dice(srcNormName, facNormName),
            facNormName.includes(srcNormName) || srcNormName.includes(facNormName) ? 0.9 : 0) : null,
        addr_sim: srcNormAddr && facNormAddr ? dice(srcNormAddr, facNormAddr) : null,
        phone_score: null,
        geo_score: null,
    };
    const p1 = src._digitsPhone ?? digits(src.phone), p2 = fac._digitsPhone ?? digits(fac.phone);
    if (p1.length >= 8 && p2.length >= 8) f.phone_score = p1 === p2 ? 1 : p1.slice(-8) === p2.slice(-8) ? 0.8 : 0;
    if (src.lat && src.lng && fac.lat && fac.lng) {
        const d = haversineKm(+src.lat, +src.lng, +fac.lat, +fac.lng);
        f.geo_score = Math.max(0, 1 - d / cfg.match.geo_zero_km);
    }
    let num = 0, den = 0;
    for (const k of Object.keys(w)) if (f[k] !== null) { num += w[k] * f[k]; den += w[k]; }
    let score = den ? num / den : 0;
    // 하드 가드: 이름이 거의 다르면 다른 신호가 좋아도 상한
    if (f.name_sim !== null && f.name_sim < cfg.match.name_floor) score = Math.min(score, cfg.match.review);
    return { score: round(score), features: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === null ? '' : round(v)])) };
}

export const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

export function freshness(publishedAt, capturedAt, cfg) {
    const ref = publishedAt || capturedAt;
    if (!ref) return cfg.confidence.freshness_unknown;
    const months = (Date.now() - new Date(ref).getTime()) / (30.44 * 864e5);
    if (!Number.isFinite(months)) return cfg.confidence.freshness_unknown;
    return round(Math.max(cfg.confidence.freshness_floor, Math.exp(-Math.max(0, months) / cfg.confidence.freshness_halflife_months * Math.LN2)));
}

/** 가격 상식 검사: 카테고리별 밴드 + 기존값 대비 배율 */
export function priceSanity(price, category, currentPrice, cfg) {
    if (!Number.isFinite(price) || price <= 0) return 0;
    const band = cfg.sanity.bands[category] || cfg.sanity.bands.default;
    if (price < band[0] || price > band[1]) return cfg.sanity.out_of_band;
    if (currentPrice > 0) {
        const r = Math.max(price, currentPrice) / Math.min(price, currentPrice);
        if (r >= cfg.sanity.ratio_hard) return cfg.sanity.out_of_band;
        if (r >= cfg.sanity.ratio_soft) return cfg.sanity.ratio_penalty;
    }
    return 1;
}

export function runId() {
    const d = new Date(Date.now() + 9 * 3600e3).toISOString(); // KST
    return d.slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})(\d{4})$/, '$1_$2');
}
export function args() {
    const a = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith('--')) continue;
        const k = argv[i].slice(2);
        a[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
    return a;
}
