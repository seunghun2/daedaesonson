/**
 * park-0786 ~ park-0795 가격 데이터 정제
 * 
 * 786. 여수시영락공원 제2봉안당 - 공설, 봉안당(일반시민) 1년이상 여수시에 거주하신분 12만, 특례자 50만, 50%감면자(유공자등) 6만 → grade 보강
 * 787. 안흥동공설묘지(봉안시설) - 공설, 일반(사용료) 15년기준 3회연장가능 38만, 일반(관리비) 15년기준 3회연장가능 관리비 15년 15만원 15만, 각인비 15년기준 14,300 → grade 보강
 * 788. 거제시추모의집 - 공설, 유연유골 관내거주자 15년 최초계약 30만, 관외거주자(거제에연고있는자) 15년 최초계약 100만, 무연유골 관내거주자 10년 20만 → residency 추가, grade 보강
 * 789. 일월사추모공원(봉안당) - 사설, A그룹 15년/관리비:3만원 100만, B그룹 75만, C그룹 50만 → grade에 15년/관리비 3만 추가
 * 790. 천주교산내공원묘원 봉안담 - 사설, 사용료 영구사용 250만, 관리비 20년간 50만 → serviceType BONGSAN(봉안담), grade 보강
 * 791. (재)청구공원 봉안당 - 사설, 사용료 평당 50만, 관리비 평당 8,000 → grade에 평당 추가
 * 792. 상락향 봉안탑 - 사설, 1인기사용료 30년 500만, 관리비 1년 5만 → serviceType BONGSAN, grade 보강
 * 793. 춘천안식공원(안식의집) - 공설, 개인 사용료(24만)+관리비(46,800)+위패비(1만) 311,800, 부부 사용료(48만)+관리비(84,200)+위패비(1만/1위당) 614,200 → grade 보강
 * 794. 인천가족공원 평온당 - 공설, 사용료(관내) 1기/30년 95만, 관리금(관내) 1기/30년 30만 → residency LOCAL, grade 보강
 * 795. (재)신세계공원묘원 봉안묘·담 - 사설, 묘지사용료 평당가 55만, 관리비 평당기(년) 9,000 → serviceType BURIAL(봉안묘·담=야외), grade 보강
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // ==========================================
    // park-0786: 여수시영락공원 제2봉안당
    // 이미지: 봉안당(일반시민) 1년이상 여수시에 거주하신분 120,000 / 봉안당(특례자) 고인본적서 여수시에 자녀나 손자가 있으신 경우 해당 500,000 / 봉안당(50%감면대상자) 여수시에 주소를둔 기초생활수급자,국가유공자,구호대상자 60,000
    // ==========================================
    update('park-0786', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 (일반시민)', price: 120000, feeType: 'USAGE', grade: '1년 이상 여수시 거주', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 (특례자)', price: 500000, feeType: 'USAGE', grade: '고인 본적 여수시, 자녀/손자 해당' },
                    { name: '사용료 (50% 감면)', price: 60000, feeType: 'USAGE', grade: '유공자/수급자/구호대상자', residency: 'LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0787: 안흥동공설묘지(봉안시설)
    // 이미지: 일반(사용료) 15년 기준, 3회 연장 가능 380,000 / 일반(관리비) 15년 기준, 3회 연장가능 관리비 15년 15만원 150,000 / 각인비 15년 기준 14,300
    // ==========================================
    update('park-0787', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 380000, feeType: 'USAGE', grade: '15년 기준, 3회 연장 가능', isRepresentative: true },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', grade: '15년, 3회 연장 가능' },
                    { name: '각인비', price: 14300, feeType: 'USAGE', grade: '15년 기준' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0788: 거제시추모의집
    // 이미지: 추모의집 사용료(유연유골) 관내거주자,15년,최초계약 300,000 / 추모의집 사용료(유연유골) 관외거주자(거제에연고있는자),15년,최초계약 1,000,000 / 추모의집 사용료(무연유골) 관내거주자,10년 200,000
    // ==========================================
    update('park-0788', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 (유연유골)', price: 300000, feeType: 'USAGE', grade: '15년, 최초 계약', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 (유연유골)', price: 1000000, feeType: 'USAGE', grade: '15년, 최초 계약, 거제 연고자', residency: 'NON_LOCAL' },
                    { name: '사용료 (무연유골)', price: 200000, feeType: 'USAGE', grade: '10년', residency: 'LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0789: 일월사추모공원(봉안당)
    // 이미지: A그룹 15년/관리비:3만원 1,000,000 / B그룹 15년/관리비:3만원 750,000 / C그룹 15년/관리비:3만원 500,000
    // ==========================================
    update('park-0789', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: 'A그룹', price: 1000000, feeType: 'USAGE', grade: '15년, 관리비 연 3만 별도', isRepresentative: true },
                    { name: 'B그룹', price: 750000, feeType: 'USAGE', grade: '15년, 관리비 연 3만 별도' },
                    { name: 'C그룹', price: 500000, feeType: 'USAGE', grade: '15년, 관리비 연 3만 별도' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '연' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0790: 천주교산내공원묘원 봉안담
    // 이미지: 사용료 영구사용 2,500,000 / 관리비 20년간 500,000
    // 현재: serviceType BURIAL → but 봉안담이므로 BONGSAN으로 변경
    // ==========================================
    update('park-0790', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담', unit: '원',
                rows: [
                    { name: '사용료', price: 2500000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true },
                    { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '20년간' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0791: (재)청구공원 봉안당
    // 이미지: 사용료 평당 500,000 / 관리비 평당 8,000
    // ==========================================
    update('park-0791', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 500000, feeType: 'USAGE', grade: '평당', isRepresentative: true },
                    { name: '관리비', price: 8000, feeType: 'MAINTENANCE', grade: '평당' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0792: 상락향 봉안탑
    // 이미지: 1인기사용료 30년 5,000,000 / 관리비 1년 50,000
    // 현재: serviceType OTHER → BONGSAN으로 변경
    // ==========================================
    update('park-0792', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안탑', unit: '원',
                rows: [
                    { name: '사용료', price: 5000000, feeType: 'USAGE', grade: '1인기, 30년', isRepresentative: true },
                    { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0793: 춘천안식공원(안식의집)
    // 이미지: 개인 사용료(24만원)+관리비(46,800원)+위패비(1만원) 311,800 / 부부 사용료(48만원)+관리비(84,200원)+위패비(1만원/1위당) 614,200
    // ==========================================
    update('park-0793', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '개인', price: 311800, feeType: 'USAGE', grade: '사용료 24만 + 관리비 46,800 + 위패비 1만', isRepresentative: true },
                    { name: '부부', price: 614200, feeType: 'USAGE', grade: '사용료 48만 + 관리비 84,200 + 위패비 1만/1위당' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0794: 인천가족공원 평온당
    // 이미지: 사용료(관내) 1기/30년 950,000 / 관리금(관내) 1기/30년 300,000
    // ==========================================
    update('park-0794', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 950000, feeType: 'USAGE', grade: '1기, 30년, 관내', residency: 'LOCAL', isRepresentative: true },
                    { name: '관리금', price: 300000, feeType: 'MAINTENANCE', grade: '1기, 30년, 관내', residency: 'LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0795: (재)신세계공원묘원 봉안묘·담
    // 이미지: 묘지사용료 평당가 550,000 / 관리비 평당기(년) 9,000
    // 봉안묘·담 = 야외 봉안시설이므로 serviceType BURIAL (가이드 #8)
    // ==========================================
    update('park-0795', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '봉안묘·담', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 550000, feeType: 'USAGE', grade: '평당', isRepresentative: true },
                    { name: '관리비', price: 9000, feeType: 'MAINTENANCE', grade: '평당/년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = [
        'park-0786', 'park-0787', 'park-0788', 'park-0789', 'park-0790',
        'park-0791', 'park-0792', 'park-0793', 'park-0794', 'park-0795'
    ];

    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('🔄', id, '→ Supabase 동기화 완료');
    }

    console.log('\n🎉 park-0786 ~ park-0795 완료!');
}

fix();
