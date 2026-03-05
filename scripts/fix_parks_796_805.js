/**
 * park-0796 ~ park-0805 가격 데이터 정제
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
    // park-0796: 가조공설공원묘지 봉안당
    // 이미지: 사용료 15년간 100,000 / 관리비 15년간 100,000
    // 수정: grade에 15년간 추가
    // ==========================================
    update('park-0796', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', grade: '15년간', isRepresentative: true },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', grade: '15년간' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0797: 성북구추모의집
    // 이미지: 15년 → 15년 사용료+관리비 800,000 / 5년 연장시(3회 연장 가능) → 5년 사용료+관리비 270,000
    // 수정: EXTENSION→USAGE, grade 보강
    // ==========================================
    update('park-0797', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료+관리비 (15년)', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', isRepresentative: true },
                    { name: '연장료 (5년)', price: 270000, feeType: 'USAGE', grade: '5년 연장, 3회 가능, 사용료+관리비 포함' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0798: 경남영묘원
    // 이미지: 폐쇄형(옥판) 1,000,000원부터 4,000,000원 → 1,000,000 / 개방형(유리) 1,000,000원부터 7,000,000원 → 1,000,000
    // e하늘 데이터에서 요금 열에 최저가가 표시됨, 사용료내역에 범위 표시
    // 현재 데이터: 폐쇄형 100만/200만(개인/부부?), 개방형 150만/300만(개인/부부?)
    // 이미지에서는 개인/부부 구분 없이 폐쇄형(옥판) 100~400만, 개방형(유리) 100~700만
    // ==========================================
    update('park-0798', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '폐쇄형 (옥판)', price: 1000000, feeType: 'USAGE', grade: '100만~400만원', isRepresentative: true },
                    { name: '개방형 (유리)', price: 1000000, feeType: 'USAGE', grade: '100만~700만원' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0799: 진주안락공원 추모당
    // 이미지: 사용료및관리비 최초 신청시 15년(관내) 200,000 / 사용료및관리비 최초 신청시 15년(관외) 1,000,000
    // 수정: feeType MAINTENANCE→USAGE, residency 추가, grade 보강
    // ==========================================
    update('park-0799', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료+관리비', price: 200000, feeType: 'USAGE', grade: '최초 신청, 15년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료+관리비', price: 1000000, feeType: 'USAGE', grade: '최초 신청, 15년', residency: 'NON_LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0800: 예은추모공원
    // 이미지: 봉안당 사용료 영구 사용 요금 일반단 2,500,000 / 봉안당 사용료(로얄단) 영구 사용 요금 3,000,000
    // 수정: grade에 영구 사용 추가
    // ==========================================
    update('park-0800', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '일반단', price: 2500000, feeType: 'USAGE', grade: '영구 사용', isRepresentative: true },
                    { name: '로얄단', price: 3000000, feeType: 'USAGE', grade: '영구 사용' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0801: (재)조양공원 봉안당
    // 이미지: 사용료 평당 550,000 / 관리비 평당 8,000
    // 수정: grade에 평당 추가
    // ==========================================
    update('park-0801', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 550000, feeType: 'USAGE', grade: '평당', isRepresentative: true },
                    { name: '관리비', price: 8000, feeType: 'MAINTENANCE', grade: '평당' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0802: 이담추모관
    // 이미지: 개인단 1단~9단(사용료:330만원, 관리비:5년 25만원) 3,550,000 / 부부단 1단~9단(사용료:660만원, 관리비:5년 25만원) 6,250,000 (계산하면 660+? 아님)
    // 실제 이미지: 개인단 3,550,000(사용료330만+관리비25만(5년)) / 부부단 6,250,000(사용료600만+관리비25만(5년))
    // 수정: feeType 정리, 개인/부부 분리
    // ==========================================
    update('park-0802', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '개인단 (1단~9단)', price: 3550000, feeType: 'USAGE', grade: '사용료 330만 + 관리비 25만(5년) 포함', isRepresentative: true },
                    { name: '부부단 (1단~9단)', price: 6250000, feeType: 'USAGE', grade: '사용료 600만 + 관리비 25만(5년) 포함' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0803: 청주백화추모관
    // 이미지: 개인단 1단~9단(180~450만원) / 60년(영구) 1,800,000 / 부부단 1단~8단(360~900만원) / 60년(영구) 3,600,000
    // 수정: grade 정리
    // ==========================================
    update('park-0803', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '개인단 (1단~9단)', price: 1800000, feeType: 'USAGE', grade: '180만~450만원, 60년(영구)', isRepresentative: true },
                    { name: '부부단 (1단~8단)', price: 3600000, feeType: 'USAGE', grade: '360만~900만원, 60년(영구)' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0804: 성림사 연화납골당(봉안당)
    // 이미지: 납골당 2,000,000 / 납골당 3,000,000 (사용료내역 없음)
    // 개인/부부 구분 불명확, 가격만 다름 → 200만이 저렴하므로 일반형, 300만이 상위형으로 추정
    // ==========================================
    update('park-0804', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '납골당', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '납골당 (상위)', price: 3000000, feeType: 'USAGE' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0805: 종로구추모의집
    // 이미지: 관내 15년 사용 15년사용료+관리비 800,000 / 관외 15년 사용 15년 사용료+관리비 800,000
    // 수정: RESIDENT→LOCAL, grade 보강
    // 관내/관외 가격 동일하지만 배지 표시를 위해 분리 유지
    // ==========================================
    update('park-0805', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료+관리비 (15년)', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료+관리비 (15년)', price: 800000, feeType: 'USAGE', grade: '15년, 사용료+관리비 포함', residency: 'NON_LOCAL' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = [
        'park-0796', 'park-0797', 'park-0798', 'park-0799', 'park-0800',
        'park-0801', 'park-0802', 'park-0803', 'park-0804', 'park-0805'
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

    console.log('\n🎉 park-0796 ~ park-0805 완료!');
}

fix();
