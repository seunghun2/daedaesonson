/**
 * park-0738 ~ park-0740 가격 데이터 세팅
 * 738 금화추모관 - 공홈(금화추모관.com) + 유저 이미지
 * 739 의왕하늘쉼터(봉안담) - 아카이브
 * 740 속초시공설봉안묘 - 아카이브 + type 수정(민간→공설)
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

    // ===== 738 금화추모관 (공홈 + 유저 이미지) =====
    // 매화실(영구): 개인단 200~300만 / 부부단 400~600만 / 특별단 250~350만 (1~7단)
    // 난초실(15년): 개인단 60~100만 / 부부단 120~200만 (1~8단)
    // 관리비: 1기당 3만원/년
    const p738 = data.find(x => x.id === 'park-0738');
    if (p738) {
        p738.websiteUrl = 'http://xn--zb0bot661au5s85j.com/';
        p738.priceInfo.standardizedPrices = [
            // 매화실 영구 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '매화실 (영구)', unit: '원', rows: [
                    { name: '7단', price: 2000000, feeType: 'USAGE' },
                    { name: '6단', price: 2500000, feeType: 'USAGE' },
                    { name: '5단', price: 3000000, feeType: 'USAGE' },
                    { name: '4단', price: 3000000, feeType: 'USAGE' },
                    { name: '3단', price: 3000000, feeType: 'USAGE' },
                    { name: '2단', price: 2800000, feeType: 'USAGE' },
                    { name: '1단', price: 2500000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당, 연간' },
                ]
            },
            // 매화실 영구 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '매화실 (영구)', unit: '원', rows: [
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 6000000, feeType: 'USAGE' },
                    { name: '4단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단', price: 6000000, feeType: 'USAGE' },
                    { name: '2단', price: 5600000, feeType: 'USAGE' },
                    { name: '1단', price: 5000000, feeType: 'USAGE' },
                ]
            },
            // 매화실 영구 (특별)
            {
                serviceType: 'BONGSAN', subType: '봉안당(특별)', groupType: '매화실 (영구)', unit: '원', rows: [
                    { name: '7단', price: 2500000, feeType: 'USAGE' },
                    { name: '6단', price: 3000000, feeType: 'USAGE' },
                    { name: '5단', price: 3500000, feeType: 'USAGE' },
                    { name: '4단', price: 3500000, feeType: 'USAGE' },
                    { name: '3단', price: 3300000, feeType: 'USAGE' },
                    { name: '2단', price: 3200000, feeType: 'USAGE' },
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                ]
            },
            // 난초실 15년 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '난초실 (15년)', unit: '원', rows: [
                    { name: '8단', price: 600000, feeType: 'USAGE', isRepresentative: true },
                    { name: '7단', price: 800000, feeType: 'USAGE' },
                    { name: '6단', price: 1000000, feeType: 'USAGE' },
                    { name: '5단', price: 1000000, feeType: 'USAGE' },
                    { name: '4단', price: 1000000, feeType: 'USAGE' },
                    { name: '3단', price: 800000, feeType: 'USAGE' },
                    { name: '2단', price: 700000, feeType: 'USAGE' },
                    { name: '1단', price: 600000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1기당, 연간' },
                ]
            },
            // 난초실 15년 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '난초실 (15년)', unit: '원', rows: [
                    { name: '8단', price: 1200000, feeType: 'USAGE' },
                    { name: '7단', price: 1600000, feeType: 'USAGE' },
                    { name: '6단', price: 2000000, feeType: 'USAGE' },
                    { name: '5단', price: 2000000, feeType: 'USAGE' },
                    { name: '4단', price: 2000000, feeType: 'USAGE' },
                    { name: '3단', price: 1600000, feeType: 'USAGE' },
                    { name: '2단', price: 1400000, feeType: 'USAGE' },
                    { name: '1단', price: 1200000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0738', p: p738, ws: true });
        console.log('✅', p738.id, p738.name);
    }

    // ===== 739 의왕하늘쉼터(봉안담) (아카이브) =====
    // 관내자격(의왕,과천): 사용료+관리비 700,000 (개인 추정) / 1,300,000 (부부 추정)
    // 인접시(안양,군포): 사용료+관리비 2,500,000 (개인 추정) / 4,800,000 (부부 추정)
    const p739 = data.find(x => x.id === 'park-0739');
    if (p739) {
        p739.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 및 관리비 (개인)', price: 700000, feeType: 'USAGE', grade: '관내 (의왕, 과천)', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 및 관리비 (부부)', price: 1300000, feeType: 'USAGE', grade: '관내 (의왕, 과천)', residency: 'LOCAL' },
                    { name: '사용료 및 관리비 (개인)', price: 2500000, feeType: 'USAGE', grade: '인접시 (안양, 군포)', residency: 'NON_LOCAL' },
                    { name: '사용료 및 관리비 (부부)', price: 4800000, feeType: 'USAGE', grade: '인접시 (안양, 군포)', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0739', p: p739 });
        console.log('✅', p739.id, p739.name);
    }

    // ===== 740 속초시공설봉안묘 (아카이브) + type 수정 =====
    // 봉안묘이용료: 개인단 관내 810,000 / 관외 1,215,000
    //             부부단 관내 1,170,000 / 관외 1,755,000
    // type: 민간 → 공설 변경
    const p740 = data.find(x => x.id === 'park-0740');
    if (p740) {
        p740.type = '공설';
        p740.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안묘', groupType: '사용료', unit: '원', rows: [
                    { name: '이용료 (개인단)', price: 810000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '이용료 (개인단)', price: 1215000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '이용료 (부부단)', price: 1170000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '이용료 (부부단)', price: 1755000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0740', p: p740, typeChange: true });
        console.log('✅', p740.id, p740.name, '(type: 민간→공설)');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        if (u.typeChange) ud.type = u.p.type;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
