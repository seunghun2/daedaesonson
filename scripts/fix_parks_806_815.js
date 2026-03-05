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

    // 806: 오룡군립묘원(봉안) - 사용료및관리비 최초안치15년(관내) 200,000 / (관외) 920,000
    // RESIDENT→LOCAL, MAINTENANCE→USAGE, grade 보강
    u('park-0806', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료+관리비', price: 200000, feeType: 'USAGE', grade: '최초 안치, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '사용료+관리비', price: 920000, feeType: 'USAGE', grade: '최초 안치, 15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 807: 하늘내린 휴공원(개인단) - 개인단(관내) 사용료20만+관리비10만/15년 = 300,000 / 개인단(관외) 사용료70만+관리비30만/15년 = 1,000,000
    // grade 보강, residency 추가
    u('park-0807', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 300000, feeType: 'USAGE', grade: '사용료 20만 + 관리비 10만, 15년', residency: 'LOCAL', isRepresentative: true },
                { name: '개인단', price: 1000000, feeType: 'USAGE', grade: '사용료 70만 + 관리비 30만, 15년', residency: 'NON_LOCAL' },
            ]
        }];
    });

    // 808: 인천가족공원 만월당 - 사용료(관내) 1구/10년 250,000 / 관리금(관내) 1구/10년 100,000
    // RESIDENT→LOCAL, grade 보강
    u('park-0808', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 250000, feeType: 'USAGE', grade: '1구, 10년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리료', price: 100000, feeType: 'MAINTENANCE', grade: '1구, 10년', residency: 'LOCAL' },
            ]
        }];
    });

    // 809: 가평군공설봉안묘 - 단장 사용료15만+관리비5만 = 200,000 / 합장 사용료25만+관리비5만 = 300,000
    // MAINTENANCE→USAGE, grade 유지
    u('park-0809', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안묘', unit: '원', rows: [
                { name: '단장', price: 200000, feeType: 'USAGE', grade: '사용료 15만 + 관리비 5만', isRepresentative: true },
                { name: '합장', price: 300000, feeType: 'USAGE', grade: '사용료 25만 + 관리비 5만' },
            ]
        }];
    });

    // 810: 용학사 봉안당 - 개인단 가로27cm×세로27cm 2,500,000 / 부부단 가로57cm×세로27cm 4,500,000
    // grade 보강
    u('park-0810', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 2500000, feeType: 'USAGE', grade: '27cm × 27cm', isRepresentative: true },
                { name: '부부단', price: 4500000, feeType: 'USAGE', grade: '57cm × 27cm' },
            ]
        }];
    });

    // 811: 의령군공설납골묘 - 사용료 시설사용료 300,000 / 관리비 150,000
    // 데이터 거의 OK, grade만 보강
    u('park-0811', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안묘', unit: '원', rows: [
                { name: '사용료', price: 300000, feeType: 'USAGE', grade: '시설사용료', isRepresentative: true },
                { name: '관리비', price: 150000, feeType: 'MAINTENANCE' },
            ]
        }];
    });

    // 812: 서천군영명각 - 사용료(200,000원) / 사용료(300,000원) 두 종류
    // 현재 데이터에는 1행만, grade '간'→삭제, 2행 추가
    u('park-0812', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 200000, feeType: 'USAGE', isRepresentative: true },
                { name: '사용료', price: 300000, feeType: 'USAGE' },
            ]
        }];
    });

    // 813: 휴마루 - 개인단 최초15년사용,2회연장가능 500,000 / 부부단 최초15년사용,2회연장가능 1,000,000
    // grade 보강
    u('park-0813', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '개인단', price: 500000, feeType: 'USAGE', grade: '최초 15년, 2회 연장 가능', isRepresentative: true },
                { name: '부부단', price: 1000000, feeType: 'USAGE', grade: '최초 15년, 2회 연장 가능' },
            ]
        }];
    });

    // 814: 봉은사 봉안당 - 봉안당안치 미타R6-11 5,400,000 / 봉안당관리비 2위 1,000,000
    // grade 보강
    u('park-0814', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '안치비', price: 5400000, feeType: 'USAGE', grade: '미타R6-11', isRepresentative: true },
                { name: '관리비', price: 1000000, feeType: 'MAINTENANCE', grade: '2위' },
            ]
        }];
    });

    // 815: (재)대전교구천주교회 성환공원묘원 봉안당 - 사용료 영구사용 3,500,000 / 관리비 20년간 500,000
    // grade 보강
    u('park-0815', p => {
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: [
                { name: '사용료', price: 3500000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '20년간' },
            ]
        }];
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    const ids = Array.from({ length: 10 }, (_, i) => 'park-' + String(806 + i).padStart(4, '0'));
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(f.priceInfo) }).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }
    console.log('\n🎉 park-0806 ~ park-0815 완료!');
}
fix();
