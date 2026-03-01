/**
 * park-0722 ~ park-0726 가격 데이터 세팅
 * 722 완도군추모공원 봉안담 - 아카이브
 * 723 정수사 - 아카이브
 * 724 영광사불지원 - 아카이브
 * 725 아산시공설봉안당 - 공홈(asanfmc.or.kr) + 유저 이미지
 * 726 (재)미타불교원 - 공홈(mita.kr) + 유저 이미지
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

    // ===== 722 완도군추모공원 봉안담 (아카이브) =====
    // 사용료(관내) 40,000 / 관리비(관내) 30,000 / 사용료(관외) 80,000 / 관리비(관외) 30,000 / 15년
    const p722 = data.find(x => x.id === 'park-0722');
    if (p722) {
        p722.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료', price: 40000, feeType: 'USAGE', grade: '15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '15년', residency: 'LOCAL' },
                    { name: '사용료', price: 80000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '15년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0722', p: p722 });
        console.log('✅', p722.id, p722.name);
    }

    // ===== 723 정수사 (아카이브) =====
    // 본관: 개인단 1~9단(100만~450만) 관리비 1년4만 5년선납(20만)  / 부부단 1~9단(200만~800만) 관리비 1년6만 5년선납(30만)
    // 신관: 개인단 1~7단(200만~550만) 관리비 1년4만 5년선납(20만) / 부부단 1~7단(400만~1,100만) 관리비 1년6만 5년선납(30만)
    // 아카이브 대표가: 본관 개인 1,200,000 / 본관 부부 2,300,000 / 신관 개인 2,200,000 / 신관 부부 4,300,000
    const p723 = data.find(x => x.id === 'park-0723');
    if (p723) {
        p723.priceInfo.standardizedPrices = [
            // 본관(개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '본관', unit: '원', rows: [
                    { name: '사용료', price: 1200000, feeType: 'USAGE', grade: '1단~9단 (100만~450만)', isRepresentative: true },
                    { name: '관리비 (5년 선납)', price: 200000, feeType: 'MAINTENANCE', grade: '연 4만원' },
                ]
            },
            // 본관(부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '본관', unit: '원', rows: [
                    { name: '사용료', price: 2300000, feeType: 'USAGE', grade: '1단~9단 (200만~800만)' },
                    { name: '관리비 (5년 선납)', price: 300000, feeType: 'MAINTENANCE', grade: '연 6만원' },
                ]
            },
            // 신관(개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '신관', unit: '원', rows: [
                    { name: '사용료', price: 2200000, feeType: 'USAGE', grade: '1단~7단 (200만~550만)' },
                    { name: '관리비 (5년 선납)', price: 200000, feeType: 'MAINTENANCE', grade: '연 4만원' },
                ]
            },
            // 신관(부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '신관', unit: '원', rows: [
                    { name: '사용료', price: 4300000, feeType: 'USAGE', grade: '1단~7단 (400만~1,100만)' },
                    { name: '관리비 (5년 선납)', price: 300000, feeType: 'MAINTENANCE', grade: '연 6만원' },
                ]
            },
        ];
        updates.push({ id: 'park-0723', p: p723 });
        console.log('✅', p723.id, p723.name);
    }

    // ===== 724 영광사불지원 (아카이브) =====
    // 관내외 동일: 개인단(15년) 사용료 700,000 + 관리비 300,000 / 부부단(15년) 사용료 1,400,000 + 관리비 600,000
    const p724 = data.find(x => x.id === 'park-0724');
    if (p724) {
        p724.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 700000, feeType: 'USAGE', grade: '15년', isRepresentative: true },
                    { name: '관리비 (개인단)', price: 300000, feeType: 'MAINTENANCE', grade: '15년' },
                    { name: '사용료 (부부단)', price: 1400000, feeType: 'USAGE', grade: '15년' },
                    { name: '관리비 (부부단)', price: 600000, feeType: 'MAINTENANCE', grade: '15년' },
                ]
            },
        ];
        updates.push({ id: 'park-0724', p: p724 });
        console.log('✅', p724.id, p724.name);
    }

    // ===== 725 아산시공설봉안당 (공홈 + 유저 이미지) =====
    // 봉안당: 개인단 15년 관내 300,000 / 관외 1,000,000 (합골함(부부) 합장 가능)
    //         부부단 15년 관내 500,000 / 관외 1,500,000
    //         무연고 5년  관내  50,000 / 관외   150,000
    // 자연장지: 개인단 30년 관내 600,000 / 관외 2,000,000 (만장-안치불가)
    //           부부단 30년 관내 1,000,000 / 관외 3,000,000 (만장-안치불가)
    // 산골시설: 10,000 / 10,000
    // ※ 봉안시설 15년 2회 연장가능, 연장시 사용료 추가납부
    // ※ 자연장지 30년 연장불가
    const p725 = data.find(x => x.id === 'park-0725');
    if (p725) {
        p725.websiteUrl = 'https://www.asanfmc.or.kr/new/cms/?no=25';
        p725.priceInfo.standardizedPrices = [
            // 봉안당
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 300000, feeType: 'USAGE', grade: '15년, 2회 연장가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 1000000, feeType: 'USAGE', grade: '15년, 2회 연장가능', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 500000, feeType: 'USAGE', grade: '15년, 합골함 합장 가능', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 1500000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                    { name: '사용료 (무연고)', price: 50000, feeType: 'USAGE', grade: '5년', residency: 'LOCAL' },
                    { name: '사용료 (무연고)', price: 150000, feeType: 'USAGE', grade: '5년', residency: 'NON_LOCAL' },
                ]
            },
            // 자연장지
            {
                serviceType: 'NATURAL', subType: '자연장지', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 600000, feeType: 'USAGE', grade: '30년, 연장불가, 만장(안치불가)', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인단)', price: 2000000, feeType: 'USAGE', grade: '30년, 연장불가', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부단)', price: 1000000, feeType: 'USAGE', grade: '30년, 만장(안치불가)', residency: 'LOCAL' },
                    { name: '사용료 (부부단)', price: 3000000, feeType: 'USAGE', grade: '30년', residency: 'NON_LOCAL' },
                ]
            },
            // 산골시설
            {
                serviceType: 'NATURAL', subType: '산골시설', groupType: '사용료', unit: '원', rows: [
                    { name: '산골 사용료', price: 10000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '산골 사용료', price: 10000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0725', p: p725, ws: true });
        console.log('✅', p725.id, p725.name);
    }

    // ===== 726 (재)미타불교원 (공홈 + 유저 이미지) =====
    // 1층 봉안당 (1~8단) 개인단: 300~800만 / 부부단: 600~1,600만 (단위:만원)
    // 2층 봉안당 (1~12단) 개인단: 200~550만 / 부부단: 400~1,100만
    // 5년 관리비: 개인단 30만원 선납 / 부부단 60만원 선납
    // 합동제례 무료: 추석, 설날
    const p726 = data.find(x => x.id === 'park-0726');
    if (p726) {
        p726.websiteUrl = 'http://www.mita.kr/';
        p726.priceInfo.standardizedPrices = [
            // 1층 봉안당 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '1층', unit: '원', rows: [
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 6000000, feeType: 'USAGE' },
                    { name: '4단', price: 7000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 7000000, feeType: 'USAGE' },
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                    { name: '관리비 (5년 선납)', price: 300000, feeType: 'MAINTENANCE', grade: '연 6만원 환산' },
                ]
            },
            // 1층 봉안당 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '1층', unit: '원', rows: [
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '6단', price: 10000000, feeType: 'USAGE' },
                    { name: '5단', price: 12000000, feeType: 'USAGE' },
                    { name: '4단', price: 14000000, feeType: 'USAGE' },
                    { name: '3단', price: 16000000, feeType: 'USAGE' },
                    { name: '2단', price: 14000000, feeType: 'USAGE' },
                    { name: '1단', price: 12000000, feeType: 'USAGE' },
                    { name: '관리비 (5년 선납)', price: 600000, feeType: 'MAINTENANCE', grade: '연 12만원 환산' },
                ]
            },
            // 2층 봉안당 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '2층', unit: '원', rows: [
                    { name: '12단', price: 2000000, feeType: 'USAGE' },
                    { name: '11단', price: 2000000, feeType: 'USAGE' },
                    { name: '10단', price: 2500000, feeType: 'USAGE' },
                    { name: '9단', price: 2500000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '7단', price: 3500000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 5500000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '2단', price: 4500000, feeType: 'USAGE' },
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                    { name: '관리비 (5년 선납)', price: 300000, feeType: 'MAINTENANCE', grade: '연 6만원 환산' },
                ]
            },
            // 2층 봉안당 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '2층', unit: '원', rows: [
                    { name: '12단', price: 4000000, feeType: 'USAGE' },
                    { name: '11단', price: 4000000, feeType: 'USAGE' },
                    { name: '10단', price: 5000000, feeType: 'USAGE' },
                    { name: '9단', price: 5000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                    { name: '7단', price: 7000000, feeType: 'USAGE' },
                    { name: '6단', price: 8000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 11000000, feeType: 'USAGE' },
                    { name: '3단', price: 10000000, feeType: 'USAGE' },
                    { name: '2단', price: 9000000, feeType: 'USAGE' },
                    { name: '1단', price: 8000000, feeType: 'USAGE' },
                    { name: '관리비 (5년 선납)', price: 600000, feeType: 'MAINTENANCE', grade: '연 12만원 환산' },
                ]
            },
        ];
        updates.push({ id: 'park-0726', p: p726, ws: true });
        console.log('✅', p726.id, p726.name);
    }

    // ===== 727 (재)만어추모공원 봉안당 (공홈 + 유저 이미지) =====
    // 수목장: 개인목 500만~, 부부목 600만~, 가족목 1500만~, 공동목 400만
    // 봉안당 영구봉안 (1~9단): 개인단 200~450만 / 부부단 400~900만
    // 봉안당 임대봉안 10년 (1~9단): 개인단 70~200만 / 부부단 150~400만
    // 관리비는 봉안일로부터 발생, 5년 단위 선납
    const p727 = data.find(x => x.id === 'park-0727');
    if (p727) {
        p727.websiteUrl = 'https://www.maneopark.co.kr/';
        p727.priceInfo.standardizedPrices = [
            // 수목장
            {
                serviceType: 'NATURAL', subType: '수목장', groupType: '사용료', unit: '원', rows: [
                    { name: '개인목', price: 5000000, feeType: 'USAGE', grade: '안치 1기, 500만원 부터~', isRepresentative: true },
                    { name: '관리비 (개인목)', price: 80000, feeType: 'MAINTENANCE', grade: '연간, 최소 5년 선납' },
                    { name: '부부목', price: 6000000, feeType: 'USAGE', grade: '안치 2기, 600만원 부터~' },
                    { name: '관리비 (부부목)', price: 100000, feeType: 'MAINTENANCE', grade: '연간, 최소 5년 선납' },
                    { name: '가족목', price: 15000000, feeType: 'USAGE', grade: '안치 3~6기, 1500만원 부터~' },
                    { name: '관리비 (가족목)', price: 150000, feeType: 'MAINTENANCE', grade: '연간, 최소 5년 선납' },
                    { name: '공동목', price: 4000000, feeType: 'USAGE', grade: '안치 1기' },
                    { name: '관리비 (공동목)', price: 50000, feeType: 'MAINTENANCE', grade: '연간, 최소 5년 선납' },
                ]
            },
            // 봉안당 영구봉안 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '영구봉안', unit: '원', rows: [
                    { name: '9단', price: 2000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                    { name: '7단', price: 3500000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '5단', price: 4500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '4단', price: 4500000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                ]
            },
            // 봉안당 영구봉안 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '영구봉안', unit: '원', rows: [
                    { name: '9단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                    { name: '7단', price: 7000000, feeType: 'USAGE' },
                    { name: '6단', price: 8000000, feeType: 'USAGE' },
                    { name: '5단', price: 9000000, feeType: 'USAGE' },
                    { name: '4단', price: 9000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE' },
                    { name: '2단', price: 6000000, feeType: 'USAGE' },
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                ]
            },
            // 봉안당 임대봉안 (개인)
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '임대봉안 (10년)', unit: '원', rows: [
                    { name: '9단', price: 700000, feeType: 'USAGE' },
                    { name: '8단', price: 1000000, feeType: 'USAGE' },
                    { name: '7단', price: 1500000, feeType: 'USAGE' },
                    { name: '6단', price: 2000000, feeType: 'USAGE' },
                    { name: '5단', price: 2000000, feeType: 'USAGE' },
                    { name: '4단', price: 2000000, feeType: 'USAGE' },
                    { name: '3단', price: 2000000, feeType: 'USAGE' },
                    { name: '2단', price: 1500000, feeType: 'USAGE' },
                    { name: '1단', price: 1000000, feeType: 'USAGE' },
                ]
            },
            // 봉안당 임대봉안 (부부)
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '임대봉안 (10년)', unit: '원', rows: [
                    { name: '9단', price: 1500000, feeType: 'USAGE' },
                    { name: '8단', price: 2000000, feeType: 'USAGE' },
                    { name: '7단', price: 3000000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '5단', price: 4000000, feeType: 'USAGE' },
                    { name: '4단', price: 4000000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0727', p: p727, ws: true });
        console.log('✅', p727.id, p727.name);
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

