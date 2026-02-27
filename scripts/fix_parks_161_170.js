const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // === park-0161 해방교회공원묘원 ===
    // 이미지: 묘지사용료 3평(단독장) 900,000 / 4평(합장) 1,200,000 / 관리비 15년간(연24만2천원) 600,000
    // 현재: 관리비만 있고 사용료 누락
    update('park-0161', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료 (단독장)', price: 900000, feeType: 'USAGE', grade: '3평', isRepresentative: true },
                    { name: '묘지 사용료 (합장)', price: 1200000, feeType: 'USAGE', grade: '4평' },
                    { name: '관리비', price: 600000, feeType: 'MAINTENANCE', grade: '15년간 (연 242,000원)' },
                ]
            }
        ];
    });

    // === park-0162 동명가족묘지 ===
    // 이미지: 사용료 20,000 (1㎡당, 30년, 1회15년 연장가능) / 관리비 160,000 (1기당, 30년, 1회15년 연장가능) / 합장묘 990,000 (1기당, 30년)
    update('park-0162', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 20000, feeType: 'USAGE', grade: '1㎡당, 사용기간: 30년 (1회 15년 연장 가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 160000, feeType: 'MAINTENANCE', grade: '1기당, 사용기간: 30년 (1회 15년 연장 가능)' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장묘', unit: '원',
                rows: [
                    { name: '합장묘 사용료', price: 990000, feeType: 'USAGE', grade: '1기당, 사용기간: 30년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 240000, feeType: 'MAINTENANCE', grade: '1기당, 사용기간: 30년 (1회 15년 연장 가능)' },
                ]
            }
        ];
    });

    // === park-0163 동명공동묘지 ===
    // 162와 동일 데이터, EXTENSION→제거, grade 괄호 오류 수정
    update('park-0163', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 20000, feeType: 'USAGE', grade: '1㎡당, 사용기간: 30년 (1회 15년 연장 가능)', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 160000, feeType: 'MAINTENANCE', grade: '1기당, 사용기간: 30년 (1회 15년 연장 가능)' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장묘', unit: '원',
                rows: [
                    { name: '합장묘 사용료', price: 990000, feeType: 'USAGE', grade: '1기당, 사용기간: 30년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 240000, feeType: 'MAINTENANCE', grade: '1기당, 사용기간: 30년 (1회 15년 연장 가능)' },
                ]
            }
        ];
    });

    // === park-0164 양평군공설공원묘지 ===
    // 이미지: 사용료 295,000 (1기당 기준면적 6.6㎡) / 관리비 150,000 (1기당 6.6㎡) / 연장관리비 10,000 (1년)
    update('park-0164', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 295000, feeType: 'USAGE', grade: '1기당, 기준면적 6.6㎡', isRepresentative: true },
                    { name: '묘지 관리비', price: 150000, feeType: 'MAINTENANCE', grade: '1기당, 기준면적 6.6㎡' },
                    { name: '연장 관리비', price: 10000, feeType: 'MAINTENANCE', grade: '1년 기준' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 442500, feeType: 'USAGE', grade: '1기당, 기준면적 6.6㎡', isRepresentative: true },
                    { name: '묘지 관리비', price: 225000, feeType: 'MAINTENANCE', grade: '1기당, 기준면적 6.6㎡' },
                    { name: '연장 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '1년 기준' },
                ]
            }
        ];
    });

    // === park-0165 순천시립공원묘지 ===
    // 이미지: 관내 515,000 / 관외 800,000, 15년씩 3회 연장 가능
    // EXTENSION→제거, RESIDENT→LOCAL/NON_LOCAL, grade 단축
    update('park-0165', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '매장 사용료 (관내)', price: 515000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간: 15년 (3회 연장 가능)', isRepresentative: true },
                    { name: '매장 사용료 (관외)', price: 800000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간: 15년 (3회 연장 가능)' },
                ]
            }
        ];
    });

    // === park-0166 용미리제1묘지 ===
    // 이미지: 1991.5 만장(1998.8 매장 중단), 조성/비조성(관리비 없음) 가격 0
    //         조성분묘 관리비 27,500 (매5년마다, 1㎡당)
    update('park-0166', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '조성분묘 관리비', price: 27500, feeType: 'MAINTENANCE', grade: '1㎡당, 매 5년마다', isRepresentative: true },
                ]
            }
        ];
    });

    // === park-0167 용미리제2묘지 ===
    // 이미지: 1993.12 만장(1998.8 매장 중단), 조성묘지 가격 0
    //         조성분묘 관리비 27,500 (매5년마다, 1㎡당)
    update('park-0167', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '조성분묘 관리비', price: 27500, feeType: 'MAINTENANCE', grade: '1㎡당, 매 5년마다', isRepresentative: true },
                ]
            }
        ];
    });

    // === park-0168 장화리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000, 이용자격: 강화군민, 15년
    // RESIDENT→LOCAL
    update('park-0168', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // === park-0169 운경공원묘원 ===
    // 이미지: 사용료 1,512,400 (평당) / 관리비 15,000 (평당)
    update('park-0169', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 1512400, feeType: 'USAGE', grade: '평당', isRepresentative: true },
                    { name: '관리비', price: 15000, feeType: 'MAINTENANCE', grade: '연간, 평당' },
                ]
            }
        ];
    });

    // === park-0170 장정리공설묘지 ===
    // 이미지: 사용료 15,000 / 관리비 15,000, 이용자격: 강화군민, 15년
    // RESIDENT→LOCAL
    update('park-0170', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 강화군민, 사용기간: 15년', isRepresentative: true },
                    { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '이용자격: 강화군민, 사용기간: 15년' },
                ]
            }
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // Supabase 동기화
    const ids = ['park-0161', 'park-0162', 'park-0163', 'park-0164', 'park-0165', 'park-0166', 'park-0167', 'park-0168', 'park-0169', 'park-0170'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ 161~170 수정 완료!');
}
fix();
