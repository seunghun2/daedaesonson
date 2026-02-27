const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const fp = path.join(__dirname, '..', 'data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const ids = ['park-0607', 'park-0608', 'park-0609', 'park-0610', 'park-0611', 'park-0612', 'park-0613'];
let changed = 0;

for (const id of ids) {
    const p = data.find(x => x.id === id);
    if (!p || !p.priceInfo || !p.priceInfo.standardizedPrices) continue;
    for (const sp of p.priceInfo.standardizedPrices) {
        for (const r of (sp.rows || [])) {
            if (r.residency === 'RESIDENT') { r.residency = 'LOCAL'; changed++; }
            if (r.residency === 'NON_RESIDENT') { r.residency = 'NON_LOCAL'; changed++; }
        }
    }
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('총 ' + changed + '건 residency 수정 (LOCAL/NON_LOCAL)');

// Supabase 동기화
async function sync() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const updateObj = { pricing: JSON.stringify(f.priceInfo) };
        if (f.websiteUrl) updateObj.websiteUrl = f.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateObj).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅', id, f.name, '동기화 완료');
    }
}
sync();
