const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const updated = [];

    function u(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('⚠️ NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        updated.push(id);
        console.log('✅', id, p.name);
    }

    // 916: (재)금곡장미공원 봉안당 - 재단법인
    // 이미지: 빈 가격표 (시설사용료/서비스항목/장사용품분류 모두 빈 테이블)
    // 현재: 불필요한 row 2개, grade 없음 → 정리 + '시설문의'
    u('park-0916', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 917: 국원하늘정원 - 사설
    // 이미지: 빈 가격표
    // 현재: grade 없음 → '시설문의' 추가
    u('park-0917', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 918: 대승불교법왕종 한광사 - 사설
    // 이미지: 빈 가격표
    // 현재: grade '미확인' → '시설문의'로 통일
    u('park-0918', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 919: 천주교 황사평 봉안묘 - 사설
    // 이미지: 빈 가격표
    // ⚠️ §8: 이름에 "봉안묘" → 야외 봉안묘 = BURIAL
    // 현재: BONGSAN 봉안당 → BURIAL 봉안묘로 변경
    u('park-0919', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 920: (재)아름다운 청계공원 봉안시설 - 재단법인
    // 이미지: 빈 가격표
    // 현재: 불필요한 row 2개 → 정리 + '시설문의'
    u('park-0920', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안시설', unit: '원', rows: [
                { name: '봉안시설', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 921: 삼광사추모공원 아미타봉안탑 - 사설
    // 이미지: 빈 가격표
    // 현재: subType '봉안당' → 이름에 '봉안탑'이므로 '봉안탑'으로 변경
    u('park-0921', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 922: 천일추모공원 - NOT FOUND in facilities.json → 건너뜀
    console.log('⚠️ park-0922 천일추모공원 - NOT FOUND, 건너뜀');

    // 923: 검단사 봉안당 - 사설
    // 이미지: 빈 가격표
    // 현재: grade 너무 장황 → 정리 + '시설문의'
    u('park-0923', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 924: 화원관광단지공설봉안당 - 공설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0924', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 925: 고당사 효자당 - 사설
    // 이미지: 빈 가격표
    // 현재: grade 없음 → '시설문의' 추가
    // subType: '효자당'은 봉안당 형태이므로 '봉안당' 유지
    u('park-0925', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    for (const id of updated) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0916 ~ park-0925 완료!');
}
fix();
