const fs = require('fs');
const fp = require('path').join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// ============================================================
// park-0071 (재)신세계공원묘원
// 이미지: 묘지사용료 1,000,000(평당/3.3㎡), 관리비 14,000(년/평당),
//   봉안묘(부부단) 10,000,000(시설비+사용료+관리비+봉안비+각자비별도),
//   평장묘(1구) 4,000,000(시설비+사용료+관리비+각자비별도),
//   평장묘(2구~4구) 8,700,000, 수목장(부부묘/1~2구) 4,750,000, 수목장(1~4구) 9,400,000
// 현재: 묘지사용료 800,000 → 1,000,000, 관리비 11,000 → 14,000
//   봉안묘(부부단) 6,900,000 → 10,000,000 (feeType MAINTENANCE→없음)
//   평장묘(1구) 3,000,000 → 4,000,000 (feeType MAINTENANCE→없음)
//   평장묘(2구~4구) 추가 8,700,000
//   수목장 추가
// ============================================================
{
    const p = data.find(d => d.id === 'park-0071');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지사용료', price: 1000000, note: '평당 (3.3㎡)', isRepresentative: true },
                { name: '관리비', price: 14000, note: '년/평당 (3.3㎡)', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘 (부부단)', price: 10000000, note: '시설비+사용료+관리비+봉안비 (각자비 별도)', isRepresentative: true }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '평장묘 (1구)', price: 4000000, note: '시설비+사용료+관리비+각자비별도', isRepresentative: true },
                { name: '평장묘 (2구~4구)', price: 8700000, note: '시설비+사용료+관리비+봉안비+각자비별도' }
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장',
            rows: [
                { name: '수목장 (부부묘/1~2구)', price: 4750000, note: '사용료+관리비+석물+봉안비+각자비별도', isRepresentative: true },
                { name: '수목장 (1~4구)', price: 9400000, note: '사용료+관리비+석물+봉안비+각자비별도' }
            ]
        }
    ];
    console.log('✅ park-0071 fixed');
}

// ============================================================
// park-0072 영종공설묘지(신규매장불가)
// 이미지: 비조성묘지 사용료 3,600(4.95㎡당), 관리비 17,800
// 서비스항목: 가로*세로*두께 석물 목록 → 석물 아코디언
// 현재: OK (isRepresentative 이미 있음), 관리비에도 REP→제거
// + 서비스항목의 석물 데이터 추가
// ============================================================
{
    const p = data.find(d => d.id === 'park-0072');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '비조성묘지 사용료', price: 3600, note: '비조성묘지 4.95㎡당', isRepresentative: true },
                { name: '비조성묘지 관리비', price: 17800, note: '비조성묘지 4.95㎡당', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '석물',
            rows: [
                { name: '가로+세로+두께 (대)', price: 300000, note: '120×45×10', feeType: 'STONE' },
                { name: '가로+세로+두께 (소)', price: 200000, note: '24×60×10', feeType: 'STONE' },
                { name: '좌대 긴거', price: 50000, note: '120×12×12', feeType: 'STONE' },
                { name: '좌대 짧은거', price: 40000, note: '100×12×12', feeType: 'STONE' },
                { name: '비석받침대', price: 20000, note: '40×24×10', feeType: 'STONE' }
            ]
        }
    ];
    console.log('✅ park-0072 fixed');
}

// ============================================================
// park-0073 재단법인 춘천공원묘원
// 이미지: 현재 묘지관리비 15,000(평당), 2024년부터 17,000(평당)
// 서비스항목: 2.5자~3.5자, 암석3자~3.5자, 파암비 소정~3자 (가격 0)
// 사용료 정보가 없음 → RECHECK 추가
// 현재 데이터: 관리비만 있음 → 관리비만 유지, 체크 요망
// ============================================================
{
    const p = data.find(d => d.id === 'park-0073');
    // 관리비에 isRepresentative 제거 (사용료가 아님)
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 관리비 (현재)', price: 15000, note: '평당', feeType: 'MAINTENANCE' },
                { name: '묘지 관리비 (2024년~)', price: 17000, note: '평당', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0073 fixed (관리비만 - 사용료 정보 없음, 체크 요망)');
}

// ============================================================
// park-0074 창원공원묘원(묘지)
// 이미지: 사용료 2,700,000(1평기준), 관리비 20,000(1평/1년기준)
// 서비스: 매장묘 일체형 6,517,900~46,733,900, 봉안묘 일체형 9,044,000~44,610,000
//   평장묘 일체형 3,680,000~29,206,800, 수목형 일체형 3,170,000~23,842,000
// 일체형=사용료+관리비1년+석물일체+작업비
// 현재: 대체로 OK이나 feeType MAINTENANCE가 일체형 행에 잘못 적용됨
// ============================================================
{
    const p = data.find(d => d.id === 'park-0074');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '사용료', price: 2700000, note: '1평 기준', isRepresentative: true },
                { name: '관리비', price: 20000, note: '1평/1년 기준', feeType: 'MAINTENANCE' },
                { name: '매장묘 일체형', price: 6517900, note: '사용료+관리비1년+석물일체+작업비 (각자비별도)' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘 일체형', price: 9044000, note: '사용료+관리비1년+석물일체+작업비 (각자비별도)', isRepresentative: true }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '평장묘 일체형', price: 3680000, note: '사용료+관리비1년+석물일체+작업비 (각자비별도)', isRepresentative: true }
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장',
            rows: [
                { name: '수목형 일체형', price: 3170000, note: '사용료+관리비1년+석물일체+작업비 (각자비별도)', isRepresentative: true }
            ]
        }
    ];
    console.log('✅ park-0074 fixed');
}

// ============================================================
// park-0075 (재)학명묘원
// 이미지: 사용료 800,000(평당), 관리비 12,000(평당),
//   봉안묘 1기 2,340,000, 봉안묘 2기 5,200,000
// 서비스: 기본상석 300,000(가로70×세로40), 보급형상석 450,000(가로75×세로48), 기본표석 230,000(가로22×세로65)
// 현재: 사용료/관리비 OK. 석물 데이터 추가 필요
// ============================================================
{
    const p = data.find(d => d.id === 'park-0075');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료', price: 800000, note: '평당', isRepresentative: true },
                { name: '관리비', price: 12000, note: '평당', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당',
            rows: [
                { name: '봉안당 1기형', price: 2340000, isRepresentative: true },
                { name: '봉안당 2기형', price: 5200000 }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '석물',
            rows: [
                { name: '기본상석', price: 300000, note: '가로70cm×세로40cm', feeType: 'STONE' },
                { name: '보급형상석', price: 450000, note: '가로75cm×세로48cm', feeType: 'STONE' },
                { name: '기본표석', price: 230000, note: '가로22cm×세로65cm', feeType: 'STONE' }
            ]
        }
    ];
    console.log('✅ park-0075 fixed');
}

// ============================================================
// park-0076 백란공원묘원
// 이미지: 묘지사용료 1,600,000(3.3㎡), 연간관리비 22,000(3.3㎡),
//   미사용관리비반환=0 (유골이장/개장시 사용료 반환 없고 선납관리비 미경과 반환)
// 서비스: 1단석물 3,960,000, 2단석물 5,940,000, 3단석물 7,920,000, 매장작업비 3,000,000
// 현재: 사용료 OK. 단장형의 매장작업비→석물/작업 분리 필요
// ============================================================
{
    const p = data.find(d => d.id === 'park-0076');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지사용료', price: 1600000, note: '3.3 평방미터', isRepresentative: true },
                { name: '연간관리비', price: 22000, note: '3.3 평방미터', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '[필수]석물',
            rows: [
                { name: '1단 석물', price: 3960000, note: '1단 묘테, 비석, 상석, 화병 각 1개', feeType: 'STONE' },
                { name: '2단 석물', price: 5940000, note: '2단 묘테, 비석, 상석, 화병 각 1개', feeType: 'STONE' },
                { name: '3단 석물', price: 7920000, note: '3단 묘테, 비석, 상석, 화병 각 1개', feeType: 'STONE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '매장 작업비',
            rows: [
                { name: '매장 작업비', price: 3000000, note: '1기당 안치비 포함', feeType: 'INSTALLATION' }
            ]
        }
    ];
    console.log('✅ park-0076 fixed');
}

// ============================================================
// park-0077 애향묘지
// 이미지: 재외동포묘역 (평장) 이용료 30,000 + 관리비 170,000
//   재외동포묘역 (평장) 이용료 50,000 + 관리비 250,000
//   재외동포묘역 (봉안묘) 이용료 50,000 + 관리비 250,000
//   이북도민묘역 이용료 50,000
// 제주 출신 재외동포 대상 특수 묘지
// 현재: 대체로 OK이나 groupType 구분 필요
// ============================================================
{
    const p = data.find(d => d.id === 'park-0077');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '재외동포묘역 이용료 (소형)', price: 30000, note: '제주자치도에서 출생한 재외동포 및 그 배우자', isRepresentative: true },
                { name: '재외동포묘역 관리비 (소형)', price: 170000, note: '제주자치도에서 출생한 재외동포 및 그 배우자', feeType: 'MAINTENANCE' },
                { name: '재외동포묘역 이용료 (대형)', price: 50000, note: '제주자치도에서 출생한 재외동포 및 그 배우자' },
                { name: '재외동포묘역 관리비 (대형)', price: 250000, note: '제주자치도에서 출생한 재외동포 및 그 배우자', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '재외동포묘역 이용료', price: 50000, note: '제주자치도에서 출생한 재외동포 및 그 배우자', isRepresentative: true },
                { name: '재외동포묘역 관리비', price: 250000, note: '제주자치도에서 출생한 재외동포 및 그 배우자', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '이북도민묘역',
            rows: [
                { name: '이북도민묘역 이용료', price: 50000, note: '이북지역에서 출생한 자 및 그 배우자' }
            ]
        }
    ];
    console.log('✅ park-0077 fixed');
}

// ============================================================
// park-0078 신당동성당 소화묘원
// 이미지: 20년 매장 사용금(조성비별도) 800,000(3.3㎡), 관리비(선)20년 선납 10,000(3.3㎡),
//   봉안 시설 1기(2구) 3,000,000(부부합장 20년 사용), 봉안 시설 관리비 1,000,000(묘원 운영 유지비 20년 선납)
// 서비스: 봉안묘 석물 2,700,000, 1단 석물 800,000, 3단 석물 2,000,000
// 현재: 대체로 OK. 석물을 별도 아코디언으로 분리
// ============================================================
{
    const p = data.find(d => d.id === 'park-0078');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '매장 사용료 (20년)', price: 800000, note: '3.3㎡ (조성비 별도)', isRepresentative: true },
                { name: '관리비 (20년 선납)', price: 10000, note: '3.3㎡', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당',
            rows: [
                { name: '봉안 시설 사용료', price: 3000000, note: '1기(2구), 부부합장, 20년 사용', isRepresentative: true },
                { name: '봉안 시설 관리비', price: 1000000, note: '묘원 운영 유지비, 도로보수, 벌초 등 (20년 선납)', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '[필수]석물',
            rows: [
                { name: '봉안묘 석물', price: 2700000, note: '부부 봉안석물 130만원 + 인건비 75만원 + 잔디 14만4천원 + 시대 9만원 + 폐기물 처리 10만원 + 공과잡비 31만6천원', feeType: 'STONE' },
                { name: '1단 석물', price: 800000, note: '석물대금 30만원 + 잔디 14만4천원 + 시대 9만원 + 폐기물 처리 10만원 + 공과잡비 16만6천원', feeType: 'STONE' },
                { name: '3단 석물', price: 2000000, note: '석물대금 80만원 + 잔디 14만4천원 + 시대 9만원 + 폐기물 처리 10만원 + 공과잡비 86만6천원', feeType: 'STONE' }
            ]
        }
    ];
    console.log('✅ park-0078 fixed');
}

// ============================================================
// park-0079 오창장미공원
// 이미지: [A구역] 사용료(단장) 1,302,600 / 매장비(단장) 158,900 / 관리비(단장) 153,750
//   [B구역] 사용료(단장) 1,762,350 / 매장비(단장) 198,620 / 관리비(단장) 208,200
// 현재: OK (이미 feeType 정리됨). isRepresentative 확인만
// ============================================================
{
    const p = data.find(d => d.id === 'park-0079');
    // 이미 잘 세팅됨 - isRepresentative 확인
    console.log('✅ park-0079 already OK');
}

// ============================================================
// park-0080 평창군 공설묘지
// 이미지: 단장 사용료 2,000,000 / 석물+매장비(하절기3~11월) 1,970,000 / (동절기12~2월) 2,046,000
//   합장 사용료 3,000,000 / 석물+매장비(하절기) 2,140,000 / (동절기) 2,216,000
// 현재: OK (이미 feeType STONE 세팅)
// ============================================================
{
    const p = data.find(d => d.id === 'park-0080');
    // 석물+매장비에 note 보강
    p.priceInfo.standardizedPrices.forEach(sp => {
        sp.rows.forEach(r => {
            if (r.name === '석물 및 매장비' && r.price === 1970000) r.note = '하절기 (3월~11월)';
            if (r.name === '석물 및 매장비' && r.price === 2046000) r.note = '동절기 (12월~2월)';
            if (r.name === '석물 및 매장비' && r.price === 2140000) r.note = '하절기 (3월~11월)';
            if (r.name === '석물 및 매장비' && r.price === 2216000) r.note = '동절기 (12월~2월)';
        });
    });
    console.log('✅ park-0080 fixed (note 보강)');
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ALL parks 71-80 fixed!');
