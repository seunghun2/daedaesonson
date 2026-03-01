/**
 * park-0656~0661 일괄 처리 스크립트
 *
 * 656 재단법인청림공원(봉안탑) → 아카이브
 *   봉안탑 연립2기: 7,000,000 (관리비 4년/년)
 *   봉안탑 2기: 12,000,000 (관리비 5년/년)
 *   봉안탑 4기: 15,000,000 (관리비 5년/년)
 *   봉안탑 8기: 17,000,000 (관리비 6년/년)
 *   봉안탑 12기: 25,000,000 (관리비 7년/년)
 *   봉안탑 16기: 20,000,000 (관리비 7년/년)
 *   봉안탑 24기: 35,000,000 (관리비 8년/년)
 *
 * 657 성모암영락원 → 아카이브
 *   영락원1층: 600,000
 *   영락원1층특별실: 800,000
 *   영락원2층일반: 900,000
 *   영락원2층특별실: 1,200,000
 *   성모암(극락보전): 1,500,000
 *   성모암(극락보전)특별실 1기: 3,500,000
 *   성모암부부단 2기: 5,000,000
 *
 * 658 금오영당 → 아카이브 + 공홈URL
 *   인조석(안치단) 군내거주자: 100,000 / 군내본적자: 300,000 / 상기자외: 1,500,000
 *   목제(안치단) 군내거주자: 120,000 / 군내본적자: 360,000 / 상기자외: 1,800,000
 *   관리비 1구당(15년): 75,000
 *
 * 659 해인사미타원 → 아카이브 + 공홈URL
 *   1층 불교형 개인단: 4,000,000 (400~700만)
 *   1층 불교형 부부단: 8,000,000 (800~1400만)
 *   1층 불교형 특별단: 25,000,000
 *   2층 신설단 개인단(일반형): 3,000,000 (300~750만)
 *   2층 신설단 부부단(일반형): 6,000,000 (600~1500만)
 *   2층 신설단 특별단(일반형): 40,000,000
 *   관리비 5년(고인1위당): 300,000
 *
 * 660 (유저 제공 가격 데이터) → 공홈
 *   https://www.prds.kr/
 *   하늘관 특별실/봉황실/VIP + 별빛관 + 햇빛관 + S관 + 야외봉안당
 *
 * 661 http://www.skymemo.co.kr/ → 공홈 이미지
 *   일반실 개인단(좌우/중앙) 1~8단
 *   일반실 부부단(좌우/중앙) 1~8단
 *   가족실 좌우 1750만 / 중앙 2500만
 *   안치 30년, 관리비 1위 4만/년, 5년 선납 20만
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const m = n => n * 10000;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const updates = [];

    // ===== 656 재단법인청림공원(봉안탑) =====
    const p656 = data.find(x => x.id === 'park-0656');
    if (p656) {
        p656.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안탑', unit: '원', rows: [
                    { name: '연립 2기', price: 7000000, feeType: 'USAGE', isRepresentative: true, grade: '관리비 4만원/년' },
                    { name: '2기', price: 12000000, feeType: 'USAGE', grade: '관리비 5만원/년' },
                    { name: '4기', price: 15000000, feeType: 'USAGE', grade: '관리비 5만원/년' },
                    { name: '8기', price: 17000000, feeType: 'USAGE', grade: '관리비 6만원/년' },
                    { name: '12기', price: 25000000, feeType: 'USAGE', grade: '관리비 7만원/년' },
                    { name: '16기', price: 20000000, feeType: 'USAGE', grade: '관리비 7만원/년' },
                    { name: '24기', price: 35000000, feeType: 'USAGE', grade: '관리비 8만원/년' },
                ]
            },
        ];
        updates.push({ id: 'park-0656', p: p656 });
        console.log('✅', p656.id, p656.name);
    }

    // ===== 657 성모암영락원 =====
    const p657 = data.find(x => x.id === 'park-0657');
    if (p657) {
        p657.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '영락원', groupType: '개인단', unit: '원', rows: [
                    { name: '1층', price: 600000, feeType: 'USAGE', isRepresentative: true },
                    { name: '1층 특별실', price: 800000, feeType: 'USAGE' },
                    { name: '2층 일반', price: 900000, feeType: 'USAGE' },
                    { name: '2층 특별실', price: 1200000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '성모암', groupType: '개인단', unit: '원', rows: [
                    { name: '극락보전', price: 1500000, feeType: 'USAGE' },
                    { name: '극락보전 특별실 (1기)', price: 3500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '성모암', groupType: '부부단', unit: '원', rows: [
                    { name: '부부단 (2기)', price: 5000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0657', p: p657 });
        console.log('✅', p657.id, p657.name);
    }

    // ===== 658 금오영당 =====
    const p658 = data.find(x => x.id === 'park-0658');
    if (p658) {
        p658.websiteUrl = 'https://hadong-geumo.co.kr';
        p658.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '인조석', unit: '원', rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true, grade: '군내 거주자' },
                    { name: '사용료', price: 300000, feeType: 'USAGE', grade: '군내 본적자' },
                    { name: '사용료', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '상기자 외' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '목제', unit: '원', rows: [
                    { name: '사용료', price: 120000, feeType: 'USAGE', residency: 'LOCAL', grade: '군내 거주자' },
                    { name: '사용료', price: 360000, feeType: 'USAGE', grade: '군내 본적자' },
                    { name: '사용료', price: 1800000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '상기자 외' },
                    { name: '관리비', price: 75000, feeType: 'MAINTENANCE', grade: '1구당, 15년' },
                ]
            },
        ];
        updates.push({ id: 'park-0658', p: p658, websiteUrl: true });
        console.log('✅', p658.id, p658.name);
    }

    // ===== 659 해인사미타원 =====
    const p659 = data.find(x => x.id === 'park-0659');
    if (p659) {
        p659.websiteUrl = 'https://www.mitawon.or.kr';
        p659.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '1층 불교형', groupType: '개인단', unit: '원', rows: [
                    { name: '사용료', price: 4000000, feeType: 'USAGE', isRepresentative: true, grade: '400~700만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '1층 불교형', groupType: '부부단', unit: '원', rows: [
                    { name: '사용료', price: 8000000, feeType: 'USAGE', grade: '800~1,400만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '1층 불교형', groupType: '특별단', unit: '원', rows: [
                    { name: '사용료', price: 25000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 신설단', groupType: '개인단', unit: '원', rows: [
                    { name: '사용료', price: 3000000, feeType: 'USAGE', grade: '일반형, 300~750만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 신설단', groupType: '부부단', unit: '원', rows: [
                    { name: '사용료', price: 6000000, feeType: 'USAGE', grade: '일반형, 600~1,500만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 신설단', groupType: '특별단', unit: '원', rows: [
                    { name: '사용료', price: 40000000, feeType: 'USAGE', grade: '일반형' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '5년, 고인 1위당' },
                ]
            },
        ];
        updates.push({ id: 'park-0659', p: p659, websiteUrl: true });
        console.log('✅', p659.id, p659.name);
    }

    // ===== 660 (공홈 https://www.prds.kr/) =====
    const p660 = data.find(x => x.id === 'park-0660');
    if (p660) {
        p660.websiteUrl = 'https://www.prds.kr';
        p660.priceInfo.standardizedPrices = [
            // 하늘관 특별실 - 개인
            {
                serviceType: 'BONGSAN', subType: '하늘관 특별실', groupType: '개인', unit: '원', rows: [
                    { name: '8단', price: m(800), feeType: 'USAGE' },
                    { name: '7단', price: m(900), feeType: 'USAGE' },
                    { name: '6단', price: m(1000), feeType: 'USAGE' },
                    { name: '5단', price: m(1200), feeType: 'USAGE' },
                    { name: '4단', price: m(1200), feeType: 'USAGE' },
                    { name: '3단', price: m(1000), feeType: 'USAGE' },
                    { name: '2단', price: m(900), feeType: 'USAGE' },
                    { name: '1단', price: m(800), feeType: 'USAGE' },
                ]
            },
            // 하늘관 특별실 - 부부
            {
                serviceType: 'BONGSAN', subType: '하늘관 특별실', groupType: '부부', unit: '원', rows: [
                    { name: '8단', price: m(1600), feeType: 'USAGE' },
                    { name: '7단', price: m(1800), feeType: 'USAGE' },
                    { name: '6단', price: m(2000), feeType: 'USAGE' },
                    { name: '5단', price: m(2400), feeType: 'USAGE' },
                    { name: '4단', price: m(2400), feeType: 'USAGE' },
                    { name: '3단', price: m(2000), feeType: 'USAGE' },
                    { name: '2단', price: m(1800), feeType: 'USAGE' },
                    { name: '1단', price: m(1600), feeType: 'USAGE' },
                ]
            },
            // 하늘관 봉황실 - 개인
            {
                serviceType: 'BONGSAN', subType: '하늘관 봉황실', groupType: '개인', unit: '원', rows: [
                    { name: '8단', price: m(800), feeType: 'USAGE' },
                    { name: '7단', price: m(900), feeType: 'USAGE' },
                    { name: '6단', price: m(1000), feeType: 'USAGE' },
                    { name: '5단', price: m(1200), feeType: 'USAGE' },
                    { name: '4단', price: m(1200), feeType: 'USAGE' },
                    { name: '3단', price: m(1000), feeType: 'USAGE' },
                    { name: '2단', price: m(900), feeType: 'USAGE' },
                    { name: '1단', price: m(800), feeType: 'USAGE' },
                ]
            },
            // 하늘관 봉황실 - 부부
            {
                serviceType: 'BONGSAN', subType: '하늘관 봉황실', groupType: '부부', unit: '원', rows: [
                    { name: '8단', price: m(1600), feeType: 'USAGE' },
                    { name: '7단', price: m(1800), feeType: 'USAGE' },
                    { name: '6단', price: m(2000), feeType: 'USAGE' },
                    { name: '5단', price: m(2400), feeType: 'USAGE' },
                    { name: '4단', price: m(2400), feeType: 'USAGE' },
                    { name: '3단', price: m(2000), feeType: 'USAGE' },
                    { name: '2단', price: m(1800), feeType: 'USAGE' },
                    { name: '1단', price: m(1600), feeType: 'USAGE' },
                ]
            },
            // 하늘관 VIP
            {
                serviceType: 'BONGSAN', subType: '하늘관 VIP', unit: '원', rows: [
                    { name: '8단', price: m(1800), feeType: 'USAGE', grade: '1,800~2,600만원' },
                    { name: '7단', price: m(2000), feeType: 'USAGE', grade: '2,000~2,800만원' },
                    { name: '6단', price: m(2600), feeType: 'USAGE', grade: '2,600~3,500만원' },
                    { name: '5단', price: m(2600), feeType: 'USAGE', grade: '2,600~3,500만원' },
                    { name: '4단', price: m(2600), feeType: 'USAGE', grade: '2,600~3,500만원' },
                    { name: '3단', price: m(2300), feeType: 'USAGE', grade: '2,300~3,400만원' },
                    { name: '2단', price: m(2000), feeType: 'USAGE', grade: '2,000~2,800만원' },
                    { name: '1단', price: m(1800), feeType: 'USAGE', grade: '1,800~2,600만원' },
                ]
            },
            // 별빛관 - 개인
            {
                serviceType: 'BONGSAN', subType: '별빛관', groupType: '개인', unit: '원', rows: [
                    { name: '7단', price: m(800), feeType: 'USAGE' },
                    { name: '6단', price: m(850), feeType: 'USAGE' },
                    { name: '5단', price: m(1000), feeType: 'USAGE' },
                    { name: '4단', price: m(1000), feeType: 'USAGE' },
                    { name: '3단', price: m(900), feeType: 'USAGE' },
                    { name: '2단', price: m(800), feeType: 'USAGE' },
                    { name: '1단', price: m(700), feeType: 'USAGE' },
                ]
            },
            // 별빛관 - 특별
            {
                serviceType: 'BONGSAN', subType: '별빛관', groupType: '특별', unit: '원', rows: [
                    { name: '7단', price: m(1600), feeType: 'USAGE' },
                    { name: '6단', price: m(1700), feeType: 'USAGE' },
                    { name: '5단', price: m(2000), feeType: 'USAGE' },
                    { name: '4단', price: m(2000), feeType: 'USAGE' },
                    { name: '3단', price: m(1800), feeType: 'USAGE' },
                    { name: '2단', price: m(1600), feeType: 'USAGE' },
                    { name: '1단', price: m(1400), feeType: 'USAGE' },
                ]
            },
            // 햇빛관 - 개인
            {
                serviceType: 'BONGSAN', subType: '햇빛관', groupType: '개인', unit: '원', rows: [
                    { name: '8단', price: m(550), feeType: 'USAGE', isRepresentative: true },
                    { name: '7단', price: m(600), feeType: 'USAGE' },
                    { name: '6단', price: m(750), feeType: 'USAGE' },
                    { name: '5단', price: m(800), feeType: 'USAGE' },
                    { name: '4단', price: m(800), feeType: 'USAGE' },
                    { name: '3단', price: m(700), feeType: 'USAGE' },
                    { name: '2단', price: m(600), feeType: 'USAGE' },
                    { name: '1단', price: m(500), feeType: 'USAGE' },
                ]
            },
            // 햇빛관 - 부부
            {
                serviceType: 'BONGSAN', subType: '햇빛관', groupType: '부부', unit: '원', rows: [
                    { name: '8단', price: m(1100), feeType: 'USAGE' },
                    { name: '7단', price: m(1200), feeType: 'USAGE' },
                    { name: '6단', price: m(1500), feeType: 'USAGE' },
                    { name: '5단', price: m(1600), feeType: 'USAGE' },
                    { name: '4단', price: m(1600), feeType: 'USAGE' },
                    { name: '3단', price: m(1400), feeType: 'USAGE' },
                    { name: '2단', price: m(1200), feeType: 'USAGE' },
                    { name: '1단', price: m(1000), feeType: 'USAGE' },
                ]
            },
            // S관 - 개인
            {
                serviceType: 'BONGSAN', subType: 'S관', groupType: '개인', unit: '원', rows: [
                    { name: '8단', price: m(400), feeType: 'USAGE' },
                    { name: '7단', price: m(450), feeType: 'USAGE' },
                    { name: '6단', price: m(600), feeType: 'USAGE' },
                    { name: '5단', price: m(650), feeType: 'USAGE' },
                    { name: '4단', price: m(650), feeType: 'USAGE' },
                    { name: '3단', price: m(550), feeType: 'USAGE' },
                    { name: '2단', price: m(450), feeType: 'USAGE' },
                    { name: '1단', price: m(350), feeType: 'USAGE' },
                ]
            },
            // S관 - 부부
            {
                serviceType: 'BONGSAN', subType: 'S관', groupType: '부부', unit: '원', rows: [
                    { name: '8단', price: m(800), feeType: 'USAGE' },
                    { name: '7단', price: m(900), feeType: 'USAGE' },
                    { name: '6단', price: m(1200), feeType: 'USAGE' },
                    { name: '5단', price: m(1300), feeType: 'USAGE' },
                    { name: '4단', price: m(1300), feeType: 'USAGE' },
                    { name: '3단', price: m(1100), feeType: 'USAGE' },
                    { name: '2단', price: m(900), feeType: 'USAGE' },
                    { name: '1단', price: m(700), feeType: 'USAGE' },
                ]
            },
            // 야외봉안당
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '전면', unit: '원', rows: [
                    { name: '3단', price: m(2500), feeType: 'USAGE' },
                    { name: '2단', price: m(2300), feeType: 'USAGE' },
                    { name: '1단', price: m(2100), feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '우측면', unit: '원', rows: [
                    { name: '3단', price: m(2300), feeType: 'USAGE' },
                    { name: '2단', price: m(2100), feeType: 'USAGE' },
                    { name: '1단', price: m(1900), feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '좌측면', unit: '원', rows: [
                    { name: '3단', price: m(2100), feeType: 'USAGE' },
                    { name: '2단', price: m(1900), feeType: 'USAGE' },
                    { name: '1단', price: m(1700), feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '후면', unit: '원', rows: [
                    { name: '3단', price: m(2200), feeType: 'USAGE' },
                    { name: '2단', price: m(2000), feeType: 'USAGE' },
                    { name: '1단', price: m(1800), feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '16기', unit: '원', rows: [
                    { name: '3단', price: m(2900), feeType: 'USAGE' },
                    { name: '2단', price: m(2700), feeType: 'USAGE' },
                    { name: '1단', price: m(2500), feeType: 'USAGE' },
                    // 관리비 (실내 7만/년, 야외 14만/년)
                    { name: '관리비 (실내)', price: 70000, feeType: 'MAINTENANCE', grade: '1위당, 1년' },
                    { name: '관리비 (야외)', price: 140000, feeType: 'MAINTENANCE', grade: '1위당, 1년' },
                ]
            },
        ];
        updates.push({ id: 'park-0660', p: p660, websiteUrl: true });
        console.log('✅', p660.id, p660.name);
    }

    // ===== 661 천등산봉안영묘전 → 공홈 이미지 =====
    const p661 = data.find(x => x.id === 'park-0661');
    if (p661) {
        p661.websiteUrl = 'http://www.skymemo.co.kr';
        p661.priceInfo.standardizedPrices = [
            // 일반실 - 개인단 (좌우)
            {
                serviceType: 'BONGSAN', subType: '일반실', groupType: '개인단 (좌우)', unit: '원', rows: [
                    { name: '1단', price: m(150), feeType: 'USAGE' },
                    { name: '2단', price: m(200), feeType: 'USAGE' },
                    { name: '3단', price: m(250), feeType: 'USAGE' },
                    { name: '4단', price: m(300), feeType: 'USAGE' },
                    { name: '5단', price: m(350), feeType: 'USAGE', isRepresentative: true },
                    { name: '6단', price: m(350), feeType: 'USAGE' },
                    { name: '7단', price: m(250), feeType: 'USAGE' },
                    { name: '8단', price: m(200), feeType: 'USAGE' },
                ]
            },
            // 일반실 - 개인단 (중앙)
            {
                serviceType: 'BONGSAN', subType: '일반실', groupType: '개인단 (중앙)', unit: '원', rows: [
                    { name: '1단', price: m(200), feeType: 'USAGE' },
                    { name: '2단', price: m(250), feeType: 'USAGE' },
                    { name: '3단', price: m(300), feeType: 'USAGE' },
                    { name: '4단', price: m(350), feeType: 'USAGE' },
                    { name: '5단', price: m(400), feeType: 'USAGE' },
                    { name: '6단', price: m(400), feeType: 'USAGE' },
                ]
            },
            // 일반실 - 부부단 (좌우)
            {
                serviceType: 'BONGSAN', subType: '일반실', groupType: '부부단 (좌우)', unit: '원', rows: [
                    { name: '1단', price: m(250), feeType: 'USAGE' },
                    { name: '2단', price: m(350), feeType: 'USAGE' },
                    { name: '3단', price: m(450), feeType: 'USAGE' },
                    { name: '4단', price: m(550), feeType: 'USAGE' },
                    { name: '5단', price: m(650), feeType: 'USAGE' },
                    { name: '6단', price: m(650), feeType: 'USAGE' },
                    { name: '7단', price: m(450), feeType: 'USAGE' },
                    { name: '8단', price: m(350), feeType: 'USAGE' },
                ]
            },
            // 일반실 - 부부단 (중앙)
            {
                serviceType: 'BONGSAN', subType: '일반실', groupType: '부부단 (중앙)', unit: '원', rows: [
                    { name: '1단', price: m(350), feeType: 'USAGE' },
                    { name: '2단', price: m(450), feeType: 'USAGE' },
                    { name: '3단', price: m(550), feeType: 'USAGE' },
                    { name: '4단', price: m(650), feeType: 'USAGE' },
                    { name: '5단', price: m(750), feeType: 'USAGE' },
                    { name: '6단', price: m(750), feeType: 'USAGE' },
                ]
            },
            // 가족실
            {
                serviceType: 'BONGSAN', subType: '가족실', unit: '원', rows: [
                    { name: '5단 세로 전체 (좌우)', price: m(1750), feeType: 'USAGE' },
                    { name: '5단 세로 전체 (중앙)', price: m(2500), feeType: 'USAGE' },
                    { name: '관리비', price: 200000, feeType: 'MAINTENANCE', grade: '1위당 4만원/년, 5년 선납' },
                ]
            },
        ];
        updates.push({ id: 'park-0661', p: p661, websiteUrl: true });
        console.log('✅', p661.id, p661.name);
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const updateData = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.websiteUrl) updateData.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
