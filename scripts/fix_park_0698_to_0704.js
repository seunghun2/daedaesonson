/**
 * park-0698~0704 일괄 처리
 *
 * 698 재단법인북한강공원 (아카이브) - 봉안묘
 *   사용료(봉안묘) 석물(위수별): 2,500,000원
 *   사용료(봉안묘) 토지(㎡): 365,000원
 *   사용료(추모단) 봉안답(기수별): 4,600,000원
 *   관리비(봉안묘) 토지(㎡): 55,000원
 *   관리비(추모단) 기수별: 50,000원
 *
 * 699 사천시누리원(봉안시설) (아카이브) - 공설
 *   개인단(관내) 15년: 200,000원
 *   개인단(관내) 10년: 140,000원
 *   부부단(관내) 15년: 400,000원
 *   개인단(관외) 15년: 1,000,000원
 *   부부단(관외) 15년: 2,000,000원
 *
 * 700 대한불교조계종 대관음사 봉안당 (아카이브)
 *   사용료 개인단 1~2단: 4,500,000 → 각 단 분리
 *   사용료 개인단 3~7단: 5,500,000 → 각 단 분리
 *   사용료 개인단 8~11단: 4,500,000 → 각 단 분리
 *   관리비 (1년 5만) 5년: 250,000원
 *   유골함: 650,000원
 *
 * 701 영평사 봉안당 (아카이브+공홈 youngpyungsapark.co.kr)
 *   1단,8단: 2,000,000 → 각 단 분리
 *   2단,7단: 3,000,000 → 각 단 분리
 *   3단,6단: 5,000,000 → 각 단 분리
 *   4단,5단: 7,000,000 → 각 단 분리
 *   관리비: 5,000/월
 *
 * 702 계룡시 정명각 (아카이브) - 공설
 *   사용료 1구당: 200,000원
 *   사용료 기초생활수급자: 0원
 *   사용료 독립유공자: 100,000원
 *   관리비 1구당: 100,000원
 *   관리비 기초·독립유공자·가족: 0원
 *
 * 703 천주사 영탑공원 (아카이브)
 *   유해남골 1기: 2,800,000원
 *   유골함 1기: 350,000원
 *   관리비 1년: 70,000원
 *   가족탑 16구 안치: 18,000,000원
 *   가족탑 관리비 1년: 150,000원
 *
 * 704 함안군 공설장사시설 (공홈 hamanhaneul.or.kr)
 *   추모공원(매장): 단장/합장 × 관내/관외
 *   자연장지: 잔디형/수목형 × 관내/관외
 *   봉안당: 유연고(15년)/무연고(5년)
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

    // ===== 698 재단법인북한강공원 =====
    const p698 = data.find(x => x.id === 'park-0698');
    if (p698) {
        p698.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '봉안묘', groupType: '사용료', unit: '원', rows: [
                    { name: '석물 (위수별)', price: 2500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '토지 (㎡당)', price: 365000, feeType: 'USAGE' },
                    { name: '관리비 (토지 ㎡당)', price: 55000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '추모단 봉안답', groupType: '사용료', unit: '원', rows: [
                    { name: '봉안답 (기수별)', price: 4600000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비 (기수별)', price: 50000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0698', p: p698 });
        console.log('✅', p698.id, p698.name);
    }

    // ===== 699 사천시누리원(봉안시설) =====
    const p699 = data.find(x => x.id === 'park-0699');
    if (p699) {
        p699.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단 (15년)', price: 200000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                    { name: '개인단 (10년)', price: 140000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '부부단 (15년)', price: 400000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '개인단 (15년)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '부부단 (15년)', price: 2000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0699', p: p699 });
        console.log('✅', p699.id, p699.name);
    }

    // ===== 700 대한불교조계종 대관음사 봉안당 =====
    const p700 = data.find(x => x.id === 'park-0700');
    if (p700) {
        p700.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '1단', price: 4500000, feeType: 'USAGE' },
                    { name: '2단', price: 4500000, feeType: 'USAGE' },
                    { name: '3단', price: 5500000, feeType: 'USAGE' },
                    { name: '4단', price: 5500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '5단', price: 5500000, feeType: 'USAGE' },
                    { name: '6단', price: 5500000, feeType: 'USAGE' },
                    { name: '7단', price: 5500000, feeType: 'USAGE' },
                    { name: '8단', price: 4500000, feeType: 'USAGE' },
                    { name: '9단', price: 4500000, feeType: 'USAGE' },
                    { name: '10단', price: 4500000, feeType: 'USAGE' },
                    { name: '11단', price: 4500000, feeType: 'USAGE' },
                    { name: '관리비 (5년)', price: 250000, feeType: 'MAINTENANCE', grade: '1년 5만원' },
                    { name: '유골함', price: 650000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0700', p: p700 });
        console.log('✅', p700.id, p700.name);
    }

    // ===== 701 영평사 봉안당 =====
    const p701 = data.find(x => x.id === 'park-0701');
    if (p701) {
        p701.websiteUrl = 'https://www.youngpyungsapark.co.kr';
        p701.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료 (영구보존)', unit: '원', rows: [
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 7000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '5단', price: 7000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '7단', price: 3000000, feeType: 'USAGE' },
                    { name: '8단', price: 2000000, feeType: 'USAGE' },
                    { name: '관리비 (월)', price: 5000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0701', p: p701, ws: true });
        console.log('✅', p701.id, p701.name);
    }

    // ===== 702 계룡시 정명각 =====
    const p702 = data.find(x => x.id === 'park-0702');
    if (p702) {
        p702.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (1구당)', price: 200000, feeType: 'USAGE', isRepresentative: true },
                    { name: '사용료 (독립유공자)', price: 100000, feeType: 'USAGE' },
                    { name: '사용료 (기초생활수급자)', price: 0, feeType: 'USAGE', grade: '면제' },
                    { name: '관리비 (1구당)', price: 100000, feeType: 'MAINTENANCE' },
                    { name: '관리비 (기초·독립유공자·가족)', price: 0, feeType: 'MAINTENANCE', grade: '무료' },
                ]
            },
        ];
        updates.push({ id: 'park-0702', p: p702 });
        console.log('✅', p702.id, p702.name);
    }

    // ===== 703 천주사 영탑공원 =====
    const p703 = data.find(x => x.id === 'park-0703');
    if (p703) {
        p703.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '유해남골 1기', price: 2800000, feeType: 'USAGE', isRepresentative: true },
                    { name: '유골함 1기', price: 350000, feeType: 'USAGE' },
                    { name: '관리비 (1년)', price: 70000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '가족탑', groupType: '사용료', unit: '원', rows: [
                    { name: '가족탑 (16구 안치)', price: 18000000, feeType: 'USAGE' },
                    { name: '관리비 (1년)', price: 150000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0703', p: p703 });
        console.log('✅', p703.id, p703.name);
    }

    // ===== 704 함안군 공설장사시설 =====
    const p704 = data.find(x => x.id === 'park-0704');
    if (p704) {
        p704.websiteUrl = 'http://hamanhaneul.or.kr';
        p704.priceInfo.standardizedPrices = [
            // 추모공원 (매장)
            {
                serviceType: 'BURIAL', subType: '매장묘', groupType: '단장', unit: '원', rows: [
                    { name: '사용료', price: 270000, feeType: 'USAGE', residency: 'LOCAL', grade: '최초 15년, 3회 연장, 최대 60년', isRepresentative: true },
                    { name: '사용료', price: 1250000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '석물비', price: 360000, feeType: 'USAGE', grade: '관내·관외 동일' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '매장묘', groupType: '합장', unit: '원', rows: [
                    { name: '사용료 (관내+관내)', price: 420000, feeType: 'USAGE' },
                    { name: '사용료 (관내+관외)', price: 1400000, feeType: 'USAGE' },
                    { name: '사용료 (관외+관외)', price: 2000000, feeType: 'USAGE' },
                    { name: '관리비 (관내+관내)', price: 200000, feeType: 'MAINTENANCE' },
                    { name: '관리비 (관내+관외)', price: 400000, feeType: 'MAINTENANCE' },
                    { name: '관리비 (관외+관외)', price: 600000, feeType: 'MAINTENANCE' },
                    { name: '석물비', price: 380000, feeType: 'USAGE' },
                ]
            },
            // 자연장지
            {
                serviceType: 'NATURAL', subType: '잔디장', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '기본 30년, 연장 없음', isRepresentative: true },
                    { name: '사용료', price: 600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '석물비', price: 160000, feeType: 'USAGE', grade: '관내·관외 동일' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 350000, feeType: 'USAGE', residency: 'LOCAL', grade: '기본 30년, 연장 없음', isRepresentative: true },
                    { name: '사용료', price: 900000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                    { name: '석물비', price: 160000, feeType: 'USAGE', grade: '관내·관외 동일' },
                ]
            },
            // 봉안당
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '공설봉안당 유연고 최초 (15년)', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '3회 연장 가능, 최장 60년', isRepresentative: true },
                    { name: '공설봉안당 유연고 최초 (15년)', price: 600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '공설봉안당 유연고 연장 (15년)', price: 200000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '공설봉안당 유연고 연장 (15년)', price: 600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '공설봉안장 무연고 (5년)', price: 200000, feeType: 'USAGE', grade: '관외 사용 불가' },
                ]
            },
        ];
        updates.push({ id: 'park-0704', p: p704, ws: true });
        console.log('✅', p704.id, p704.name);
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
