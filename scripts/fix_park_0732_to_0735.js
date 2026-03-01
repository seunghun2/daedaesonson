/**
 * 1) isRepresentative 수정: 726, 727, 731 (최저가에 설정해야 함)
 * 2) park-0732 ~ park-0735 가격 데이터 세팅
 *    732 나주납골당 - 아카이브
 *    733 이천시립 추모의집(봉안) - 아카이브
 *    734 창원시립마산영생원 - 아카이브
 *    735 청솔공원 영생의집 - 공홈(gn.go.kr) + 유저 이미지
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

    // ===== isRepresentative 수정 =====

    // 726: 1층 3단 800만→제거, 1층 8단 300만→설정
    const p726 = data.find(x => x.id === 'park-0726');
    if (p726 && p726.priceInfo.standardizedPrices) {
        for (const grp of p726.priceInfo.standardizedPrices) {
            for (const row of grp.rows) {
                delete row.isRepresentative;
            }
        }
        // 1층 개인단 8단(최저 300만)에 설정
        const g1 = p726.priceInfo.standardizedPrices.find(g => g.subType === '봉안당(개인)' && g.groupType === '1층');
        if (g1) {
            const r = g1.rows.find(r => r.name === '8단' && r.feeType === 'USAGE');
            if (r) r.isRepresentative = true;
        }
        updates.push({ id: 'park-0726', p: p726 });
        console.log('🔧 726 isRepresentative → 1층 8단 개인 300만');
    }

    // 727: 영구봉안 5단 450만→제거, 9단 200만→설정
    const p727 = data.find(x => x.id === 'park-0727');
    if (p727 && p727.priceInfo.standardizedPrices) {
        for (const grp of p727.priceInfo.standardizedPrices) {
            if (grp.serviceType === 'BONGSAN') {
                for (const row of grp.rows) {
                    delete row.isRepresentative;
                }
            }
        }
        // 영구봉안 개인 9단(최저 200만)에 설정
        const ge = p727.priceInfo.standardizedPrices.find(g => g.subType === '봉안당(개인)' && g.groupType === '영구봉안');
        if (ge) {
            const r = ge.rows.find(r => r.name === '9단');
            if (r) r.isRepresentative = true;
        }
        updates.push({ id: 'park-0727', p: p727 });
        console.log('🔧 727 isRepresentative → 영구봉안 9단 개인 200만');
    }

    // 731: 영구 270만→제거, 15년 175만→설정
    const p731 = data.find(x => x.id === 'park-0731');
    if (p731 && p731.priceInfo.standardizedPrices) {
        for (const grp of p731.priceInfo.standardizedPrices) {
            for (const row of grp.rows) {
                delete row.isRepresentative;
            }
        }
        // 개인단 15년(최저 175만)에 설정
        const gp = p731.priceInfo.standardizedPrices.find(g => g.subType === '봉안당(개인)');
        if (gp) {
            const r = gp.rows.find(r => r.name === '사용료 (15년)');
            if (r) r.isRepresentative = true;
        }
        updates.push({ id: 'park-0731', p: p731 });
        console.log('🔧 731 isRepresentative → 15년 개인 175만');
    }

    // ===== 732 나주납골당 (아카이브) =====
    // 단기(15년) 관리비미포함(1년3만) 1,500,000 (개인 추정)
    // 영구 관리비미포함(1년3만) 4,000,000 (개인 추정)
    // 단기(15년) 관리비미포함(1년3만) 3,000,000 (부부 추정)
    // 영구 관리비미포함(1년3만) 8,000,000 (부부 추정)
    const p732 = data.find(x => x.id === 'park-0732');
    if (p732) {
        p732.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (단기 15년)', price: 1500000, feeType: 'USAGE', grade: '15년', isRepresentative: true },
                    { name: '사용료 (영구)', price: 4000000, feeType: 'USAGE', grade: '영구' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '연간, 별도' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (단기 15년)', price: 3000000, feeType: 'USAGE', grade: '15년' },
                    { name: '사용료 (영구)', price: 8000000, feeType: 'USAGE', grade: '영구' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '연간, 별도' },
                ]
            },
        ];
        updates.push({ id: 'park-0732', p: p732 });
        console.log('✅', p732.id, p732.name);
    }

    // ===== 733 이천시립 추모의집(봉안) (아카이브) =====
    // 개인(관내자) 350,000 관리비포함/3회연장가능(1회연장시 사용료 납부)
    // 개인(관외자) 525,000
    // 부부(관내자) 600,000 관리비포함/3회연장가능
    // 부부(관외자) 900,000 (관외자 = 이천시 주소 두고 6개월이상 거주한 연고자의 망인)
    const p733 = data.find(x => x.id === 'park-0733');
    if (p733) {
        p733.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인)', price: 350000, feeType: 'USAGE', grade: '관리비포함, 3회 연장가능', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료 (개인)', price: 525000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '사용료 (부부)', price: 600000, feeType: 'USAGE', grade: '관리비포함, 3회 연장가능', residency: 'LOCAL' },
                    { name: '사용료 (부부)', price: 900000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0733', p: p733 });
        console.log('✅', p733.id, p733.name);
    }

    // ===== 734 창원시립마산영생원 (아카이브) =====
    // 유연유골(관내) 1구/15년 170,000 / 유연유골(관외) 1구/15년 1,000,000
    // 무연유골(관내) 1구/10년 90,000 / 무연유골(관외) 1구/10년 300,000
    const p734 = data.find(x => x.id === 'park-0734');
    if (p734) {
        p734.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '유연유골', price: 170000, feeType: 'USAGE', grade: '1구, 15년', isRepresentative: true, residency: 'LOCAL' },
                    { name: '유연유골', price: 1000000, feeType: 'USAGE', grade: '1구, 15년', residency: 'NON_LOCAL' },
                    { name: '무연유골', price: 90000, feeType: 'USAGE', grade: '1구, 10년', residency: 'LOCAL' },
                    { name: '무연유골', price: 300000, feeType: 'USAGE', grade: '1구, 10년', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0734', p: p734 });
        console.log('✅', p734.id, p734.name);
    }

    // ===== 735 청솔공원 영생의집 (공홈 + 유저 이미지) =====
    // 본관: 기본15년, 15년씩 계속 연장 가능, 만료4개월전 연장신청
    // 신관: 기본15년, 15년 1회 연장 가능(최대30년)
    // 단장: 사용료 349,000 + 관리비 132,000 = 합계 481,000
    // 부부합장: 사용료 699,000 + 관리비 264,000 = 합계 963,000 (실제 699,000 = 349,000*2)
    // 무연: 사용료 232,000 + 관리비 87,000 = 합계 319,000
    const p735 = data.find(x => x.id === 'park-0735');
    if (p735) {
        p735.websiteUrl = 'https://www.gn.go.kr/www/contents.do?key=1168';
        p735.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (단장)', price: 349000, feeType: 'USAGE', grade: '본관15년(계속연장), 신관15년(1회연장, 최대30년)', isRepresentative: true },
                    { name: '관리비 (단장)', price: 132000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (부부합장)', price: 699000, feeType: 'USAGE' },
                    { name: '관리비 (부부합장)', price: 264000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (무연)', price: 232000, feeType: 'USAGE' },
                    { name: '관리비 (무연)', price: 87000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0735', p: p735, ws: true });
        console.log('✅', p735.id, p735.name);
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
