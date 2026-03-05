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

    // 846: 증평군 추모의집 - 공설
    // 이미지: 사용료 15년 200,000 / 관리비 15년 540,000
    // → grade에 '15년' 추가
    u('park-0846', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 200000, feeType: 'USAGE', grade: '15년', isRepresentative: true },
                { name: '관리비', price: 540000, feeType: 'MAINTENANCE', grade: '15년' },
            ]
        }];
    });

    // 847: 새문안추모관 - 사설
    // 이미지: 안치단 1기 4,000,000 / 관리비 1년 50,000
    // → 관리비 행 추가! grade에 '1기' / '연간'
    u('park-0847', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '안치단', price: 4000000, feeType: 'USAGE', grade: '1기', isRepresentative: true },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        }];
    });

    // 848: 하늘문 봉안당 - 사설
    // 이미지: 납골당 안치료 30cm×30cm 2,500,000 / 납골당 관리비 10년 선납 500,000
    // → 관리비 행 추가! grade 정리
    u('park-0848', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '납골당 안치료', price: 2500000, feeType: 'USAGE', grade: '30cm×30cm', isRepresentative: true },
                { name: '납골당 관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납' },
            ]
        }];
    });

    // 849: 안성시추모공원(봉안담) - 공설
    // 이미지: 봉안담 개인 관내자기준(15년) 450,000 / 부부 관내자기준(15년) 700,000
    // → RESIDENT→LOCAL, grade에 '관내자 기준, 15년'
    u('park-0849', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안담', unit: '원', rows: [
                { name: '봉안담 개인', price: 450000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL', isRepresentative: true },
                { name: '봉안담 부부', price: 700000, feeType: 'USAGE', grade: '15년', residency: 'LOCAL' },
            ]
        }];
    });

    // 850: 산청군공설묘지 본향원 - 공설
    // 이미지: 관내 사용료 100,000 + 관리비 75,000 (15년, 2회 연장 가능, 관내 주민 1년 이상)
    //         관외 사용료 600,000 + 관리비 75,000 (사용상 지장이 없는 범위내 가능)
    // → RESIDENT→LOCAL, NON_RESIDENT→NON_LOCAL, grade에 '15년'
    u('park-0850', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 100000, feeType: 'USAGE', grade: '15년, 2회 연장 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '관리비', price: 75000, feeType: 'MAINTENANCE', grade: '15년', residency: 'LOCAL' },
                { name: '사용료', price: 600000, feeType: 'USAGE', grade: '15년', residency: 'NON_LOCAL' },
                { name: '관리비', price: 75000, feeType: 'MAINTENANCE', grade: '15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 851: 인천가족공원 별빛당 - 공설
    // 이미지: 사용료(관내) 1기/30년 950,000 / 관리료(관내) 1기/30년 300,000
    // → RESIDENT→LOCAL, grade에 '1기, 30년'
    u('park-0851', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 950000, feeType: 'USAGE', grade: '1기, 30년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리료', price: 300000, feeType: 'MAINTENANCE', grade: '1기, 30년', residency: 'LOCAL' },
            ]
        }];
    });

    // 852: 꽃동네 정진석센타(봉안당) - 사설
    // 이미지: 꽃동네가족 봉헌 0원
    // → grade에 '봉헌' 보강 (이미 OK)
    u('park-0852', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '꽃동네가족', price: 0, feeType: 'USAGE', grade: '봉헌', isRepresentative: true },
            ]
        }];
    });

    // 853: 성아우구스띠노수도회 봉안시설 - 사설
    // 이미지: 천주교 성직자, 수도자, 교우 봉헌금 0원
    // → grade에 '봉헌금' 보강
    u('park-0853', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '천주교 관계자', price: 0, feeType: 'USAGE', grade: '봉헌금', isRepresentative: true },
            ]
        }];
    });

    // 854: 대호지공설묘지 봉안묘(개인·가족·평장) - 공설 ⚠️ 야외 봉안묘 → BURIAL!
    // 이미지: 가족봉안묘 사용료:1,786,000원 / 관리비:1,808,000원(30년) / 잔디값:126,000
    // → serviceType BURIAL, 사용료/관리비/잔디값 분리!
    u('park-0854', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료', price: 1786000, feeType: 'USAGE', grade: '가족봉안묘', isRepresentative: true },
                { name: '관리비', price: 1808000, feeType: 'MAINTENANCE', grade: '30년' },
                { name: '잔디값', price: 126000, feeType: 'USAGE', grade: '가족봉안묘' },
            ]
        }];
    });

    // 855: 강동구추모의집 - 공설
    // 이미지: 사용료 최초 15년 200,000
    // → grade에 '최초 15년'
    u('park-0855', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 200000, feeType: 'USAGE', grade: '최초 15년', isRepresentative: true },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(846 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0846 ~ park-0855 완료!');
}
fix();
