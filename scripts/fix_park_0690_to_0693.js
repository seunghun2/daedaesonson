/**
 * park-0690~0693 일괄 처리
 *
 * 690 광명메모리얼파크 → 아카이브+공홈 gmuc.co.kr
 * 691 공주나래원 봉안당 → 아카이브+공홈 gongju.go.kr
 * 692 불광사 추모관 → 아카이브
 * 693 (cwsisul.or.kr) → 공홈+이미지
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

    // ===== 690 광명메모리얼파크 =====
    const p690 = data.find(x => x.id === 'park-0690');
    if (p690) {
        p690.websiteUrl = 'https://www.gmuc.co.kr';
        p690.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단 (15년, 2회 연장 총45년)', unit: '원', rows: [
                    { name: '관내', price: 750000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관외', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단 (15년, 2회 연장 총45년)', unit: '원', rows: [
                    { name: '관내', price: 1000000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '관외', price: 2000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고 (10년)', unit: '원', rows: [
                    { name: '무연고', price: 100000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0690', p: p690, ws: true });
        console.log('✅', p690.id, p690.name);
    }

    // ===== 691 공주나래원 봉안당 =====
    const p691 = data.find(x => x.id === 'park-0691');
    if (p691) {
        p691.websiteUrl = 'https://www.gongju.go.kr/naraewon/sub02_01.do';
        p691.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '일반 개인 (30년)', unit: '원', rows: [
                    { name: '관내', price: 1000000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관외', price: 2000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부 (30년)', unit: '원', rows: [
                    { name: '관내', price: 2000000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '관외', price: 4000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연유골 (5년)', unit: '원', rows: [
                    { name: '무연유골', price: 50000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0691', p: p691, ws: true });
        console.log('✅', p691.id, p691.name);
    }

    // ===== 692 불광사 추모관 =====
    const p692 = data.find(x => x.id === 'park-0692');
    if (p692) {
        p692.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '영가기도비', groupType: '사용료', unit: '원', rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE', grade: '가로27×세로27.7×깊이29.5cm' },
                    { name: '2단·7단', price: 3500000, feeType: 'USAGE' },
                    { name: '3단·6단', price: 4000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '4단·5단', price: 5000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '영가기도비', groupType: '관리비 (10년)', unit: '원', rows: [
                    { name: '관리비', price: 500000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0692', p: p692 });
        console.log('✅', p692.id, p692.name);
    }

    // ===== 693 cwsisul (상복공원) =====
    const p693 = data.find(x => x.id === 'park-0693');
    if (p693) {
        p693.websiteUrl = 'https://www.cwsisul.or.kr/_sangbok/_sub02/sub02_03_01.html';
        p693.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안', groupType: '유연유골 (15년)', unit: '원', rows: [
                    { name: '1구', price: 170000, feeType: 'USAGE', isRepresentative: true, grade: '관내자만 허용' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안', groupType: '무연유골 (5년)', unit: '원', rows: [
                    { name: '1구', price: 45000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0693', p: p693, ws: true });
        console.log('✅', p693.id, p693.name);
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
