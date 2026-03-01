/**
 * park-0042 별그리다(THE HILL) — TREE_BURIAL → NATURAL 수정 (수목장 탭 한글 표시)
 * park-0618 별그리다(THE WALL) — park-0042와 동일한 가격표로 맞춤
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const fp = path.join(__dirname, '..', 'data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// ============================================================
// park-0042: TREE_BURIAL → NATURAL (수목장 탭 영어 → 한글 수정)
// ============================================================
const p42 = data.find(x => x.id === 'park-0042');
if (p42 && p42.priceInfo && p42.priceInfo.standardizedPrices) {
    let changed = 0;
    for (const sp of p42.priceInfo.standardizedPrices) {
        if (sp.serviceType === 'TREE_BURIAL') {
            sp.serviceType = 'NATURAL';
            changed++;
        }
    }
    console.log('✅ park-0042 별그리다(THE HILL): TREE_BURIAL → NATURAL', changed + '건 변경');
}

// ============================================================
// park-0618: park-0042와 동일한 가격표
// ============================================================
const p618 = data.find(x => x.id === 'park-0618');
if (p618 && p42) {
    // 0042의 standardizedPrices를 그대로 복사
    p618.priceInfo = JSON.parse(JSON.stringify(p42.priceInfo));
    console.log('✅ park-0618 별그리다(THE WALL): park-0042 가격표 복사 완료');
    console.log('   groups:', p618.priceInfo.standardizedPrices.length);
    p618.priceInfo.standardizedPrices.forEach((sp, i) => {
        console.log('  [' + i + ']', sp.serviceType, sp.subType, sp.groupType || '', '→', sp.rows?.length, 'rows');
    });
}

// 저장
fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ facilities.json 저장 완료');

// Supabase 동기화
async function sync() {
    if (!SUPABASE_KEY) { console.log('⚠️ SUPABASE_KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ids = ['park-0042', 'park-0618'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const updateObj = { pricing: JSON.stringify(f.priceInfo) };
        const { error } = await supabase.from('Facility').update(updateObj).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅', id, f.name, 'DB 동기화 완료');
    }
}
sync();
