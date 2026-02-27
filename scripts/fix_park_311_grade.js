const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
const p = data.find(x => x.id === 'park-0311');
p.priceInfo.standardizedPrices[0].rows[0].grade = '분양하는 시설묘지 아님(만장)';
fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
(async () => {
    const f = data.find(d => d.id === 'park-0311');
    await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', 'park-0311');
    console.log('✅ park-0311 grade → "분양하는 시설묘지 아님(만장)"');
})();
