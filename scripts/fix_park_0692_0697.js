/**
 * 692 불광사 추모관 - 복합단 쪼개기 (2단·7단 → 2단+7단, 3단·6단 → 3단+6단)
 * 697 삼광사 - 공홈 samgwangsa.co.kr + 가격이미지
 *   프리미엄 자연장: 1위 880만, 부부 990만 / 관리비 10년 30만(50만)
 *   하늘추모관: 개인 150~500만 / 부부 300~800만 (8단) / 관리비 10년 30만
 *   극락원 봉안당: 개인 100~250만 / 부부 200~500만 (10단) / 관리비 10년 30만
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

    // ===== 692 불광사 추모관 - 복합단 쪼개기 =====
    const p692 = data.find(x => x.id === 'park-0692');
    if (p692) {
        p692.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '영가기도비', groupType: '사용료', unit: '원', rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE', grade: '가로27×세로27.7×깊이29.5cm' },
                    { name: '2단', price: 3500000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '7단', price: 3500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '영가기도비', groupType: '관리비 (10년)', unit: '원', rows: [
                    { name: '관리비', price: 500000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0692', p: p692 });
        console.log('✅', p692.id, p692.name, '- 복합단 쪼개기');
    }

    // ===== 697 삼광사 =====
    const p697 = data.find(x => x.id === 'park-0697');
    if (p697) {
        p697.websiteUrl = 'http://samgwangsa.co.kr';
        p697.priceInfo.standardizedPrices = [
            // 프리미엄 자연장
            {
                serviceType: 'NATURAL', subType: '자연장', groupType: '프리미엄 자연장', unit: '원', rows: [
                    { name: '1위', price: 8800000, feeType: 'USAGE', isRepresentative: true },
                    { name: '부부', price: 9900000, feeType: 'USAGE' },
                    { name: '1위 추가 봉안', price: 1100000, feeType: 'USAGE', grade: '추가 관리비 연 2만원' },
                    { name: '관리비 1위 (10년 선납)', price: 300000, feeType: 'MAINTENANCE' },
                    { name: '관리비 부부 (10년 선납)', price: 500000, feeType: 'MAINTENANCE' },
                ]
            },
            // 하늘추모관 안치단 - 개인
            {
                serviceType: 'BONGSAN', subType: '하늘추모관(개인)', groupType: '안치단', unit: '원', rows: [
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '3단', price: 3500000, feeType: 'USAGE' },
                    { name: '4단', price: 4000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '7단', price: 2500000, feeType: 'USAGE' },
                    { name: '8단', price: 1500000, feeType: 'USAGE' },
                    { name: '관리비 (10년 선납)', price: 300000, feeType: 'MAINTENANCE' },
                ]
            },
            // 하늘추모관 안치단 - 부부
            {
                serviceType: 'BONGSAN', subType: '하늘추모관(부부)', groupType: '안치단', unit: '원', rows: [
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 5500000, feeType: 'USAGE' },
                    { name: '3단', price: 6000000, feeType: 'USAGE' },
                    { name: '4단', price: 7000000, feeType: 'USAGE' },
                    { name: '5단', price: 8000000, feeType: 'USAGE' },
                    { name: '6단', price: 7000000, feeType: 'USAGE' },
                    { name: '7단', price: 5000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '관리비 (10년 선납)', price: 500000, feeType: 'MAINTENANCE', grade: '개인 30만+추가 20만' },
                ]
            },
            // 극락원 봉안당 - 개인
            {
                serviceType: 'BONGSAN', subType: '극락원 봉안당(개인)', groupType: '봉안당', unit: '원', rows: [
                    { name: '1단', price: 1500000, feeType: 'USAGE' },
                    { name: '2단', price: 2000000, feeType: 'USAGE' },
                    { name: '3단', price: 2500000, feeType: 'USAGE' },
                    { name: '4단', price: 2500000, feeType: 'USAGE' },
                    { name: '5단', price: 2500000, feeType: 'USAGE' },
                    { name: '6단', price: 2500000, feeType: 'USAGE' },
                    { name: '7단', price: 2000000, feeType: 'USAGE' },
                    { name: '8단', price: 1500000, feeType: 'USAGE' },
                    { name: '9단', price: 1000000, feeType: 'USAGE' },
                    { name: '10단', price: 1000000, feeType: 'USAGE' },
                    { name: '관리비 (10년 선납)', price: 300000, feeType: 'MAINTENANCE' },
                ]
            },
            // 극락원 봉안당 - 부부
            {
                serviceType: 'BONGSAN', subType: '극락원 봉안당(부부)', groupType: '봉안당', unit: '원', rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '9단', price: 2000000, feeType: 'USAGE' },
                    { name: '10단', price: 2000000, feeType: 'USAGE' },
                    { name: '관리비 (10년 선납)', price: 500000, feeType: 'MAINTENANCE', grade: '개인 30만+추가 20만' },
                ]
            },
        ];
        updates.push({ id: 'park-0697', p: p697, ws: true });
        console.log('✅', p697.id, p697.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
