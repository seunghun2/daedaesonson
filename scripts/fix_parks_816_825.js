const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    function u(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // 816: 장미원 - 사용료및관리비 관내15년 200,000 / 수급자 0
    // RESIDENT→LOCAL, grade 보강
    u('park-0816', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '관내, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료 및 관리비', price: 0, feeType: 'USAGE', grade: '수급자 감면', residency: 'LOCAL' },
            ]
        }];
    });

    // 817: 에덴추모원 - 1~7단 가격동일 영구 2,000,000(관리비1년3만원) / 5년안치 1,000,000
    // grade 보강
    u('park-0817', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '영구', price: 2000000, feeType: 'USAGE', grade: '1~7단, 관리비 연 3만원 별도', isRepresentative: true },
                { name: '5년', price: 1000000, feeType: 'USAGE', grade: '1~7단' },
                { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        }];
    });

    // 818: 달마사봉안당 - 개인단 영구임대 300만원~950만원 / 안치단관리비 10년단위 500,000
    // price 3,000,000 (대표), 관리비 추가
    u('park-0818', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 3000000, feeType: 'USAGE', grade: '영구 임대, 300만~950만원', isRepresentative: true },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 단위' },
            ]
        }];
    });

    // 819: 청주시목련원목련당 - 봉안당(개인단) 최초15년(관내) 300,000 / 봉안당(부부단) 최초15년(관내) 500,000
    // RESIDENT→LOCAL, grade 보강
    u('park-0819', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 300000, feeType: 'USAGE', grade: '최초 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '부부단', price: 500000, feeType: 'USAGE', grade: '최초 15년', residency: 'LOCAL' },
            ]
        }];
    });

    // 820: 평창군 공설봉안당 - 봉안당(단장) 사용료 600,000 / 봉안당(합장) 사용료 1,200,000
    // subType 봉안담→봉안당 수정, 행 추가
    u('park-0820', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '단장', price: 600000, feeType: 'USAGE', grade: '사용료', isRepresentative: true },
                { name: '합장', price: 1200000, feeType: 'USAGE', grade: '사용료' },
            ]
        }];
    });

    // 821: 하늘의문(천주교 신곡2동성당) - 시설이용 봉헌금 0(문의) / 관리비 15년(부부단2위중 선봉안일기준) 1,000,000
    // 관리비→USAGE(봉헌금), MAINTENANCE 추가
    u('park-0821', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '시설이용', price: 0, feeType: 'USAGE', grade: '봉헌금 (문의)', isRepresentative: true },
                { name: '관리비', price: 1000000, feeType: 'MAINTENANCE', grade: '15년, 부부단 2위 중 선봉안 1기 기준' },
            ]
        }];
    });

    // 822: 횡성군공설추모공원 추모관 - 개인함 최초1회비용(15년) 150,000 / 가족함 최초1회비용(15년) 300,000
    // grade 보강
    u('park-0822', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인함', price: 150000, feeType: 'USAGE', grade: '최초 1회, 15년', isRepresentative: true },
                { name: '가족함', price: 300000, feeType: 'USAGE', grade: '최초 1회, 15년' },
            ]
        }];
    });

    // 823: 대한불교 조계종 보륜사 봉안당 - 사용료 0.09m2 1칸에 1함 2,000,000 / 관리비 0.09m2 1칸에 1함 1,000,000
    // grade 보강
    u('park-0823', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 2000000, feeType: 'USAGE', grade: '0.09㎡, 1칸 1함', isRepresentative: true },
                { name: '관리비', price: 1000000, feeType: 'MAINTENANCE', grade: '0.09㎡, 1칸 1함' },
            ]
        }];
    });

    // 824: 하늘내린 보금자리(가족8위) - 가족단(8기) 사용료800만,관리비300만/15년 11,000,000 / 가족단(12기) 사용료1200만,관리비300만/15년 15,000,000
    // grade 보강
    u('park-0824', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '가족단 8기', price: 11000000, feeType: 'USAGE', grade: '사용료 800만 + 관리비 300만, 15년', isRepresentative: true },
                { name: '가족단 12기', price: 15000000, feeType: 'USAGE', grade: '사용료 1,200만 + 관리비 300만, 15년' },
            ]
        }];
    });

    // 825: 완주군 추모의집 - 사용료및관리비 전주,완주6개월이상거주(계약자또는사망자),10년임대 100,000 / 기초생활수급권자50%감면 50,000
    // MAINTENANCE→USAGE, residency LOCAL, grade 보강
    u('park-0825', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료+관리비', price: 100000, feeType: 'USAGE', grade: '10년 임대', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료+관리비', price: 50000, feeType: 'USAGE', grade: '기초생활수급권자 50% 감면', residency: 'LOCAL' },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(816 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0816 ~ park-0825 완료!');
}
fix();
