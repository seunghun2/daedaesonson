/**
 * park-0752 ~ park-0758 가격 데이터 세팅
 * 752 경주하늘마루봉안당 - 아카이브 + 공홈(gyeongju.go.kr)
 * 753 옥천군봉안당 선화원 - 아카이브
 * 754 남원시승화당 - 아카이브
 * 755 서산시 희망공원(봉안시설) - 아카이브
 * 756 고성군추모의집 - 아카이브
 * 757 법지사 - 아카이브
 * 758 무주추모의집(봉안) - 아카이브 + 공홈(hpo.kr)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 752 경주하늘마루봉안당 (아카이브 + 공홈) =====
    // 사용료+관리비: 개인단(1구/15년) 관내 650,000 / 관외 1,350,000
    //              부부단(2구/15년) 관내 1,100,000 / 관외 2,200,000
    const p752 = data.find(x => x.id === 'park-0752');
    if (p752) {
        p752.websiteUrl = 'https://www.gyeongju.go.kr/area/page.do?mnu_uid=1291&';
        p752.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '사용료+관리비 (개인단, 1구)', price: 650000, feeType: 'USAGE', grade: '15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료+관리비 (개인단, 1구)', price: 1350000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '사용료+관리비 (부부단, 2구)', price: 1100000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL' },
                    { name: '사용료+관리비 (부부단, 2구)', price: 2200000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0752', p: p752, ws: true });
        console.log('✅', p752.id, p752.name);
    }

    // ===== 753 옥천군봉안당 선화원 (아카이브) =====
    // 단장봉안 사용료,관리비: 최초15년 175,000
    // 합장봉안 사용료,관리비: 최초15년 275,000
    // 무연봉안 사용료,관리비: 10년 80,000 → 무연고 제외
    // 공설묘지 사용료,관리비: 최초15년 300,000
    const p753 = data.find(x => x.id === 'park-0753');
    if (p753) {
        p753.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '단장봉안 (사용료+관리비)', price: 175000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true },
                    { name: '합장봉안 (사용료+관리비)', price: 275000, feeType: 'USAGE', grade: '최초 15년' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '공설묘지', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '공설묘지 (사용료+관리비)', price: 300000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true },
                ]
            },
        ];
        updates.push({ id: 'park-0753', p: p753 });
        console.log('✅', p753.id, p753.name);
    }

    // ===== 754 남원시승화당 (아카이브) =====
    // 승화당 관내 200,000 / 관외(본적지만 가능) 300,000
    // 승화당 관내 400,000 / 관외(본적지만 가능) 500,000
    // → 2가지 타입: 아마 개인단/부부단 또는 일반/특별
    const p754 = data.find(x => x.id === 'park-0754');
    if (p754) {
        p754.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '승화당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 200000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 300000, feeType: 'USAGE', residency: 'NON_LOCAL', note: '본적지만 가능' },
                    { name: '사용료 (부부단)', price: 400000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 500000, feeType: 'USAGE', residency: 'NON_LOCAL', note: '본적지만 가능' },
                ]
            },
        ];
        updates.push({ id: 'park-0754', p: p754 });
        console.log('✅', p754.id, p754.name);
    }

    // ===== 755 서산시 희망공원(봉안시설) (아카이브) =====
    // 유연유골: 사용료 30,000 + 관리비 20,000 (최초 15년 계약)
    // 무연유골: 사용료 30,000 + 관리비 10,000 (최초 15년 계약) → 무연고 제외
    const p755 = data.find(x => x.id === 'park-0755');
    if (p755) {
        p755.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 30000, feeType: 'USAGE', grade: '최초 15년 계약', isRepresentative: true },
                    { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '최초 15년 계약' },
                ]
            },
        ];
        updates.push({ id: 'park-0755', p: p755 });
        console.log('✅', p755.id, p755.name);
    }

    // ===== 756 고성군추모의집 (아카이브) =====
    // 사용료+관리비: 관내 개인 280,000 / 관외 개인 440,000 (최초 15년)
    //              관내 합장 520,000 / 관외 합장 840,000 (최초 15년)
    const p756 = data.find(x => x.id === 'park-0756');
    if (p756) {
        p756.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '사용료+관리비 (개인)', price: 280000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료+관리비 (개인)', price: 440000, feeType: 'USAGE', grade: '최초 15년', residency: 'NON_LOCAL' },
                    { name: '사용료+관리비 (합장)', price: 520000, feeType: 'USAGE', grade: '최초 15년', residency: 'LOCAL' },
                    { name: '사용료+관리비 (합장)', price: 840000, feeType: 'USAGE', grade: '최초 15년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0756', p: p756 });
        console.log('✅', p756.id, p756.name);
    }

    // ===== 757 법지사 (아카이브) =====
    // 개인단(사용료): 사용료 10만~30만원 → 100,000 (최저가)
    // 부부단(사용료): 사용료 250만원 → 2,500,000
    // 개인단(관리비): 25,000원/년간
    // 부부단(관리비): 25,000원/년간
    const p757 = data.find(x => x.id === 'park-0757');
    if (p757) {
        p757.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 100000, feeType: 'USAGE', grade: '10만~30만원', isRepresentative: true },
                    { name: '사용료 (부부단)', price: 2500000, feeType: 'USAGE' },
                    { name: '관리비', price: 25000, feeType: 'MAINTENANCE', grade: '年 25,000원' },
                ]
            },
        ];
        updates.push({ id: 'park-0757', p: p757 });
        console.log('✅', p757.id, p757.name);
    }

    // ===== 758 무주추모의집(봉안) (아카이브 + 공홈) =====
    // 추모의집 사용료(관내): 최초15년 150,000
    // 추모의집 사용료(관외): 최초15년 400,000
    // 사용료 관내: 150,000
    // 사용료 관외: 400,000
    // → 위 2쌍이 동일 데이터(중복). 하나만 사용.
    const p758 = data.find(x => x.id === 'park-0758');
    if (p758) {
        p758.websiteUrl = 'https://www.hpo.kr/';
        p758.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '추모의집(봉안)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 150000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 400000, feeType: 'USAGE', grade: '최초 15년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0758', p: p758, ws: true });
        console.log('✅', p758.id, p758.name);
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
