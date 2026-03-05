const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
const fp = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// 공홈 URL 일괄 추가
const urls = {
    'park-0768': 'http://www.pungjusa.or.kr/',
    'park-0771': 'http://chumo.entix.kr/',
    'park-0784': 'https://gjyoungrak.or.kr/',
    'park-0785': 'https://cfmc.kr/sub.html?code=03_05&Radd=03_05',
    'park-0794': 'https://www.insiseol.or.kr/life/family/facility/pyeongon.jsp',
    'park-0808': 'https://www.insiseol.or.kr/life/family/facility/manwol.jsp',
};

(async () => {
    for (const [id, url] of Object.entries(urls)) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('⚠️ NOT FOUND:', id); continue; }
        p.websiteUrl = url;
        const { error } = await supabase.from('Facility').update({ websiteUrl: url }).eq('id', id);
        console.log(error ? `❌ ${id} ${error.message}` : `✅ ${id} ${p.name} → ${url}`);
    }
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');
})();
