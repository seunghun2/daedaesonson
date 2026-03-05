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

    // 836: 합천추모공원 봉안당 - 사설
    // 이미지: 개인단(1단~8단) 사용료:150만~550만원/관리비:5만원(1년)이며 5년치(25만원) 선납
    //         부부단(1단~8단) 사용료:250만~1050만원/관리비:5만원(1년)이며 5년치(25만원) 선납
    // 총액 개인단 1,750,000 / 부부단 2,750,000
    // → MAINTENANCE→USAGE, grade에 단 범위+가격 범위
    u('park-0836', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단 (1단~8단)', price: 1750000, feeType: 'USAGE', grade: '사용료 150만~550만원 + 관리비 5년 25만원', isRepresentative: true },
                { name: '부부단 (1단~8단)', price: 2750000, feeType: 'USAGE', grade: '사용료 250만~1,050만원 + 관리비 5년 25만원' },
            ]
        }];
    });

    // 837: 봉선사 봉안당 - 사설
    // 이미지: 1구 봉안 30년 기본단위 사용 5,000,000 / 2구 봉안 30년 기본단위 사용 8,000,000
    // → grade에 '30년' 추가
    u('park-0837', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '1구 봉안', price: 5000000, feeType: 'USAGE', grade: '30년', isRepresentative: true },
                { name: '2구 봉안', price: 8000000, feeType: 'USAGE', grade: '30년' },
            ]
        }];
    });

    // 838: 광릉 더 크레스트 봉안묘 - 사설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 사용료 제곱미터기준 883,000 / 관리비 제곱미터기준(년) 9,030
    u('park-0838', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료', price: 883000, feeType: 'USAGE', grade: '제곱미터 기준', isRepresentative: true },
                { name: '관리비', price: 9030, feeType: 'MAINTENANCE', grade: '제곱미터 기준, 연간' },
            ]
        }];
    });

    // 839: 칠곡군공설봉안당 - 공설
    // 이미지: 사용료 1구 6,000 / 관리비 1구/년 7,000
    // → grade에 단위 추가
    u('park-0839', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 6000, feeType: 'USAGE', grade: '1구', isRepresentative: true },
                { name: '관리비', price: 7000, feeType: 'MAINTENANCE', grade: '1구, 연간' },
            ]
        }];
    });

    // 840: 하늘내린 휴공원(부부단) - 공설
    // 이미지: 부부단(관내) 사용료 40만원, 관리비 20만원/15년 = 600,000 
    //         부부단(관외) 사용료 140만원, 관리비 60만원/15년 = 2,000,000
    // → USAGE/MAINTENANCE 분리, RESIDENT→LOCAL
    u('park-0840', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 (부부단)', price: 400000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리비 (부부단)', price: 200000, feeType: 'MAINTENANCE', grade: '15년', residency: 'LOCAL' },
                { name: '사용료 (부부단)', price: 1400000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                { name: '관리비 (부부단)', price: 600000, feeType: 'MAINTENANCE', grade: '15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 841: 인천가족공원 금마총 - 공설
    // 이미지: 사용료(관내) 1구/10년 250,000 / 관리료(관내) 1구/30년 100,000
    // → RESIDENT→LOCAL, grade에 기간 명시
    u('park-0841', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 250000, feeType: 'USAGE', grade: '1구, 10년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리료', price: 100000, feeType: 'MAINTENANCE', grade: '1구, 30년', residency: 'LOCAL' },
            ]
        }];
    });

    // 842: 김해추모의집 제1·2봉안당 - 공설
    // 이미지: 사용료 및 관리비 최초신청시 15년(관내) 250,000 / 유공자,수급자,장애자1·2급(관내) 125,000
    // → MAINTENANCE→USAGE, residency LOCAL, VETERAN 유지
    u('park-0842', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료 및 관리비', price: 250000, feeType: 'USAGE', grade: '최초 신청시 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료 및 관리비', price: 125000, feeType: 'USAGE', grade: '유공자·수급자·장애자 1·2급', residency: 'VETERAN' },
            ]
        }];
    });

    // 843: 인천가족공원 추모의집 - 공설
    // 이미지: 사용료(관내) 1구/10년 250,000 / 관리금(관내) 1구/10년 100,000
    // → RESIDENT→LOCAL, grade에 기간
    u('park-0843', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 250000, feeType: 'USAGE', grade: '1구, 10년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리금', price: 100000, feeType: 'MAINTENANCE', grade: '1구, 10년', residency: 'LOCAL' },
            ]
        }];
    });

    // 844: 거창공설공원묘지 봉안당 - 공설
    // 이미지: 봉안당 사용료 해당읍 주민, 사용기간: 15년 100,000 / 봉안당 관리비 해당읍 주민, 사용기간: 15년 100,000
    // → residency LOCAL, grade에 기간
    u('park-0844', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 100000, feeType: 'USAGE', grade: '해당읍 주민, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리비', price: 100000, feeType: 'MAINTENANCE', grade: '해당읍 주민, 15년', residency: 'LOCAL' },
            ]
        }];
    });

    // 845: (재)평화공원 가족봉안묘 - 사설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 3.3m 사용료 750,000 / 3.3m 관리비(년) 20,000
    u('park-0845', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료', price: 750000, feeType: 'USAGE', grade: '3.3㎡ 기준', isRepresentative: true },
                { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '3.3㎡ 기준, 연간' },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(836 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0836 ~ park-0845 완료!');
}
fix();
