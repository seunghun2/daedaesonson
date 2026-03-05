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

    // 896: 백운공원묘원 제2묘원 - 사설 (FAMILY_GRAVE)
    // 이미지: 묘지사용료 700,000 (1평 기준) / 묘지관리비 16,000 (1평 기준 1년)
    // 현재: grade '기준' → '1평 기준', 관리비에 ★ 잘못 설정 → 제거 (§15: 관리비에 ★ 금지)
    u('park-0896', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원', rows: [
                { name: '묘지사용료', price: 700000, feeType: 'USAGE', grade: '1평 기준', isRepresentative: true },
                { name: '묘지관리비', price: 16000, feeType: 'MAINTENANCE', grade: '1평 기준, 연간' },
            ]
        }];
    });

    // 897: 서동사 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0897', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 898: 태고종관음사 봉안당 - 사설
    // 이미지: 빈 가격표
    // 현재: grade '시설사용료' → '시설문의'
    u('park-0898', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 899: 부활의집 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0899', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 900: 남국선원봉안탑 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0900', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안탑', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 901: 신당동성당 소화묘원(봉안묘) - 사설
    // 이미지: 빈 가격표
    // ⚠️ §8: 이름에 "봉안묘" → 야외 봉안묘 = BURIAL (BONGSAN 아님!)
    // 현재: serviceType=BONGSAN, subType='봉안묘' → BURIAL로 변경
    u('park-0901', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '봉안묘', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 902: 실로암추모관 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0902', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '추모관', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 903: 밀양성당 천상낙원 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0903', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 904: (재)남양공원묘원 추모관 - 사설
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0904', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '추모관', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    // 905: (재)대지공원묘원 봉안당 - 재단법인
    // 이미지: 빈 가격표
    // 현재: 데이터 없음 → '시설문의' 추가
    u('park-0905', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '봉안당', price: 0, feeType: 'USAGE', grade: '시설문의', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(896 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0896 ~ park-0905 완료!');
}
fix();
