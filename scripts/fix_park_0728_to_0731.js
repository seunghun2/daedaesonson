/**
 * park-0728 ~ park-0731 가격 데이터 세팅
 * 728 상락향 극락전 - 아카이브
 * 729 울산하늘공원 추모의집 - 아카이브
 * 730 흑석동성당 평화의쉼터 - 공홈(bstsd.or.kr) + 아카이브 가격
 * 731 하늘원추모관 - 아카이브
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

    // ===== 728 상락향 극락전 (아카이브) =====
    // 일반단 20년 사용료 5,000,000 / 관리비 1년 50,000
    // 특별단 20년 사용료 10,000,000 / 관리비 1년 50,000
    const p728 = data.find(x => x.id === 'park-0728');
    if (p728) {
        p728.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (일반단)', price: 5000000, feeType: 'USAGE', grade: '20년', isRepresentative: true },
                    { name: '관리비 (일반단)', price: 50000, feeType: 'MAINTENANCE', grade: '연간' },
                    { name: '사용료 (특별단)', price: 10000000, feeType: 'USAGE', grade: '20년' },
                    { name: '관리비 (특별단)', price: 50000, feeType: 'MAINTENANCE', grade: '연간' },
                ]
            },
        ];
        updates.push({ id: 'park-0728', p: p728 });
        console.log('✅', p728.id, p728.name);
    }

    // ===== 729 울산하늘공원 추모의집 (아카이브) =====
    // 추모의집(봉안당) 이용료: 개인단 1구당 관내15년 330,000 / 부부단 1구당 관내15년 330,000
    // 연장 이용료: 개인단 1구당 관내5년 110,000 / 부부단 1구당 관내5년 110,000
    const p729 = data.find(x => x.id === 'park-0729');
    if (p729) {
        p729.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 330000, feeType: 'USAGE', grade: '관내 15년', isRepresentative: true },
                    { name: '연장 사용료 (개인단)', price: 110000, feeType: 'USAGE', grade: '관내 5년 연장' },
                    { name: '사용료 (부부단)', price: 330000, feeType: 'USAGE', grade: '관내 15년' },
                    { name: '연장 사용료 (부부단)', price: 110000, feeType: 'USAGE', grade: '관내 5년 연장' },
                ]
            },
        ];
        updates.push({ id: 'park-0729', p: p729 });
        console.log('✅', p729.id, p729.name);
    }

    // ===== 730 흑석동성당 평화의쉼터 (공홈 + 아카이브 가격) =====
    // 봉헌금 8,000,000 + 관리비10년 500,000 (개인 추정)
    // 봉헌금 13,000,000 + 관리비10년 1,000,000 (부부 추정)
    const p730 = data.find(x => x.id === 'park-0730');
    if (p730) {
        p730.websiteUrl = 'https://bstsd.or.kr/ossuary';
        p730.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '봉헌금 (개인)', price: 8000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비 (개인)', price: 500000, feeType: 'MAINTENANCE', grade: '10년' },
                    { name: '봉헌금 (부부)', price: 13000000, feeType: 'USAGE' },
                    { name: '관리비 (부부)', price: 1000000, feeType: 'MAINTENANCE', grade: '10년' },
                ]
            },
        ];
        updates.push({ id: 'park-0730', p: p730, ws: true });
        console.log('✅', p730.id, p730.name);
    }

    // ===== 731 하늘원추모관 (아카이브) =====
    // 개인단(영구): 2,700,000 (180~450만원 관리비90만)
    // 개인단(15년): 1,750,000 (130~320만원 관리비45만)
    // 부부단(영구): 4,700,000 (350~800만원 관리비120만)
    // 부부단(15년): 3,250,000 (250~560만원 관리비75만)
    const p731 = data.find(x => x.id === 'park-0731');
    if (p731) {
        p731.priceInfo.standardizedPrices = [
            // 개인단
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (영구)', price: 2700000, feeType: 'USAGE', grade: '180~450만, 관리비 포함', isRepresentative: true },
                    { name: '관리비 (영구)', price: 900000, feeType: 'MAINTENANCE', note: '사용료에 포함' },
                    { name: '사용료 (15년)', price: 1750000, feeType: 'USAGE', grade: '130~320만, 관리비 포함' },
                    { name: '관리비 (15년)', price: 450000, feeType: 'MAINTENANCE', note: '사용료에 포함' },
                ]
            },
            // 부부단
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (영구)', price: 4700000, feeType: 'USAGE', grade: '350~800만, 관리비 포함' },
                    { name: '관리비 (영구)', price: 1200000, feeType: 'MAINTENANCE', note: '사용료에 포함' },
                    { name: '사용료 (15년)', price: 3250000, feeType: 'USAGE', grade: '250~560만, 관리비 포함' },
                    { name: '관리비 (15년)', price: 750000, feeType: 'MAINTENANCE', note: '사용료에 포함' },
                ]
            },
        ];
        updates.push({ id: 'park-0731', p: p731 });
        console.log('✅', p731.id, p731.name);
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
