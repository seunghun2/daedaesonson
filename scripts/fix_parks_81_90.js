const fs = require('fs');
const fp = require('path').join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// ============================================================
// park-0081 충현동산
// 이미지: 묘지 사용료 없음 (0원), 관리비 없음 (0원), 반환기준/방법 해당 없음
// 서비스: 비석/묘태석/고인표식 모두 무상설치 (0원)
// → 가격 정보가 실질적으로 없는 시설. 0원 표시 유지하되 grade 정리
// ============================================================
{
    const p = data.find(d => d.id === 'park-0081');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료', price: 0, note: '별도 공개 없음', isRepresentative: true },
                { name: '관리비', price: 0, note: '별도 공개 없음', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0081 fixed (가격 미공개 - 0원 유지, grade→note 이동)');
}

// ============================================================
// park-0082 세종시공설묘지
// 이미지: 일반묘지 사용료 90,000 / 관리료 110,000 / 비석대 805,000
//         국가유공자묘지 사용료 0 / 관리료 0 / 비석대 805,000
// 공설 → residency 추가는 불필요 (관내/관외 구분 없음)
// 현재: feeType OK, 석물은 STONE으로 변경
// ============================================================
{
    const p = data.find(d => d.id === 'park-0082');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '일반묘지 사용료', price: 90000, isRepresentative: true },
                { name: '일반묘지 관리료', price: 110000, feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '국가유공자묘지',
            rows: [
                { name: '국가유공자묘지 사용료', price: 0, note: '무료' },
                { name: '국가유공자묘지 관리료', price: 0, note: '무료', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '석물',
            rows: [
                { name: '비석대', price: 805000, note: '일반/국가유공자 동일', feeType: 'STONE' }
            ]
        }
    ];
    console.log('✅ park-0082 fixed (석물 feeType STONE으로 변경, 국가유공자 분리)');
}

// ============================================================
// park-0083 대전추모공원 가족묘원
// 이미지: 봉안(관내) 200,000 / 봉안(관외) 400,000 (1구당/15년)
//         묘지(단장 재계약) 363,000 / 묘지(합장 재계약) 544,500 (1구당/15년)
//         가족묘원(재계약) 550,000 (1위당/15년)
//         가족묘원(관리비) 516,000 (1기당/5년단위)
// 핵심: ★가 관리비(516,000)에 → 봉안 사용료로 이동
// serviceType: 봉안 → BONGSAN, 묘지 단장/합장 재계약 → BURIAL
// ============================================================
{
    const p = data.find(d => d.id === 'park-0083');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당',
            rows: [
                { name: '봉안 사용료 (관내)', price: 200000, note: '1구당 / 15년 기한', residency: 'LOCAL', isRepresentative: true },
                { name: '봉안 사용료 (관외)', price: 400000, note: '1구당 / 15년 기한', residency: 'NON_LOCAL' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 재계약 (단장)', price: 363000, note: '1구당 / 15년 기한', feeType: 'EXTENSION' },
                { name: '묘지 재계약 (합장)', price: 544500, note: '1구당 / 15년 기한', feeType: 'EXTENSION' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '가족묘원',
            rows: [
                { name: '가족묘원 재계약', price: 550000, note: '1위당 / 15년 기한', feeType: 'EXTENSION' },
                { name: '가족묘원 관리비', price: 516000, note: '1기당 / 5년 단위', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0083 fixed (★ 관리비→봉안 사용료로 이동, serviceType 교정)');
}

// ============================================================
// park-0084 매화공원묘지
// 이미지: 사용료(단장) 70,000 / 매장비(단장) 158,900 / 관리비(단장) 153,750 (모두 15년)
//         사용료(합장) 105,000 / 매장비(합장) 198,620 / 관리비(합장) 208,200 (모두 15년)
// 공설묘지
// 현재: 대체로 OK. note 보강
// ============================================================
{
    const p = data.find(d => d.id === 'park-0084');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '단장형',
            rows: [
                { name: '사용료 (단장)', price: 70000, note: '15년', isRepresentative: true },
                { name: '매장비 (단장)', price: 158900, note: '15년', feeType: 'INSTALLATION' },
                { name: '관리비 (단장)', price: 153750, note: '15년', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '합장형',
            rows: [
                { name: '사용료 (합장)', price: 105000, note: '15년', isRepresentative: true },
                { name: '매장비 (합장)', price: 198620, note: '15년', feeType: 'INSTALLATION' },
                { name: '관리비 (합장)', price: 208200, note: '15년', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0084 fixed (note 보강)');
}

// ============================================================
// park-0085 영동공원묘원
// 이미지: 매장묘지(사용료) 300,000 (평당), 매장묘지(관리비) 70,000 (기당)
//         납골묘지(사용료) 650,000 (평당), 납골묘지(관리비) 70,000 (10평당)
//         단장 4,100,000 (1기), 합장 5,100,000 (1기)
// 단장/합장은 일체형 가격 (사용료+석물+작업비 포함 추정)
// → 매장묘 아래에 사용료/관리비 + 일체형, 납골묘→BONGSAN
// ============================================================
{
    const p = data.find(d => d.id === 'park-0085');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '매장묘지 사용료', price: 300000, note: '평당', isRepresentative: true },
                { name: '매장묘지 관리비', price: 70000, note: '기당', feeType: 'MAINTENANCE' },
                { name: '단장 일체형', price: 4100000, note: '1기 (사용료+석물+작업비 포함)' },
                { name: '합장 일체형', price: 5100000, note: '1기 (사용료+석물+작업비 포함)' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '납골묘지 사용료', price: 650000, note: '평당', isRepresentative: true },
                { name: '납골묘지 관리비', price: 70000, note: '10평당', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0085 fixed (납골묘→BONGSAN, 단장/합장 일체형 note 정리)');
}

// ============================================================
// park-0086 (재)천주교세종로묘원
// 이미지: 묘지사용료 3,000,000 (9.92m2), 묘지관리비 5,000 (3.3m2)
//         평장묘지분양금액(합장) 9,000,000 (3.3m2), 평장묘지관리비 66,667 (3.3m2)
// 서비스: 1단 모대 800,000 (2150×1530mm), 2단 모대 1,500,000 (2400×1740mm)
// 현재: 석물의 feeType이 USAGE → STONE으로 변경해야 함
// ============================================================
{
    const p = data.find(d => d.id === 'park-0086');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료', price: 3000000, note: '9.92㎡', isRepresentative: true },
                { name: '묘지 관리비', price: 5000, note: '3.3㎡당', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '평장묘지 분양금액 (합장)', price: 9000000, note: '3.3㎡', isRepresentative: true },
                { name: '평장묘지 관리비', price: 66667, note: '3.3㎡당', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '석물',
            rows: [
                { name: '1단 모대', price: 800000, note: '2150×1530mm', feeType: 'STONE' },
                { name: '2단 모대', price: 1500000, note: '2400×1740mm', feeType: 'STONE' }
            ]
        }
    ];
    console.log('✅ park-0086 fixed (석물 feeType USAGE→STONE 변경)');
}

// ============================================================
// park-0087 서라벌공원묘원
// 이미지: 사용료 332,749원/1㎡(1,100,000원/1평), 관리비 4,538원/1㎡(15,000원/1평)
//         매장묘(일반 개인형/3평형) 11,325,000 (돌래석,오석비표,상석,꽃병,향로)
//         봉안묘(일반 부부형/1.5평형) 6,892,500 (돌래석,오석비표,상석,꽃병,향로)
//         자연장 평장묘(일반 개인형/1평형) 4,770,000 (표석,받침대,꽃병)
//         분묘설치비 500,000 (3.3㎡(1평)당)
// 현재: grade에 파싱 찌꺼기 있음 → note로 정리
// ============================================================
{
    const p = data.find(d => d.id === 'park-0087');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '사용료', price: 1100000, note: '1평당 (332,749원/㎡)', isRepresentative: true },
                { name: '관리비', price: 15000, note: '1평당 (4,538원/㎡)', feeType: 'MAINTENANCE' },
                { name: '매장묘 일체형 (일반 개인형/3평)', price: 11325000, note: '돌래석, 오석비표, 상석, 꽃병, 향로 포함' },
                { name: '분묘설치비', price: 500000, note: '1평당', feeType: 'INSTALLATION' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘 일체형 (일반 부부형/1.5평)', price: 6892500, note: '돌래석, 오석비표, 상석, 꽃병, 향로 포함', isRepresentative: true }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '자연장 평장묘 (일반 개인형/1평)', price: 4770000, note: '표석, 받침대, 꽃병 포함', isRepresentative: true }
            ]
        }
    ];
    console.log('✅ park-0087 fixed (grade 파싱 찌꺼기 정리, 평당 가격 기준으로 통일)');
}

// ============================================================
// park-0088 김해하늘공원(묘지)
// 이미지: 사용료 2,500,000 (3.3㎡기준), 관리비 18,000 (3.3㎡/1년기준)
// 현재: 이미 깔끔함. note 보강만
// ============================================================
{
    const p = data.find(d => d.id === 'park-0088');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '사용료', price: 2500000, note: '3.3㎡ 기준', isRepresentative: true },
                { name: '관리비', price: 18000, note: '3.3㎡ / 연간', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0088 fixed (note 보강)');
}

// ============================================================
// park-0089 여수시공설묘지공원
// 이미지: 공설묘지사용료(일반시민) 540,000 / 관리비(일반) 360,000 / 부대수수료(일반) 702,000
//         공설묘지사용료(특례자) 810,000 / 관리비(특례) 360,000 / 부대수수료(특례) 702,000
//         모두 묘지1구당 6.61㎡ / 30년
// 공설 → 일반시민=관내(LOCAL), 특례자=관외(NON_LOCAL) 구분
// 현재: residency 미설정 + 사용료 810,000 별도 구분 없음
// ============================================================
{
    const p = data.find(d => d.id === 'park-0089');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '사용료 (일반시민)', price: 540000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리비 (일반시민)', price: 360000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL', feeType: 'MAINTENANCE' },
                { name: '부대수수료 (일반시민)', price: 702000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL', feeType: 'INSTALLATION' },
                { name: '사용료 (특례자)', price: 810000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL' },
                { name: '관리비 (특례자)', price: 360000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL', feeType: 'MAINTENANCE' },
                { name: '부대수수료 (특례자)', price: 702000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL', feeType: 'INSTALLATION' }
            ]
        }
    ];
    console.log('✅ park-0089 fixed (일반시민/특례자 → LOCAL/NON_LOCAL 배지 추가)');
}

// ============================================================
// park-0090 정선하늘공원
// 이미지: 단장(6.3㎡) 923,000 / 합장(8.1㎡) 1,200,000 (매장분묘, 정선군민만 가능)
//         봉안묘(12기:10㎡) 1,476,000 (정선군민만 가능)
//         연장 사용료: 단장 300,000 / 합장 390,000 / 봉안묘 480,000
// 공설 → 정선군민만 가능이므로 residency: LOCAL
// 현재: 봉안묘 ★ 없음, grade에 파싱 찌꺼기
// ============================================================
{
    const p = data.find(d => d.id === 'park-0090');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '단장', price: 923000, note: '6.3㎡, 정선군민만 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '합장', price: 1200000, note: '8.1㎡, 정선군민만 가능', residency: 'LOCAL' },
                { name: '연장 사용료 (단장)', price: 300000, feeType: 'EXTENSION' },
                { name: '연장 사용료 (합장)', price: 390000, feeType: 'EXTENSION' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘', price: 1476000, note: '12기, 10㎡, 정선군민만 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '연장 사용료 (봉안묘)', price: 480000, feeType: 'EXTENSION' }
            ]
        }
    ];
    console.log('✅ park-0090 fixed (봉안묘 ★ 추가, grade 파싱 찌꺼기 정리, BONGSAN 분리)');
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ALL parks 81-90 fixed!');
