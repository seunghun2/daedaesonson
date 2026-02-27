const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // ─── park-0131 오산시공설공원묘지 ───
    // 이미지: 묘지사용료 45,000 (1기당 기준면적 6.6㎡/15년) / 묘지관리비 15,000 (동일)
    //         연장사용료 30,000 (기존사용료45,000 x 10년/15년) / 연장관리비 10,000 (기존관리비15,000 x 10년/15년)
    // 현재: EXTENSION feeType + grade 혼란 → 깔끔하게 정리
    {
        const p = data.find(d => d.id === 'park-0131');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 45000, isRepresentative: true, note: '1기당 기준면적 6.6㎡, 사용기간 15년' },
                    { name: '묘지 관리비', price: 15000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡, 사용기간 15년' },
                    { name: '연장 사용료', price: 30000, note: '연장기간 10년 (기존사용료 × 10/15)' },
                    { name: '연장 관리비', price: 10000, feeType: 'MAINTENANCE', note: '연장기간 10년 (기존관리비 × 10/15)' }
                ]
            }
        ];
        updated.push('park-0131');
    }

    // ─── park-0132 충효공원묘원 ───
    // 이미지: 묘지사용료 1,500,000 (3.3㎡) / 묘지관리비 15,000 (3.3㎡)
    //  + 서비스항목: 사용료 600,000 (평) / 관리비 15,000 (년/평)
    // 현재: grade "연관리비" → note로 이동, 서비스항목(평당) 추가
    {
        const p = data.find(d => d.id === 'park-0132');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1500000, isRepresentative: true, note: '3.3㎡ 기준' },
                    { name: '묘지 관리비', price: 15000, feeType: 'MAINTENANCE', note: '3.3㎡ 기준, 연 관리비' },
                    { name: '사용료 (평당)', price: 600000, note: '평당 기준' },
                    { name: '관리비 (평당)', price: 15000, feeType: 'MAINTENANCE', note: '평당, 연 관리비' }
                ]
            }
        ];
        updated.push('park-0132');
    }

    // ─── park-0133 횡성군공설추모공원(묘지) ───
    // 이미지: 묘지사용료 361,140 (합장기준) / 묘지사용료 0 (합장기준-수급자,국가유공자) / 묘지관리비 360,000 (합장기준) / 묘지관리비 0 (합장기준-수급자,국가유공자)
    // 현재: LOW_INCOME → VETERAN으로? 괄호 닫기 누락 → 정리
    {
        const p = data.find(d => d.id === 'park-0133');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 361140, isRepresentative: true, note: '합장 기준' },
                    { name: '묘지 사용료 (수급자·국가유공자)', price: 0, residency: 'VETERAN', note: '합장 기준, 수급자·국가유공자 면제' },
                    { name: '묘지 관리비', price: 360000, feeType: 'MAINTENANCE', note: '합장 기준' },
                    { name: '묘지 관리비 (수급자·국가유공자)', price: 0, feeType: 'MAINTENANCE', residency: 'VETERAN', note: '합장 기준, 수급자·국가유공자 면제' }
                ]
            }
        ];
        updated.push('park-0133');
    }

    // ─── park-0134 송탄공설묘지 ───
    // 이미지: 단장 사용료 451,000 (1기당 기준면적 10㎡/15년) / 관리비 199,000 / 합장 사용료 676,000 / 관리비 299,000
    // 현재: USAGE feeType 명시 → 제거(기본값), note 추가
    {
        const p = data.find(d => d.id === 'park-0134');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '공설묘지 사용료', price: 451000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 199000, feeType: 'MAINTENANCE' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '공설묘지 사용료', price: 676000, isRepresentative: true, note: '1기당 기준면적 10㎡, 사용기간 15년' },
                    { name: '공설묘지 관리비', price: 299000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0134');
    }

    // ─── park-0135 재단법인 아너스홈(구 대성공원묘원) ───
    // 이미지: 사용료(5평) 2,450,000 합장가능 평당490만원 / 사용료(6평) 2,940,000 합장가능 평당49만원(오타→490만)
    //         관리비(5평) 80,000 합장가능 평당16천원 / 관리비(6평) 96,000 합장가능 평당16천원
    // 현재: grade → note 이동, "평당 49만원" 오타 수정
    {
        const p = data.find(d => d.id === 'park-0135');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료 (5평)', price: 2450000, isRepresentative: true, note: '합장 가능, 평당 490,000원' },
                    { name: '사용료 (6평)', price: 2940000, note: '합장 가능, 평당 490,000원' },
                    { name: '관리비 (5평)', price: 80000, feeType: 'MAINTENANCE', note: '합장 가능, 평당 16,000원' },
                    { name: '관리비 (6평)', price: 96000, feeType: 'MAINTENANCE', note: '합장 가능, 평당 16,000원' }
                ]
            }
        ];
        updated.push('park-0135');
    }

    // ─── park-0136 인제종합장묘센터 하늘공원 ───
    // 이미지: 매장묘역(단장)(최초15년 연장10년) 관내 거주자에 한함
    //   단장: 3,000,000 / 합장: 4,500,000 (관내)
    //   단장: 750,000 / 합장: 1,125,000 (관외? → 관내 거주자에 한함이니 전부 LOCAL)
    // 실제: 위 2행이 관내, 아래 2행은 관외가 아니라 4행 모두 "관내 거주자에 한함"
    // → 근데 가격이 4배 차이... 상단 2행=관외(비거주자), 하단 2행=관내로 보는게 맞음
    // EXTENSION → 제거, RESIDENT → LOCAL / NON_LOCAL 구분
    {
        const p = data.find(d => d.id === 'park-0136');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형',
                rows: [
                    { name: '매장묘역 사용료', price: 750000, isRepresentative: true, residency: 'LOCAL', note: '관내 거주자, 최초 15년 연장 10년' },
                    { name: '매장묘역 사용료', price: 3000000, residency: 'NON_LOCAL', note: '관외, 최초 15년 연장 10년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형',
                rows: [
                    { name: '매장묘역 사용료', price: 1125000, isRepresentative: true, residency: 'LOCAL', note: '관내 거주자, 최초 15년 연장 10년' },
                    { name: '매장묘역 사용료', price: 4500000, residency: 'NON_LOCAL', note: '관외, 최초 15년 연장 10년' }
                ]
            }
        ];
        updated.push('park-0136');
    }

    // ─── park-0137 대청리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년 / 단장 60,000/30,000 / 합장 90,000/45,000
    // RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0137');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0137');
    }

    // ─── park-0138 가톨릭군위묘원 ───
    // 이미지: 사용료 3,500,000 (사용기간30년) / 관리비 1,000,000 (30년분) / 용역비 기타 1,100,000
    //  + 서비스항목: 세라믹 영정 200,000 (세라믹 소재 영정 사진 제작,부착)
    // 현재: 사용료 2,000,000 → 3,500,000 수정! 용역비 900,000 → 1,100,000 수정!
    {
        const p = data.find(d => d.id === 'park-0138');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료', price: 3500000, isRepresentative: true, note: '사용기간 30년' },
                    { name: '관리비', price: 1000000, feeType: 'MAINTENANCE', note: '30년분' },
                    { name: '용역비 기타', price: 1100000, note: '기타 용역비' },
                    { name: '세라믹 영정', price: 200000, note: '세라믹 소재 영정 사진 제작·부착' }
                ]
            }
        ];
        updated.push('park-0138');
    }

    // ─── park-0139 (재)영락교회공원묘원 ───
    // 이미지: 장례비 1,050,000 (신장,합장) / 신장 관리비(일시납) 1,500,000 (신장-단장,합예) / 합장 관리비(일시납) 750,000 (기존묘에 합장시) / 년 관리비 50,000 (묘지당)
    // 현재: grade → note, 구조 OK
    {
        const p = data.find(d => d.id === 'park-0139');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '장례비', price: 1050000, isRepresentative: true, note: '신장·합장 공통' },
                    { name: '신장 관리비 (일시납)', price: 1500000, feeType: 'MAINTENANCE', note: '신장(단장·합예) 기준' },
                    { name: '합장 관리비 (일시납)', price: 750000, feeType: 'MAINTENANCE', note: '기존묘에 합장 시' },
                    { name: '연 관리비', price: 50000, feeType: 'MAINTENANCE', note: '묘지당, 매년' }
                ]
            }
        ];
        updated.push('park-0139');
    }

    // ─── park-0140 진촌리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년 / 단장 60,000/30,000 / 합장 90,000/45,000
    // RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0140');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0140');
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
    console.log('\n✨ 131~140 수정 완료!');
}
fix();
