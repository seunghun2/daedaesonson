// 추가 잘못된 URL 제거 (지자체 단순 게시글/기사/계약공고)
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const wrongIds2 = [
    'park-0028',  // 화신공원묘원 → 전북도 게시판 단순 게시글
    'park-0121',  // 춘천안식공원 → 춘천시 보도자료 (뉴스)
    'park-0246',  // 가북공설공원묘지 → 거창군 계약 공고
    'park-0564',  // 에덴낙원 → 이천시 관광페이지
    'park-0575',  // 대원사 봉안당 → 경주시 게시글
    'park-0638',  // 용화사 봉안당 → 충남도 기사
];

(async () => {
    const facs = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    let removed = 0;
    for (const id of wrongIds2) {
        const f = facs.find(x => x.id === id);
        if (f && f.websiteUrl) {
            console.log('🗑️', f.id, f.name, '→', f.websiteUrl);
            delete f.websiteUrl;
            await sb.from('Facility').update({ websiteUrl: null }).eq('id', id);
            removed++;
        }
    }
    fs.writeFileSync('data/facilities.json', JSON.stringify(facs, null, 2));
    const remaining = facs.filter(f => f.websiteUrl).length;
    console.log('\n✅', removed, '개 추가 제거. 현재 websiteUrl:', remaining, '개');
})();
