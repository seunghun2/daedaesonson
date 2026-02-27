const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // ─── park-0151 성서공동묘지 ───
    // 이미지: 공설묘지 사용료 20,000 (1㎡당,30년(1회)15년 연장가능) / 관리비 160,000 (1기당,같은조건)
    //   합장묘 990,000 (1기당,30년)
    // 기존: USAGE feeType → 제거, 단장형/합장형 subType 정리
    {
        const p = data.find(d => d.id === 'park-0151');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장묘',
                rows: [
                    { name: '공설묘지 사용료', price: 20000, isRepresentative: true, note: '1㎡당, 사용기간: 30년 (1회 15년 연장 가능)' },
                    { name: '공설묘지 관리비', price: 160000, feeType: 'MAINTENANCE', note: '1기당' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장묘',
                rows: [
                    { name: '합장묘 사용료', price: 990000, note: '1기당, 사용기간: 30년' }
                ]
            }
        ];
        updated.push('park-0151');
    }

    // ─── park-0152 솔뫼공설묘지 ───
    // 이미지: 묘지 사용료 592,100 / 관리비 384,000 / 잔디값 49,600
    //   이용자격:당진시민 사용기간:15년 3회연장가능
    // EXTENSION → 제거, RESIDENT → LOCAL
    {
        const p = data.find(d => d.id === 'park-0152');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 592100, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 당진시민, 사용기간: 15년, 3회 연장 가능' },
                    { name: '묘지 관리비', price: 384000, feeType: 'MAINTENANCE' },
                    { name: '잔디값', price: 49600, note: '잔디 설치비' }
                ]
            }
        ];
        updated.push('park-0152');
    }

    // ─── park-0153 석문공설묘지 ───
    // 이미지: 묘지 사용료 591,200 / 잔디값 6,200 / 관리비 33,200
    //   이용자격:당진시민 사용기간:15년 3회연장가능
    // EXTENSION → 제거, RESIDENT → LOCAL
    {
        const p = data.find(d => d.id === 'park-0153');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 591200, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 당진시민, 사용기간: 15년, 3회 연장 가능' },
                    { name: '묘지 관리비', price: 33200, feeType: 'MAINTENANCE' },
                    { name: '잔디값', price: 6200, note: '잔디 설치비' }
                ]
            }
        ];
        updated.push('park-0153');
    }

    // ─── park-0154 천주교용인공원묘원 ───
    // 이미지: 사용료 600,000 (매장비 문의 031-334-0807)
    //   관리비(영구관리 묘지) 10,000 (3.3㎡(1평)/연간)
    //   관리비(기간제관리 묘지) 20,000 (3.3㎡(1평)/연간)
    // USAGE → 제거, grade → note
    {
        const p = data.find(d => d.id === 'park-0154');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료', price: 600000, isRepresentative: true, note: '매장비 별도 문의 (031-334-0807)' },
                    { name: '관리비 (영구관리 묘지)', price: 10000, feeType: 'MAINTENANCE', note: '3.3㎡(1평) 기준, 연간' },
                    { name: '관리비 (기간제관리 묘지)', price: 20000, feeType: 'MAINTENANCE', note: '3.3㎡(1평) 기준, 연간' }
                ]
            }
        ];
        updated.push('park-0154');
    }

    // ─── park-0155 꽃동네 낙원묘지 ───
    // 이미지: 꽃동네 가족 안장 비용 (빈칸) / 꽃동네 가족 관리 비용 0
    //   서비스: 평장비석 0 (45×30×10)
    // grade → note, 가격 0원 그대로
    {
        const p = data.find(d => d.id === 'park-0155');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '가족 안장 비용', price: 0, isRepresentative: true, note: '별도 문의 필요' },
                    { name: '가족 관리 비용', price: 0, feeType: 'MAINTENANCE', note: '연 관리비' },
                    { name: '평장비석', price: 0, feeType: 'STONE', note: '45×30×10 규격' }
                ]
            }
        ];
        updated.push('park-0155');
    }

    // ─── park-0156 낙원공원묘원 ───
    // 이미지: 묘지사용료 1,000,000 (평당가) → 현재 1,660,000?
    //   실제이미지: 묘지사용료 1,000,000 평당가 / 묘지관리비 16,000 평당가
    //   ** 현재 데이터 1,660,000은 이미지와 다름 → 이미지 기준 수정
    //   서비스: 분묘조성석재일체 4,950,000 (4각3단묘대,비석,상석,화병2,장문석)
    // USAGE → 제거, grade → note, 서비스항목 추가
    {
        const p = data.find(d => d.id === 'park-0156');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1000000, isRepresentative: true, note: '평당' },
                    { name: '묘지 관리비', price: 16000, feeType: 'MAINTENANCE', note: '평당' },
                    { name: '분묘 조성 석재 일체', price: 4950000, feeType: 'STONE', note: '4각3단묘대, 비석, 상석, 화병2, 장문석 포함' }
                ]
            }
        ];
        updated.push('park-0156');
    }

    // ─── park-0157 남해추모누리 공설종합묘원 ───
    // 이미지: 매장묘역 사용료 860,000 / 관리비 600,000 / 석물대 1,460,000
    //   사용자격:남해군민 사용기간:30년, 1회 연장가능
    // EXTENSION → 제거, RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0157');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘역 사용료', price: 860000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 남해군민, 사용기간: 30년, 1회 연장 가능' },
                    { name: '매장묘역 관리비', price: 600000, feeType: 'MAINTENANCE' },
                    { name: '매장묘역 석물대', price: 1460000, feeType: 'STONE', residency: 'LOCAL', note: '남해군민' }
                ]
            }
        ];
        updated.push('park-0157');
    }

    // ─── park-0158 정주동산 ───
    // 이미지: 매장(1기당) 1,200,000 / 납골(1기당) 600,000 / 관리비(년관리비) 40,000
    // USAGE → 제거, grade → note, BONGSAN → 봉안묘 subType
    {
        const p = data.find(d => d.id === 'park-0158');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장 사용료', price: 1200000, isRepresentative: true, note: '1기당' },
                    { name: '연 관리비', price: 40000, feeType: 'MAINTENANCE', note: '매년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '봉안묘',
                rows: [
                    { name: '납골 사용료', price: 600000, isRepresentative: true, note: '1기당' },
                    { name: '연 관리비', price: 40000, feeType: 'MAINTENANCE', note: '매년' }
                ]
            }
        ];
        updated.push('park-0158');
    }

    // ─── park-0159 대호지공설묘지 ───
    // 이미지: 묘지 사용료 693,600 / 관리비 351,200 / 잔디값 49,600
    //   이용자격:당진시민 사용기간:15년 3회연장가능
    // EXTENSION → 제거, RESIDENT → LOCAL
    {
        const p = data.find(d => d.id === 'park-0159');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 693600, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 당진시민, 사용기간: 15년, 3회 연장 가능' },
                    { name: '묘지 관리비', price: 351200, feeType: 'MAINTENANCE' },
                    { name: '잔디값', price: 49600, note: '잔디 설치비' }
                ]
            }
        ];
        updated.push('park-0159');
    }

    // ─── park-0160 영락공원묘지 ───
    // 이미지: 묘지 사용료 1,405,000 / 묘지 수수료 271,000 / 묘지 관리비 150,000
    //   이용자격: 사망일 30일전 광주광역시에 주소를 두고 거주한 자
    //   사용기간:15년, 10년단위 3회연장가능
    // EXTENSION → 제거, grade → note, 이용자격 note
    {
        const p = data.find(d => d.id === 'park-0160');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1405000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 사망일 30일전 광주광역시 거주자, 사용기간: 15년, 10년 단위 3회 연장 가능' },
                    { name: '묘지 수수료', price: 271000 },
                    { name: '묘지 관리비', price: 150000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0160');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        console.log(error ? `❌ ${id}: ${error.message}` : `✅ ${id} (${f.name})`);
    }
    console.log('\n✨ 151~160 수정 완료!');
}
fix();
