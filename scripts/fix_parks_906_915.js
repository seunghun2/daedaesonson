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

    // 906: 생활불교밝은마음 봉안탑 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0906', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 907: (재)예다원 묘원 - 재단법인 (묘원)
    // 이미지: 시설사용료 테이블 있음:
    //   묘지 사용료(일반시민) = 180,000 / 묘지 1기당 6.61m2 / 15년
    //   묘지 관리비(일반시민) = 120,000 / 묘지 1기당 6.61m2 / 15년
    //   묘지 사용료(특례자) = 270,000 / 여수시에 주민등록... 1년 미만 / 묘지 1기당 6.61m2 / 15년
    //   묘지 관리비(특례자) = 120,000 / 여수시에 주민등록... 1년 미만 / 묘지 1기당 6.61m2 / 15년
    // 
    // ⚠️ 현재 문제:
    //   1. subType '매장묘'/'단장형' 혼재 → '매장묘'로 통일
    //   2. 관리비에 ★ 설정됨 (§15 위반)
    //   3. grade 너무 장황 → 간결화
    //   4. 일반시민=LOCAL, 특례자(1년미만 거주)=NON_LOCAL
    //   5. residency 잘못 설정 (전부 RESIDENT)
    u('park-0907', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                { name: '묘지사용료', price: 180000, feeType: 'USAGE', grade: '1기당 6.61㎡, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '묘지관리비', price: 120000, feeType: 'MAINTENANCE', grade: '1기당 6.61㎡, 15년', residency: 'LOCAL' },
                { name: '묘지사용료', price: 270000, feeType: 'USAGE', grade: '1기당 6.61㎡, 15년', residency: 'NON_LOCAL' },
                { name: '묘지관리비', price: 120000, feeType: 'MAINTENANCE', grade: '1기당 6.61㎡, 15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 908: 대정공원묘원 봉안묘 - 사설
    // 이미지: 빈 가격표
    // ⚠️ §8: 이름에 "봉안묘" → 야외 봉안묘 = BURIAL
    u('park-0908', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 909: 가평추모공원(봉안시설) - 공설
    // 이미지: 빈 가격표
    u('park-0909', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안시설', unit: '원', rows: [
                { name: '봉안시설', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 910: 인천가족공원 봉안담 - 공설
    // 이미지: 빈 가격표
    u('park-0910', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 911: 프란치스꼬의집 - 사설
    // 이미지: 빈 가격표
    // ⚠️ 현재: MAINTENANCE에 ★ (§15 위반 - 관리비에 ★ 금지) → USAGE로 변경 + '시설문의'
    u('park-0911', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 912: 미래사 - 사설
    // 이미지: 빈 가격표
    // ⚠️ 현재: name '서비스 항목' → 부정확
    u('park-0912', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 913: 천주교 인천교구 고잔성당 몽은당 - 사설
    // 이미지: 빈 가격표
    // 현재: grade 없음 → '시설문의' 추가
    u('park-0913', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 914: 우리추모공원 봉안당 - 사설
    // 이미지: 빈 가격표
    // ⚠️ 현재: 불필요한 row 2개 → 정리 + '시설문의'
    u('park-0914', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 915: (재)우성공원 봉안당 - 재단법인
    // 이미지: 빈 가격표
    // ⚠️ 현재: 불필요한 row 2개 → 정리 + '시설문의'
    u('park-0915', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(906 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0906 ~ park-0915 완료!');
}
fix();
