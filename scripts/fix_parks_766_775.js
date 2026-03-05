/**
 * park-0766 ~ park-0775 가격 데이터 정제
 * 
 * 이미지 분석 결과:
 * 766. 재단법인 미륵불교 봉안당 - 사용료 0원, 관리비 0원, 기타(명절합동제사비용) 10만원 → 사용료+관리비+기타 정리
 * 767. 덕원사 추모관 - 가격 정보 없음 (빈 테이블) → 문의로 설정
 * 768. 풍주선원 봉안탑 - 봉안 10년 100만, 잔디장(수목장) 30년 350만, 가족영탑12기(영구) 3000만 → serviceType 수정
 * 769. 쌍용사 봉안탑 - 봉안탑 소/중/대 650만/750만/1000만 → serviceType BONGSAN으로
 * 770. 고성군공설봉안당 - 관내 15년 10만, 관외 300만 한정(본적이 고성), 수급자 무료 → residency 정리
 * 771. 고창군추모의집 - 사용료+관리비 10만, 추가 5만(명찰/꽃/액자), 10년 연장 10만 → feeType 정리
 * 772. 통영시공설봉안당 - 관내 15년 사용료+관리비 20만, 관내 기초수급자 무료, 무연유골 13만 → residency 추가
 * 773. 동탄납골추모관 - 봉안증서 400만, 봉안제사 49만, 진공함 50만 → 정리
 * 774. 대한불교조계종 신흥사 - 봉안당(일반)영구 350만/1단, 봉안당(일반)30년 200만/1단, 관리비 1년 6만 → 정리
 * 775. 선약사 - 1층2층 500만, 3층4층5층6층 650만, 7층8층 350만 → 층별 분리
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieWRtaGZ1cW5wdWtmdXR2cmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYyMjIzOCwiZXhwIjoyMDUxMTk4MjM4fQ.I_M6gJr_TuPabSebEkS8V7F85Mmzlqhx2cI0foFYnkU';

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
    // park-0766: 재단법인 미륵불교 봉안당
    // 이미지: 사용료(300mm×100mm×165mm) 0원, 관리비(300mm×100mm×165mm) 0원, 기타(명절 합동제사비용) 100,000원
    // 현재: groupType '기타'에 10만원만 있음. 사용료/관리비 누락
    // ==========================================
    update('park-0766', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안 사용료', price: 0, feeType: 'USAGE', grade: '300mm×100mm×165mm', isRepresentative: true },
                    { name: '관리비', price: 0, feeType: 'MAINTENANCE', grade: '300mm×100mm×165mm' },
                    { name: '명절 합동제사 비용', price: 100000, feeType: 'USAGE', grade: '기타' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0767: 덕원사 추모관
    // 이미지: 시설사용료/서비스/장사용품 모두 빈 테이블 → 가격 없음, 문의 필요
    // 현재: 사용료 0원
    // ==========================================
    update('park-0767', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안 사용료', price: null, feeType: 'USAGE', grade: '전화 문의', isRepresentative: true },
                ]
            }
        ];
    });

    // ==========================================
    // park-0768: 풍주선원 봉안탑
    // 이미지: 봉안 10년 1,000,000 / 잔디장(수목장) 30년 3,500,000 / 가족영탑12기(영구) 30,000,000
    // 현재: serviceType이 BURIAL(합장형/평장묘)로 잘못됨. 봉안→BONGSAN, 잔디장→NATURAL
    // ==========================================
    update('park-0768', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안탑', unit: '원',
                rows: [
                    { name: '봉안', price: 1000000, feeType: 'USAGE', grade: '10년', isRepresentative: true },
                    { name: '가족영탑 (12기)', price: 30000000, feeType: 'USAGE', grade: '영구' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '잔디장(수목장)', unit: '원',
                rows: [
                    { name: '잔디장(수목장)', price: 3500000, feeType: 'USAGE', grade: '30년', isRepresentative: true },
                ]
            }
        ];
    });

    // ==========================================
    // park-0769: 쌍용사 봉안탑
    // 이미지: 봉안탑 소 6,500,000 / 중 7,500,000 / 대 10,000,000
    // 현재: serviceType OTHER → BONGSAN으로 변경
    // ==========================================
    update('park-0769', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안탑', unit: '원',
                rows: [
                    { name: '봉안탑 (소)', price: 6500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '봉안탑 (중)', price: 7500000, feeType: 'USAGE' },
                    { name: '봉안탑 (대)', price: 10000000, feeType: 'USAGE' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0770: 고성군공설봉안당
    // 이미지: 사용료 최초신청시15년(관내) 100,000 / 최초신청시15년(관외-본적이 고성에 한하여 봉안 가능) 300,000 / 수급자 0
    // 현재: groupType [관내]/[관외]로만 구분, residency 없음
    // ==========================================
    update('park-0770', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', grade: '최초 신청시 15년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료', price: 300000, feeType: 'USAGE', grade: '최초 신청시 15년, 본적이 고성에 한하여 봉안 가능', residency: 'NON_LOCAL' },
                    { name: '사용료 (기초수급자)', price: 0, feeType: 'USAGE', grade: '무료', residency: 'LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0771: 고창군추모의집
    // 이미지: 봉안당 사용료 및 관리비 = 봉안당 1기 사용(10년) 100,000 / 처음 봉안할때 추가비용 = 명찰,꽃,액자 포함 50,000 / 10년 마다 5회연장 가능 = 연장시 10만원
    // 현재: 1기 사용료+관리비가 MAINTENANCE, 추가비용이 USAGE → 반대로 되어야
    // ==========================================
    update('park-0771', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안당 사용료 및 관리비', price: 100000, feeType: 'USAGE', grade: '1기 사용 (10년)', isRepresentative: true },
                    { name: '처음 봉안 시 추가비용', price: 50000, feeType: 'USAGE', grade: '명찰, 꽃, 액자 포함' },
                    { name: '연장 (10년마다)', price: 100000, feeType: 'MAINTENANCE', grade: '5회 연장 가능' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0772: 통영시공설봉안당
    // 이미지: 봉안사용료 및 관리비 최초 신청 15년(관내) 200,000 / 최초 신청 15년(관내 기초수급자) 0 / 무연 유골 10년(관내) 130,000
    // 현재: MAINTENANCE feeType, residency 없음
    // ==========================================
    update('park-0772', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 및 관리비', price: 200000, feeType: 'USAGE', grade: '최초 신청 15년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 및 관리비 (기초수급자)', price: 0, feeType: 'USAGE', grade: '최초 신청 15년', residency: 'LOCAL' },
                    { name: '무연 유골', price: 130000, feeType: 'USAGE', grade: '10년', residency: 'LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0773: 동탄납골추모관
    // 이미지: 시설사용료 - 봉안증서 4,000,000 / 서비스 - 봉안제사 490,000 / 장사용품 - 진공함 500,000
    // 현재: 매장묘(BURIAL) 400만 잘못 분류, 옵션(OTHER) 진공함 잘못 분류
    // ==========================================
    update('park-0773', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안증서', price: 4000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '봉안제사', price: 490000, feeType: 'USAGE', grade: '서비스 항목' },
                    { name: '진공함', price: 500000, feeType: 'USAGE', grade: '장사용품' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0774: 대한불교조계종 신흥사
    // 이미지: 봉안당(일반)영구 1단 3,500,000 / 봉안당(일반) 30년 1단 2,000,000 / 관리비 1년 60,000
    // 현재: OK지만 groupType [영구]/[30년] 대신 grade에 정리
    // ==========================================
    update('park-0774', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안당 (영구)', price: 3500000, feeType: 'USAGE', grade: '1단', isRepresentative: true },
                    { name: '봉안당 (30년)', price: 2000000, feeType: 'USAGE', grade: '1단' },
                    { name: '관리비', price: 60000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0775: 선약사
    // 이미지: 1층,2층 5,000,000 / 3층,4층,5층,6층 6,500,000 / 7층,8층 3,500,000
    // 현재: groupType [2층]/[4층]/[8층]로 어색, 복합층 쪼개기 필요
    // ==========================================
    update('park-0775', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '1층', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2층', price: 5000000, feeType: 'USAGE' },
                    { name: '3층', price: 6500000, feeType: 'USAGE' },
                    { name: '4층', price: 6500000, feeType: 'USAGE' },
                    { name: '5층', price: 6500000, feeType: 'USAGE' },
                    { name: '6층', price: 6500000, feeType: 'USAGE' },
                    { name: '7층', price: 3500000, feeType: 'USAGE' },
                    { name: '8층', price: 3500000, feeType: 'USAGE' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = [
        'park-0766', 'park-0767', 'park-0768', 'park-0769', 'park-0770',
        'park-0771', 'park-0772', 'park-0773', 'park-0774', 'park-0775'
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

    console.log('\n🎉 park-0766 ~ park-0775 완료!');
}

fix();
