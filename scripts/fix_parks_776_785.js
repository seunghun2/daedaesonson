/**
 * park-0776 ~ park-0785 가격 데이터 정제
 * 
 * 이미지 대조 결과:
 * 776. 순천시립추모공원 제1·2봉안당 - 공설, 개인 관내(15년3회연장가능) 18만 / 관외 60만 / 유공자,수급자 면제 → residency 추가, grade 보강
 * 777. 청양군추모공원(봉안당) - 공설, 사용료 최초신청시 30년 10만 / 관리비 최초신청시 30년 10만 / 유공자,수급자 전액감면 → OK, grade에 30년 추가
 * 778. 지장정사 연화대 - 사설, 봉안당 안치료 1기당 55만 / 관리비(1년) 1만 / 장사용품: 유골함(도자기) 7만 → 유골함 누락
 * 779. 서귀포추모공원 - 공설, 최초신청시 15년(도내) 5만 / (도외) 10만 / 유공자,수급자 전액감면 → residency 추가, grade 보강
 * 780. (재)자하연분당 - 사설, 매장묘,봉안묘 사용료/㎡ 1,007,479 / 371번지 신규조성 1,641,528 / 연간 관리비/㎡ 7,563 / 미사용묘지반환규정 → serviceType을 BURIAL로
 * 781. 광주영락공원 제2추모관 - 공설, 관내 32만(사용료28만+관리비4만, 15년단위 최장45년), 전남도 64만, 관외 94만 → feeType USAGE로, residency LOCAL/NON_LOCAL
 * 782. 존제산 일월사 설법전 - 사설, 사용료 개인단 500만, 관리비 개인단(영구) 50만 / 장사용품: 연화밀봉봉안함 40만 → grade 추가, 봉안함 누락
 * 783. (재)영호추모공원 - 사설, 봉안료(유연) 개인 15년/1위당 연관리비별도 80만, 부부 160만, 봉안료(무연) 10년/1위당 20만 → grade 보강
 * 784. 광주영락공원 제1추모관 - 공설, 관내 32만(사용료28만+관리비4만, 15년단위 최장45년), 전남도 64만, 관외 94만 → residency LOCAL/NON_LOCAL, grade 보강
 * 785. 창녕추모공원 - 공설, 개인실 (관내기준) 15년 1실1기당 15만 / 부부실 1실2기당 30만 / 무연고 5년 1실1기당 10만 → grade 보강
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
    // park-0776: 순천시립추모공원 제1·2봉안당
    // 이미지: 개인 관내(15년 3회 연장 가능) 180,000 / 개인 관외(15년 3회 연장 가능) 600,000 / 국가유공자,국민기초생활수급자 면제(연장시 사용료 납부) 0
    // 현재: residency 없음, grade 없음
    // ==========================================
    update('park-0776', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 (개인)', price: 180000, feeType: 'USAGE', grade: '15년, 3회 연장 가능', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 (개인)', price: 600000, feeType: 'USAGE', grade: '15년, 3회 연장 가능', residency: 'NON_LOCAL' },
                    { name: '유공자/수급자', price: 0, feeType: 'USAGE', grade: '면제, 연장 시 사용료 납부' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0777: 청양군추모공원(봉안당)
    // 이미지: 사용료 최초신청시 30년 사용료 100,000 / 관리비 최초신청시 30년 관리비 100,000 / 사용료및관리비 유공자,수급자 전액감면 0
    // 현재: ★ → grade에 30년 정보 보강 필요
    // ==========================================
    update('park-0777', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', grade: '최초 신청 시 30년', isRepresentative: true },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', grade: '최초 신청 시 30년' },
                    { name: '사용료 및 관리비 (유공자/수급자)', price: 0, feeType: 'USAGE', grade: '전액 감면' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0778: 지장정사 연화대
    // 이미지: 봉안당 안치료 1기당 550,000 / 관리비(1년) 관리비 10,000 / 장사용품: 유골함(도자기) 70,000
    // 현재: OK지만 유골함 누락, grade 없음
    // ==========================================
    update('park-0778', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '안치료', price: 550000, feeType: 'USAGE', grade: '1기당', isRepresentative: true },
                    { name: '관리비', price: 10000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '장례용품', unit: '원',
                rows: [
                    { name: '유골함 (도자기)', price: 70000, feeType: 'USAGE' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0779: 서귀포추모공원
    // 이미지: 사용료 최초신청시 15년(도내) 50,000 / 최초신청시 15년(도외) 100,000 / 국가유공자,기초생활수급자(전액감면) 0
    // 현재: residency 없음, grade 없음
    // ==========================================
    update('park-0779', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 50000, feeType: 'USAGE', grade: '최초 신청 시 15년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료', price: 100000, feeType: 'USAGE', grade: '최초 신청 시 15년', residency: 'NON_LOCAL' },
                    { name: '유공자/수급자', price: 0, feeType: 'USAGE', grade: '전액 감면' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0780: (재)자하연분당(묘지)
    // 이미지: 매장묘,봉안묘 사용료/㎡ 1,007,479 / 371번지 신규조성 봉안묘 단지 사용료/㎡ 1,641,528 / 매장묘,봉안묘 연간 관리비/㎡ 7,563 / 미사용묘지반환규정(환불규정)
    // 현재: FAMILY_GRAVE → BURIAL로 변경, 야외 봉안묘는 BURIAL 탭에 포함(가이드 #8)
    // ==========================================
    update('park-0780', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘/봉안묘', unit: '원',
                rows: [
                    { name: '사용료', price: 1007479, feeType: 'USAGE', grade: '㎡당', isRepresentative: true },
                    { name: '371번지 신규조성 봉안묘 단지 사용료', price: 1641528, feeType: 'USAGE', grade: '㎡당' },
                    { name: '연간 관리비', price: 7563, feeType: 'MAINTENANCE', grade: '㎡당' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0781: 광주영락공원 제2추모관
    // 이미지: 관내 사용료:28만원, 관리비:4만원 (15년단위, 최장 45년 사용) 320,000 / 전라남도 사용료:60만원, 관리비:4만원 640,000 / 관외 사용료:90만원, 관리비:4만원 940,000
    // 현재: feeType이 MAINTENANCE로 잘못됨, residency RESIDENT→ LOCAL
    // ==========================================
    update('park-0781', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 + 관리비', price: 320000, feeType: 'USAGE', grade: '사용료 28만 + 관리비 4만, 15년 단위 최장 45년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 + 관리비 (전라남도)', price: 640000, feeType: 'USAGE', grade: '사용료 60만 + 관리비 4만, 15년 단위 최장 45년' },
                    { name: '사용료 + 관리비 (관외)', price: 940000, feeType: 'USAGE', grade: '사용료 90만 + 관리비 4만, 15년 단위 최장 45년', residency: 'NON_LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0782: 존제산 일월사 설법전
    // 이미지: 사용료 개인단 5,000,000 / 관리비 개인단(영구) 500,000 / 장사용품: 연화밀봉봉안함 (w)x(h) 20cm x 20cm 400,000
    // 현재: OK지만 봉안함 누락, grade 없음
    // ==========================================
    update('park-0782', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료', price: 5000000, feeType: 'USAGE', grade: '개인단', isRepresentative: true },
                    { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '개인단 (영구)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '장례용품', unit: '원',
                rows: [
                    { name: '연화 밀봉 봉안함', price: 400000, feeType: 'USAGE', grade: '20cm × 20cm, 연화 봉우리형 용기/크리스탈+ABS수지/국내산' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0783: (재)영호추모공원
    // 이미지: 봉안료(유연) 개인 15년/1위당. 년관리비별도 800,000 / 부부 15년/1위당 년관리비별도 1,600,000 / 봉안료(무연) 10년/1위당 200,000
    // 현재: grade 없음
    // ==========================================
    update('park-0783', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '봉안료 (유연, 개인)', price: 800000, feeType: 'USAGE', grade: '15년/1위당, 연 관리비 별도', isRepresentative: true },
                    { name: '봉안료 (유연, 부부)', price: 1600000, feeType: 'USAGE', grade: '15년/1위당, 연 관리비 별도' },
                    { name: '봉안료 (무연)', price: 200000, feeType: 'USAGE', grade: '10년/1위당' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0784: 광주영락공원 제1추모관
    // 이미지: 관내 사용료:28만원, 관리비:4만원 (15년단위, 최장45년), 관내기준: 사망일 30일전 광주광역시에 주소를 두고 거주한 자 320,000 / 전라남도 60만+4만 640,000 / 관외 90만+4만 940,000
    // 현재: 가격 OK, residency RESIDENT→LOCAL, grade 보강 필요
    // ==========================================
    update('park-0784', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '사용료 + 관리비', price: 320000, feeType: 'USAGE', grade: '사용료 28만 + 관리비 4만, 15년 단위 최장 45년', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 + 관리비 (전라남도)', price: 640000, feeType: 'USAGE', grade: '사용료 60만 + 관리비 4만, 15년 단위 최장 45년' },
                    { name: '사용료 + 관리비 (관외)', price: 940000, feeType: 'USAGE', grade: '사용료 90만 + 관리비 4만, 15년 단위 최장 45년', residency: 'NON_LOCAL' },
                ]
            }
        ];
    });

    // ==========================================
    // park-0785: 창녕추모공원
    // 이미지: 개인실 (관내기준) 15년, 1실 1기 당 150,000 / 부부실 (관내기준) 15년, 1실 2기 당 300,000 / 무연고 (관내기준) 5년, 1실 1기 당 100,000
    // 현재: grade 없음, 유공자 residency VETERAN 75,000 → 이미지에 없지만 기존 데이터 유지
    // ==========================================
    update('park-0785', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '개인실', price: 150000, feeType: 'USAGE', grade: '관내 기준, 15년, 1실 1기당', isRepresentative: true },
                    { name: '부부실', price: 300000, feeType: 'USAGE', grade: '관내 기준, 15년, 1실 2기당' },
                    { name: '무연고', price: 100000, feeType: 'USAGE', grade: '관내 기준, 5년, 1실 1기당' },
                    { name: '사용료 (유공자)', price: 75000, feeType: 'USAGE', grade: '50% 감면', residency: 'VETERAN' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = [
        'park-0776', 'park-0777', 'park-0778', 'park-0779', 'park-0780',
        'park-0781', 'park-0782', 'park-0783', 'park-0784', 'park-0785'
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

    console.log('\n🎉 park-0776 ~ park-0785 완료!');
}

fix();
