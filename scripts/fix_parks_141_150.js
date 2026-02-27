const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // ─── park-0141 현수리공원묘지 ───
    // 이미지: 단장 사용료 10,800 / 관리비 19,200 / 합장 사용료 16,200 / 관리비 28,800
    //  이용자격:여주시민, 15년
    // RESIDENT → LOCAL, USAGE feeType 제거, grade → note
    {
        const p = data.find(d => d.id === 'park-0141');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설공동묘지 사용료 (단장)', price: 10800, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 여주시민, 사용기간: 15년' },
                    { name: '공설공동묘지 관리비 (단장)', price: 19200, feeType: 'MAINTENANCE', isRepresentative: true },
                    { name: '공설공동묘지 사용료 (합장)', price: 16200, residency: 'LOCAL', note: '이용자격: 여주시민, 사용기간: 15년' },
                    { name: '공설공동묘지 관리비 (합장)', price: 28800, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0141');
    }

    // ─── park-0142 연평리공설묘지 ───
    // 이미지: 이용자격:옹진군민, 사용기간:15년 / 단장 60,000/30,000 / 합장 90,000/45,000
    // USAGE feeType 제거, residency 추가(LOCAL)
    {
        const p = data.find(d => d.id === 'park-0142');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '공설묘지 사용료 (단장)', price: 60000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (단장)', price: 30000, feeType: 'MAINTENANCE' },
                    { name: '공설묘지 사용료 (합장)', price: 90000, residency: 'LOCAL', note: '이용자격: 옹진군민, 사용기간: 15년' },
                    { name: '공설묘지 관리비 (합장)', price: 45000, feeType: 'MAINTENANCE' }
                ]
            }
        ];
        updated.push('park-0142');
    }

    // ─── park-0143 강릉공원묘원(묘지) ───
    // 이미지: 묘지 24,975 (1평) / 묘지 1,000,000 (1평-지구별로 상이할 수 있음)
    //   선납관리비 미도래부분은 해당년도 인상된 가격으로 재 정산 → 0 (가격 없음)
    // USAGE feeType 제거, grade "연관리비" → note
    {
        const p = data.find(d => d.id === 'park-0143');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1000000, isRepresentative: true, note: '1평 기준, 지구별로 상이할 수 있음' },
                    { name: '관리비', price: 24975, feeType: 'MAINTENANCE', note: '1평 기준, 연 관리비' },
                    { name: '선납 관리비 정산', price: 0, feeType: 'MAINTENANCE', note: '미도래분은 해당년도 인상 가격으로 재정산' }
                ]
            }
        ];
        updated.push('park-0143');
    }

    // ─── park-0144 남부권공설묘지 ───
    // 이미지: 묘지 사용료 1,524,000 (이용자격:당진시민 사용기간:15년 3회연장가능)
    //   묘지 관리비 538,400 / 잔디값 49,600 (동일 조건)
    // EXTENSION → 제거, RESIDENT → LOCAL, grade → note
    {
        const p = data.find(d => d.id === 'park-0144');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1524000, isRepresentative: true, residency: 'LOCAL', note: '이용자격: 당진시민, 사용기간: 15년, 3회 연장 가능' },
                    { name: '묘지 관리비', price: 538400, feeType: 'MAINTENANCE' },
                    { name: '잔디값', price: 49600, note: '잔디 설치비' }
                ]
            }
        ];
        updated.push('park-0144');
    }

    // ─── park-0145 (재)자하연팔당(묘지) ───
    // 이미지: 매장묘,봉안묘 사용료(평당) 2,450,000 / 매장묘,봉안묘 1년 관리비(평당) 27,000
    //   미사용 묘지 반환규정: 계약일로부터 1년 미만 토지사용료의 80%환급, 1년이상 5년 미만 50%, 5년이상 10년미만 20%환급, 10년이상은 환급없음
    // USAGE feeType 제거, grade "연관리비" → note, 봉안당 subType 분리
    {
        const p = data.find(d => d.id === 'park-0145');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘·봉안묘',
                rows: [
                    { name: '사용료', price: 2450000, isRepresentative: true, note: '평당' },
                    { name: '관리비', price: 27000, feeType: 'MAINTENANCE', note: '평당, 연 관리비' },
                    { name: '미사용 묘지 반환', price: 0, note: '1년 미만 80%, 1~5년 50%, 5~10년 20%, 10년 이상 환급 없음' }
                ]
            }
        ];
        updated.push('park-0145');
    }

    // ─── park-0146 중림동성당묘원 ───
    // 이미지: 묘지사용료 1,000,000 (1평당) / 15년 관리비 200,000 (1평당)
    //   묘지반환금 0 (묘지반은년도기준금액으로 반환)
    // USAGE feeType 제거, grade "연관리비" → note 수정 ("15년 관리비")
    {
        const p = data.find(d => d.id === 'park-0146');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 1000000, isRepresentative: true, note: '1평당' },
                    { name: '15년 관리비', price: 200000, feeType: 'MAINTENANCE', note: '1평당, 15년분' },
                    { name: '묘지 반환금', price: 0, note: '반환년도 기준 금액으로 반환' }
                ]
            }
        ];
        updated.push('park-0146');
    }

    // ─── park-0147 은광교회 묘지 ───
    // 이미지: 매장1.5평 1,000,000 (4.95㎡) / 평장 500,000 / 1년 30,000
    // USAGE feeType 제거, grade "연관리비" → note, 평장묘 구분
    {
        const p = data.find(d => d.id === 'park-0147');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '매장묘 사용료 (1.5평)', price: 1000000, isRepresentative: true, note: '4.95㎡' },
                    { name: '연 관리비', price: 30000, feeType: 'MAINTENANCE', note: '매년' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘 사용료', price: 500000 }
                ]
            }
        ];
        updated.push('park-0147');
    }

    // ─── park-0148 양우회 ───
    // 이미지: 묘지 0 (사설, 만장 상대임) / 서비스: 묘지 0 (만장 상대임) / 용품: 용품 0
    // grade "만장" → note, 가격 0원 그대로 (회원제)
    {
        const p = data.find(d => d.id === 'park-0148');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용', price: 0, isRepresentative: true, note: '만장 상태, 별도 문의 필요' }
                ]
            }
        ];
        updated.push('park-0148');
    }

    // ─── park-0149 인천호남향우회 ───
    // 이미지: 묘지안장료 0 / 묘지관리비 0 / 묘지사용 0 (만장)
    // 이름 정리, 가격 0원 그대로 (만장/회원제)
    {
        const p = data.find(d => d.id === 'park-0149');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 안장료', price: 0, isRepresentative: true, note: '만장 상태' },
                    { name: '묘지 관리비', price: 0, feeType: 'MAINTENANCE' },
                    { name: '묘지 사용', price: 0, note: '만장' }
                ]
            }
        ];
        updated.push('park-0149');
    }

    // ─── park-0150 삼성개발공원묘원(묘지) ───
    // 이미지: 관리비 7,878 (제곱미터당) / 토지사용료 897,239 (제곱미터당)
    //   서비스: 매전(합장) 7,610,000 (조성및작업비+석물비 포함)
    // USAGE feeType 제거, grade "연관리비" → note, 서비스항목 추가
    {
        const p = data.find(d => d.id === 'park-0150');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '토지 사용료', price: 897239, isRepresentative: true, note: '제곱미터당' },
                    { name: '관리비', price: 7878, feeType: 'MAINTENANCE', note: '제곱미터당, 연 관리비' },
                    { name: '매전 (합장)', price: 7610000, note: '조성및작업비(금1백5십만원), 석물비(묘대,상석,비석,화병,금611만원), 잔디비 포함' }
                ]
            }
        ];
        updated.push('park-0150');
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
    console.log('\n✨ 141~150 수정 완료!');
}
fix();
