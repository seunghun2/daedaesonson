/**
 * park-0759 ~ park-0765 가격 데이터 세팅
 * 759 수원시연화장 추모의집 - 아카이브 + 공홈
 * 760 남해추모누리 안락원 - 아카이브
 * 761 양양군공설묘원 봉안당 - 아카이브
 * 762 여수시영락공원 제1봉안당 - 아카이브
 * 763 무지개 뜨는 언덕(김포 봉안시설) - 공홈 1순위
 * 764 (재)평화원 - 아카이브
 * 765 정각사 봉안당 - 공홈 1순위 (이미지)
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

    // ===== 759 수원시연화장 추모의집 (아카이브 + 공홈) =====
    // 관내(고인 수원 주민등록 1년이상): 800,000 / 관외(직계가족 수원 1년이상): 1,300,000
    // 관내: 1,100,000 / 관외: 1,800,000
    // → 개인단/부부단 구분 (가격비 약 1.375배, 부부가 더 비쌈)
    const p759 = data.find(x => x.id === 'park-0759');
    if (p759) {
        p759.websiteUrl = 'https://yhjjr.suwonudc.co.kr/base/main/view';
        p759.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 800000, feeType: 'USAGE', grade: '고인이 수원에 주민등록 1년이상', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1300000, feeType: 'USAGE', grade: '직계가족이 수원에 주민등록 1년이상', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 1100000, feeType: 'USAGE', grade: '고인이 수원에 주민등록 1년이상', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1800000, feeType: 'USAGE', grade: '직계가족이 수원에 주민등록 1년이상', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0759', p: p759, ws: true });
        console.log('✅', p759.id, p759.name);
    }

    // ===== 760 남해추모누리 안락원 (아카이브) =====
    // 사용료: 남해군민 160,000 / 타지역민 480,000 (30년, 1회연장가능)
    // 관리비: 남해군민 300,000 / 타지역민 900,000 (30년, 1회연장가능)
    const p760 = data.find(x => x.id === 'park-0760');
    if (p760) {
        p760.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 160000, feeType: 'USAGE', grade: '30년, 1회 연장 가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 480000, feeType: 'USAGE', grade: '30년, 1회 연장 가능', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '30년', residency: 'LOCAL' },
                    { name: '관리비', price: 900000, feeType: 'MAINTENANCE', grade: '30년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0760', p: p760 });
        console.log('✅', p760.id, p760.name);
    }

    // ===== 761 양양군공설묘원 봉안당 (아카이브) =====
    // 사용료,관리비: 개인(관내) 240,000 / 개인(관외) 400,000
    // 사용료,관리비: 부부(관내) 480,000 / 부부(관외) 800,000
    const p761 = data.find(x => x.id === 'park-0761');
    if (p761) {
        p761.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '사용료+관리비 (개인)', price: 240000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료+관리비 (개인)', price: 400000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사용료+관리비 (부부)', price: 480000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료+관리비 (부부)', price: 800000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0761', p: p761 });
        console.log('✅', p761.id, p761.name);
    }

    // ===== 762 여수시영락공원 제1봉안당 (아카이브) =====
    // 사용료 및 관리비: 관내 개인 120,000 / 관내 부부 240,000 (최초 15년)
    // 국가유공자 60,000 → 유공자 제외
    // 특례 500,000 (최초 15년) → 특례도 일반이용자 아님, 제외
    const p762 = data.find(x => x.id === 'park-0762');
    if (p762) {
        p762.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료+관리비', unit: '원', rows: [
                    { name: '사용료+관리비 (개인)', price: 120000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료+관리비 (부부)', price: 240000, feeType: 'USAGE', grade: '최초 15년', residency: 'LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0762', p: p762 });
        console.log('✅', p762.id, p762.name);
    }

    // ===== 763 무지개 뜨는 언덕 - 김포시 봉안시설 (공홈 1순위) =====
    // 관내: 개인 500,000 / 부부 900,000
    // 관외: 개인 1,000,000 / 부부 1,800,000
    // 15년, 15년씩 2회 연장 가능(최장 45년)
    const p763 = data.find(x => x.id === 'park-0763');
    if (p763) {
        p763.websiteUrl = 'https://www.gimpo.go.kr/portal/contents.do?key=1378';
        p763.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 500000, feeType: 'USAGE', grade: '15년, 15년씩 2회 연장 가능 (최장 45년)', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', grade: '15년, 15년씩 2회 연장 가능 (최장 45년)', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 900000, feeType: 'USAGE', grade: '15년, 15년씩 2회 연장 가능 (최장 45년)', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1800000, feeType: 'USAGE', grade: '15년, 15년씩 2회 연장 가능 (최장 45년)', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0763', p: p763, ws: true });
        console.log('✅', p763.id, p763.name);
    }

    // ===== 764 (재)평화원 (아카이브) =====
    // 유연(기초 15년): 봉안비 550,000 + 관리비(년) 30,000
    // 무연(기초 10년): 봉안비(화장) 100,000 / 봉안비(유골) 130,000 → 무연고 제외
    const p764 = data.find(x => x.id === 'park-0764');
    if (p764) {
        p764.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '봉안비', price: 550000, feeType: 'USAGE', grade: '기초 15년', isRepresentative: true },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '年 30,000원' },
                ]
            },
        ];
        updates.push({ id: 'park-0764', p: p764 });
        console.log('✅', p764.id, p764.name);
    }

    // ===== 765 정각사 봉안당 (공홈 1순위 - 이미지) =====
    // 일반실: 개인단(1위) / 부부단(2위) — 1~10단
    // 고급실: 개인단(1위) / 부부단(2위) — 1~8단 (9,10단 없음)
    // 사용기한: 영구, 관리비: 年 6만원
    // 가이드 §13-2: 개인/부부 중복단 → subType 분리
    // 단이 많으므로 최저가~최고가 range 형태로 간소화하되,
    // 유저 이미지에 단별 가격이 명시되어 있으므로 전체 입력
    const p765 = data.find(x => x.id === 'park-0765');
    if (p765) {
        p765.websiteUrl = 'https://jeonggaksa.co.kr/';
        p765.priceInfo.standardizedPrices = [
            // 일반실 - 개인단
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '일반실', unit: '만원', rows: [
                    { name: '10단', price: 2000000, feeType: 'USAGE', grade: '영구' },
                    { name: '9단', price: 3000000, feeType: 'USAGE', grade: '영구' },
                    { name: '8단', price: 5500000, feeType: 'USAGE', grade: '영구' },
                    { name: '7단', price: 7000000, feeType: 'USAGE', grade: '영구' },
                    { name: '6단', price: 9000000, feeType: 'USAGE', grade: '영구' },
                    { name: '5단', price: 9000000, feeType: 'USAGE', grade: '영구' },
                    { name: '4단', price: 8000000, feeType: 'USAGE', grade: '영구' },
                    { name: '3단', price: 7000000, feeType: 'USAGE', grade: '영구' },
                    { name: '2단', price: 5500000, feeType: 'USAGE', grade: '영구' },
                    { name: '1단', price: 4000000, feeType: 'USAGE', grade: '영구', isRepresentative: true },
                    { name: '관리비', price: 60000, feeType: 'MAINTENANCE', grade: '年 60,000원' },
                ]
            },
            // 일반실 - 부부단
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '일반실', unit: '만원', rows: [
                    { name: '10단', price: 4000000, feeType: 'USAGE', grade: '영구' },
                    { name: '9단', price: 6000000, feeType: 'USAGE', grade: '영구' },
                    { name: '8단', price: 11000000, feeType: 'USAGE', grade: '영구' },
                    { name: '7단', price: 14000000, feeType: 'USAGE', grade: '영구' },
                    { name: '6단', price: 18000000, feeType: 'USAGE', grade: '영구' },
                    { name: '5단', price: 18000000, feeType: 'USAGE', grade: '영구' },
                    { name: '4단', price: 16000000, feeType: 'USAGE', grade: '영구' },
                    { name: '3단', price: 14000000, feeType: 'USAGE', grade: '영구' },
                    { name: '2단', price: 11000000, feeType: 'USAGE', grade: '영구' },
                    { name: '1단', price: 8000000, feeType: 'USAGE', grade: '영구', isRepresentative: true },
                ]
            },
            // 고급실 - 개인단
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '고급실', unit: '만원', rows: [
                    { name: '8단', price: 8000000, feeType: 'USAGE', grade: '영구' },
                    { name: '7단', price: 9000000, feeType: 'USAGE', grade: '영구' },
                    { name: '6단', price: 13000000, feeType: 'USAGE', grade: '영구' },
                    { name: '5단', price: 15000000, feeType: 'USAGE', grade: '영구' },
                    { name: '4단', price: 15000000, feeType: 'USAGE', grade: '영구' },
                    { name: '3단', price: 13000000, feeType: 'USAGE', grade: '영구' },
                    { name: '2단', price: 11000000, feeType: 'USAGE', grade: '영구' },
                    { name: '1단', price: 9000000, feeType: 'USAGE', grade: '영구' },
                ]
            },
            // 고급실 - 부부단
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '고급실', unit: '만원', rows: [
                    { name: '8단', price: 16000000, feeType: 'USAGE', grade: '영구' },
                    { name: '7단', price: 18000000, feeType: 'USAGE', grade: '영구' },
                    { name: '6단', price: 26000000, feeType: 'USAGE', grade: '영구' },
                    { name: '5단', price: 30000000, feeType: 'USAGE', grade: '영구' },
                    { name: '4단', price: 30000000, feeType: 'USAGE', grade: '영구' },
                    { name: '3단', price: 26000000, feeType: 'USAGE', grade: '영구' },
                    { name: '2단', price: 22000000, feeType: 'USAGE', grade: '영구' },
                    { name: '1단', price: 18000000, feeType: 'USAGE', grade: '영구' },
                ]
            },
        ];
        updates.push({ id: 'park-0765', p: p765, ws: true });
        console.log('✅', p765.id, p765.name);
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
