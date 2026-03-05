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

    // 856: 석문공설묘지 가족봉안묘 - 공설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 사용료 및 관리비 → 최초 신청시 15년 (관내) 3,399,000
    // → OTHER→BURIAL, feeType MAINTENANCE→USAGE, grade에 '관내, 최초 15년, 사용료+관리비 포함'
    u('park-0856', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 3399000, feeType: 'USAGE', grade: '관내, 최초 15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    // 857: 오봉사 봉안당 - 사설
    // 이미지: 납골단 목재 2,000,000
    // 현재 데이터 OK. grade '목재' 있음.
    u('park-0857', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '납골단', price: 2000000, feeType: 'USAGE', grade: '목재', isRepresentative: true },
            ]
        }];
    });

    // 858: 대정읍봉안당(만장) - 공설
    // 이미지: 0원, 2010년 이후 만장
    // 현재 데이터 OK. grade '2010년 이후' 있음. isRepresentative 없음 → 추가
    u('park-0858', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '만장', price: 0, feeType: 'USAGE', grade: '2010년 이후', isRepresentative: true },
            ]
        }];
    });

    // 859: 대호지공설묘지 어성정 - 공설
    // 이미지: 일반 509,200 (30년, 1회 연장 가능) → 봉안당(실내건물)
    // BONGSAN OK. grade에 '30년, 1회 연장 가능'
    u('park-0859', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '일반', price: 509200, feeType: 'USAGE', grade: '30년, 1회 연장 가능', isRepresentative: true },
            ]
        }];
    });

    // 860: 성산읍공설봉안당 - 공설
    // 이미지: 1봉안실(관내(20,000,관외 50,000)) → 안치료
    // → RESIDENT→LOCAL, NON_RESIDENT→NON_LOCAL
    u('park-0860', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '1봉안실', price: 20000, feeType: 'USAGE', grade: '안치료', residency: 'LOCAL', isRepresentative: true },
                { name: '1봉안실', price: 50000, feeType: 'USAGE', grade: '안치료', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 861: 솔뫼공설묘지 가족봉안묘 - 공설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 가족봉안묘 5,436,000 (사용료:228만원, 관리비:148만3천원, 잔디값:19만원)
    // → OTHER→BURIAL, 총액→행 분리!
    u('park-0861', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료', price: 2280000, feeType: 'USAGE', grade: '가족봉안묘', isRepresentative: true },
                { name: '관리비', price: 1483000, feeType: 'MAINTENANCE', grade: '가족봉안묘' },
                { name: '잔디값', price: 190000, feeType: 'USAGE', grade: '가족봉안묘' },
            ]
        }];
    });

    // 862: 솔뫼공설묘지 안향정 - 공설
    // 이미지: 일반 400,000 (30년, 1회 연장 가능) → 봉안당(실내건물)
    // EXTENSION→USAGE
    u('park-0862', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                { name: '일반', price: 400000, feeType: 'USAGE', grade: '30년, 1회 연장 가능', isRepresentative: true },
            ]
        }];
    });

    // 863: 모란공원(봉안) - 사설 ⚠️ 복잡! 봉안당+봉안담+봉안묘
    // 이미지: 사용료 사용기간:10년
    //   봉안당: 안장시 거주자 700,000 / 3개월이상미만 1,200,000
    //           연장시 거주자 200,000 / 3개월이상미만 400,000 / 3개월이하 600,000
    //   봉안담: 1기형 안장시 거주 2,300,000 / 3개월이상미만 3,800,000
    //           1기형 연장시 거주 1,600,000 / 3개월이상미만 2,400,000 / 3개월이하 3,200,000
    //           2기형 안장시 거주 2,900,000 / 3개월이상미만 4,800,000
    //           2기형 연장시 거주 2,000,000 / 3개월이상미만 3,000,000 / 3개월이하 4,000,000
    //   봉안묘(야외→BURIAL!): 2기형 거주 5,280,000 / 3개월이상미만 7,780,000
    //                       4기형 거주 6,550,000 / 3개월이상미만 9,750,000
    //                       14기형 거주 17,532,000 / 3개월이상미만 28,032,000
    // → RESIDENT→LOCAL, EXTENSION→MAINTENANCE (연장시 = 연장요금 → 관리비 안내로),
    //   '3개월이상미만'→grade 보강, 봉안묘는 BURIAL!
    u('park-0863', p => {
        p.priceInfo.standardizedPrices = [
            // 봉안당 (실내 → BONGSAN)
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                    { name: '안장시', price: 700000, feeType: 'USAGE', grade: '10년, 거주자', residency: 'LOCAL', isRepresentative: true },
                    { name: '안장시', price: 1200000, feeType: 'USAGE', grade: '10년, 3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '연장시', price: 200000, feeType: 'MAINTENANCE', grade: '거주자', residency: 'LOCAL' },
                    { name: '연장시', price: 400000, feeType: 'MAINTENANCE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '연장시', price: 600000, feeType: 'MAINTENANCE', grade: '3개월 이하 거주자' },
                ]
            },
            // 봉안담 (실내/벽형 → BONGSAN)
            {
                serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                    { name: '안장시 (1기형)', price: 2300000, feeType: 'USAGE', grade: '10년, 거주자', residency: 'LOCAL', isRepresentative: true },
                    { name: '안장시 (1기형)', price: 3800000, feeType: 'USAGE', grade: '10년, 3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '안장시 (2기형)', price: 2900000, feeType: 'USAGE', grade: '10년, 거주자', residency: 'LOCAL' },
                    { name: '안장시 (2기형)', price: 4800000, feeType: 'USAGE', grade: '10년, 3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '연장시 (1기형)', price: 1600000, feeType: 'MAINTENANCE', grade: '거주자', residency: 'LOCAL' },
                    { name: '연장시 (1기형)', price: 2400000, feeType: 'MAINTENANCE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '연장시 (1기형)', price: 3200000, feeType: 'MAINTENANCE', grade: '3개월 이하 거주자' },
                    { name: '연장시 (2기형)', price: 2000000, feeType: 'MAINTENANCE', grade: '거주자', residency: 'LOCAL' },
                    { name: '연장시 (2기형)', price: 3000000, feeType: 'MAINTENANCE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '연장시 (2기형)', price: 4000000, feeType: 'MAINTENANCE', grade: '3개월 이하 거주자' },
                ]
            },
            // 봉안묘 (야외 → BURIAL!)
            {
                serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                    { name: '2기형', price: 5280000, feeType: 'USAGE', grade: '거주자', residency: 'LOCAL', isRepresentative: true },
                    { name: '2기형', price: 7780000, feeType: 'USAGE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '4기형', price: 6550000, feeType: 'USAGE', grade: '거주자', residency: 'LOCAL' },
                    { name: '4기형', price: 9750000, feeType: 'USAGE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                    { name: '14기형', price: 17532000, feeType: 'USAGE', grade: '거주자', residency: 'LOCAL' },
                    { name: '14기형', price: 28032000, feeType: 'USAGE', grade: '3개월 이상 거주자 미만', residency: 'NON_LOCAL' },
                ]
            },
        ];
    });

    // 864: 청솔공원 봉안묘 - 공설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 가족봉안묘 4,308,000 (사용료:841,000+관리비15년:396,000+석물비:2,611,000+석물설치비:460,000)
    // → OTHER→BURIAL, 총액→사용료/관리비/석물 아코디언 분리!
    u('park-0864', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                    { name: '사용료', price: 841000, feeType: 'USAGE', grade: '가족봉안묘', isRepresentative: true },
                    { name: '관리비', price: 396000, feeType: 'MAINTENANCE', grade: '15년' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물', unit: '원', rows: [
                    { name: '석물비', price: 2611000, feeType: 'USAGE' },
                    { name: '석물설치비', price: 460000, feeType: 'USAGE' },
                ]
            },
        ];
    });

    // 865: 노들하늘공원(동작구추모의집) - 공설
    // 이미지: 15년 사용 → 15년사용료+관리비 800,000
    // → MAINTENANCE→USAGE (이건 사용료+관리비 합산 → 메인 사용료), grade '15년, 사용료+관리비 포함'
    u('park-0865', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(856 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0856 ~ park-0865 완료!');
}
fix();
