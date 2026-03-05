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

    // 826: 울릉하늘섬공원 - 공설
    // EXTENSION→USAGE, RESIDENT→LOCAL, NON_RESIDENT→NON_LOCAL
    // 이미지: 관내 130,000 (15년 이용가능 2회 연장가능) / 관외 260,000 (15년 이용가능 2회 연장)
    u('park-0826', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 130000, feeType: 'USAGE', grade: '15년, 2회 연장 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료', price: 260000, feeType: 'USAGE', grade: '15년, 2회 연장 가능', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 827: 춘천안식공원(봉안묘) - 공설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 12기형 가족봉안묘 9,514,260 (사용료1,890,000+관리비1,124,260+석물비6,500,000)
    //        6기형 가족봉안묘 5,128,000 (사용료770,000+관리비458,000+석물비3,900,000)
    // → 야외 봉안묘이므로 BURIAL, 사용료/관리비/석물 분리
    u('park-0827', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                    { name: '사용료 (6기형)', price: 770000, feeType: 'USAGE', grade: '가족봉안묘', isRepresentative: true },
                    { name: '사용료 (12기형)', price: 1890000, feeType: 'USAGE', grade: '가족봉안묘' },
                    { name: '관리비 (6기형)', price: 458000, feeType: 'MAINTENANCE', grade: '가족봉안묘' },
                    { name: '관리비 (12기형)', price: 1124260, feeType: 'MAINTENANCE', grade: '가족봉안묘' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물', unit: '원', rows: [
                    { name: '석물비 (6기형)', price: 3900000, feeType: 'USAGE' },
                    { name: '석물비 (12기형)', price: 6500000, feeType: 'USAGE' },
                ]
            },
        ];
    });

    // 828: 대한불교조계종 천룡사납골당 - 사설
    // 이미지: 유골함 30cm×60cm 4,000,000 / 유골함 30cm×30cm 2,000,000
    // 기존 데이터 OK, grade 소폭 정리
    u('park-0828', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '유골함 (대)', price: 4000000, feeType: 'USAGE', grade: '30cm × 60cm', isRepresentative: true },
                { name: '유골함 (소)', price: 2000000, feeType: 'USAGE', grade: '30cm × 30cm' },
            ]
        }];
    });

    // 829: 동해시하늘정원봉안당 - 공설
    // 이미지: 사용료 및 관리비(봉안당) 관내 15년(단장) 190,000 / 관내 15년(합장) 380,000
    // RESIDENT→LOCAL, grade에 15년 추가
    u('park-0829', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '단장', price: 190000, feeType: 'USAGE', grade: '관내, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '합장', price: 380000, feeType: 'USAGE', grade: '관내, 15년', residency: 'LOCAL' },
            ]
        }];
    });

    // 830: 갑향군립묘원(봉안) - 공설
    // 이미지: 사용료 및 관리비 최초안치15년 기준(관내) 200,000 / (관외) 920,000
    // MAINTENANCE→USAGE, RESIDENT→LOCAL, NON_RESIDENT→NON_LOCAL
    u('park-0830', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '최초 안치 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료 및 관리비', price: 920000, feeType: 'USAGE', grade: '최초 안치 15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 831: 천주교평화의문 - 사설
    // 이미지: 일반구역(A,B,C) 1단~9단 300만원~500만원 3,000,000 / 제대구역(D,F) 1단~9단 400만원~700만원 4,000,000
    // grade에 구역 정보, groupType으로 구역 분리
    u('park-0831', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '일반구역 (A,B,C)', price: 3000000, feeType: 'USAGE', grade: '1단~9단, 300만~500만원', isRepresentative: true },
                { name: '제대구역 (D,F)', price: 4000000, feeType: 'USAGE', grade: '1단~9단, 400만~700만원' },
            ]
        }];
    });

    // 832: 합천군공설봉안담 - 공설
    // 이미지: 사용료 관내 최초15년(3회연장가능) 250,000 / 관외 최초15년 450,000
    // RESIDENT→LOCAL, NON_RESIDENT→NON_LOCAL, grade 추가
    u('park-0832', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '사용료', price: 250000, feeType: 'USAGE', grade: '최초 15년, 3회 연장 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료', price: 450000, feeType: 'USAGE', grade: '최초 15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 833: 매화원 - 공설
    // 이미지: 사용료 및 관리비 관내15년 200,000 / 수급자 0
    // MAINTENANCE→USAGE, grade 추가, residency LOCAL
    u('park-0833', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '관내, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료 및 관리비', price: 0, feeType: 'USAGE', grade: '수급자 감면', residency: 'LOCAL' },
            ]
        }];
    });

    // 834: 대한불교선각종 정향사 - 사설
    // 이미지: 기간안치(10년) 600,000 / 영구안치 2,000,000
    // grade에 기간 명시
    u('park-0834', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '기간안치', price: 600000, feeType: 'USAGE', grade: '10년', isRepresentative: true },
                { name: '영구안치', price: 2000000, feeType: 'USAGE', grade: '영구' },
            ]
        }];
    });

    // 835: 탑동추모공원 - 사설
    // 이미지: 개인단 영구 사용료:300만원, 관리비 5년:20만원 3,200,000 / 부부단 영구 사용료:600만원, 관리비 5년:40만원 6,400,000
    // grade에 내역 구체화, 관리비 행 추가
    u('park-0835', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 3000000, feeType: 'USAGE', grade: '영구 사용료', isRepresentative: true },
                { name: '부부단', price: 6000000, feeType: 'USAGE', grade: '영구 사용료' },
                { name: '관리비 (개인단)', price: 200000, feeType: 'MAINTENANCE', grade: '5년' },
                { name: '관리비 (부부단)', price: 400000, feeType: 'MAINTENANCE', grade: '5년' },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(826 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0826 ~ park-0835 완료!');
}
fix();
