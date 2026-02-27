const fs = require('fs');
const fp = require('path').join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// ============================================================
// [핵심 원칙] UI 렌더링 규칙:
//   - feeType 없음 or 'USAGE' → 메인 가격 행 (usageRows)
//   - feeType 'MAINTENANCE'   → 관리비 안내 박스 (mgmtRows)
//   - 그 외 (STONE, INSTALLATION, EXTENSION 등) → "안내 및 규정" 박스 (otherRows)
//
// → STONE / INSTALLATION / EXTENSION 은 절대 쓰지 않는다!
// → 석물은 groupType: '[필수]석물'로 같은 아코디언 내 탭 분류
// → 설치비/재계약/연장도 feeType 없이 일반 USAGE 행으로 처리
// ============================================================

// ============================================================
// park-0082 세종시공설묘지 (공설)
// 이미지: 일반묘지 사용료 90,000 / 관리료 110,000 / 비석대 805,000
//         국가유공자묘지 사용료 0 / 관리료 0 / 비석대 805,000
// 수정: 국가유공자를 별도 subType이 아닌 매장묘 행으로 통합
//       비석대는 groupType '[필수]석물'로 분류
// ============================================================
{
    const p = data.find(d => d.id === 'park-0082');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '일반묘지 사용료', price: 90000, isRepresentative: true },
                { name: '일반묘지 관리료', price: 110000, feeType: 'MAINTENANCE' },
                { name: '국가유공자묘지 사용료', price: 0, note: '무료', residency: 'VETERAN' },
                { name: '국가유공자묘지 관리료', price: 0, note: '무료', residency: 'VETERAN', feeType: 'MAINTENANCE' },
                { name: '비석대', price: 805000, note: '일반/국가유공자 동일', groupType: '[필수]석물' }
            ]
        }
    ];
    console.log('✅ park-0082 fixed');
}

// ============================================================
// park-0083 대전추모공원 가족묘원 (공설)
// 이미지: 봉안(관내) 200,000 / 봉안(관외) 400,000 (1구당/15년)
//         묘지(단장 재계약) 363,000 / 묘지(합장 재계약) 544,500 (1기당/15년)
//         가족묘원(재계약) 550,000 (1위당/15년)
//         가족묘원(관리비) 516,000 (1기당/5년)
// 수정: 재계약 → feeType 제거 (EXTENSION 금지)
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
                { name: '묘지 재계약 (단장)', price: 363000, note: '1기당 / 15년 기한' },
                { name: '묘지 재계약 (합장)', price: 544500, note: '1기당 / 15년 기한' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '가족묘원',
            rows: [
                { name: '가족묘원 재계약', price: 550000, note: '1위당 / 15년 기한' },
                { name: '가족묘원 관리비', price: 516000, note: '1기당 / 5년 단위', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0083 fixed');
}

// ============================================================
// park-0084 매화공원묘지 (공설)
// 이미지: 사용료(단장) 70,000 / 매장비(단장) 158,900 / 관리비(단장) 153,750 (15년)
//         사용료(합장) 105,000 / 매장비(합장) 198,620 / 관리비(합장) 208,200 (15년)
// 수정: 매장비 → feeType 제거 (INSTALLATION 금지)
// ============================================================
{
    const p = data.find(d => d.id === 'park-0084');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '단장형',
            rows: [
                { name: '사용료 (단장)', price: 70000, note: '15년', isRepresentative: true },
                { name: '매장비 (단장)', price: 158900, note: '15년' },
                { name: '관리비 (단장)', price: 153750, note: '15년', feeType: 'MAINTENANCE' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '합장형',
            rows: [
                { name: '사용료 (합장)', price: 105000, note: '15년', isRepresentative: true },
                { name: '매장비 (합장)', price: 198620, note: '15년' },
                { name: '관리비 (합장)', price: 208200, note: '15년', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0084 fixed');
}

// ============================================================
// park-0086 (재)천주교세종로묘원 (시설)
// 이미지: 묘지사용료 3,000,000 (9.92m2) / 묘지관리비 5,000 (3.3m2)
//         평장묘지분양금액(합장) 9,000,000 (3.3m2) / 평장묘지관리비 66,667 (3.3m2)
//         1단 모대 800,000 (2150×1530mm) / 2단 모대 1,500,000 (2400×1740mm)
// 수정: 석물 별도 subType X → 매장묘 안에 groupType '[필수]석물'
// ============================================================
{
    const p = data.find(d => d.id === 'park-0086');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료', price: 3000000, note: '9.92㎡', isRepresentative: true },
                { name: '묘지 관리비', price: 5000, note: '3.3㎡당', feeType: 'MAINTENANCE' },
                { name: '1단 모대', price: 800000, note: '2150×1530mm', groupType: '[필수]석물' },
                { name: '2단 모대', price: 1500000, note: '2400×1740mm', groupType: '[필수]석물' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '평장묘지 분양금액 (합장)', price: 9000000, note: '3.3㎡', isRepresentative: true },
                { name: '평장묘지 관리비', price: 66667, note: '3.3㎡당', feeType: 'MAINTENANCE' }
            ]
        }
    ];
    console.log('✅ park-0086 fixed');
}

// ============================================================
// park-0087 서라벌공원묘원 (시설)
// 이미지: 사용료 332,749원/1㎡(1,100,000원/1평) / 관리비 4,538/1㎡(15,000/1평)
//         매장묘(일반 개인형/3평형) 11,325,000 (돌래석,오석비표,상석,꽃병,향로)
//         봉안묘(일반 부부형/1.5평형) 6,892,500 (돌래석,오석비표,상석,꽃병,향로)
//         자연장 평장묘(일반 개인형/1평형) 4,770,000 (표석,받침대,꽃병)
//         분묘설치비 500,000 (3.3㎡(1평)당)
// 수정: 분묘설치비 feeType 제거 → 매장묘 가격 행
//       평장묘 → serviceType NATURAL, 가격 행으로 유지
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
                { name: '분묘설치비', price: 500000, note: '1평당' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘 일체형 (일반 부부형/1.5평)', price: 6892500, note: '돌래석, 오석비표, 상석, 꽃병, 향로 포함', isRepresentative: true }
            ]
        },
        {
            serviceType: 'NATURAL', subType: '자연장 평장묘',
            rows: [
                { name: '자연장 평장묘 (일반 개인형/1평)', price: 4770000, note: '표석, 받침대, 꽃병 포함', isRepresentative: true }
            ]
        }
    ];
    console.log('✅ park-0087 fixed');
}

// ============================================================
// park-0089 여수시공설묘지공원 (공설)
// 이미지: 공설묘지사용료(일반시민) 540,000 / 관리비 360,000 / 부대수수료 702,000
//         공설묘지사용료(특례자)   810,000 / 관리비 360,000 / 부대수수료 702,000
//         모두 묘지1구당 6.61㎡/30년
// 수정: 부대수수료 feeType INSTALLATION → 제거 (가격 행 유지)
// ============================================================
{
    const p = data.find(d => d.id === 'park-0089');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '사용료 (일반시민)', price: 540000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL', isRepresentative: true },
                { name: '관리비 (일반시민)', price: 360000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL', feeType: 'MAINTENANCE' },
                { name: '부대수수료 (일반시민)', price: 702000, note: '1구당 6.61㎡ / 30년', residency: 'LOCAL' },
                { name: '사용료 (특례자)', price: 810000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL' },
                { name: '관리비 (특례자)', price: 360000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL', feeType: 'MAINTENANCE' },
                { name: '부대수수료 (특례자)', price: 702000, note: '1구당 6.61㎡ / 30년', residency: 'NON_LOCAL' }
            ]
        }
    ];
    console.log('✅ park-0089 fixed');
}

// ============================================================
// park-0090 정선하늘공원 (공설)
// 이미지: 단장(6.3㎡) 923,000 / 합장(8.1㎡) 1,200,000 (매장분묘, 정선군민만)
//         봉안묘(12기:10㎡) 1,476,000 (정선군민만)
//         연장 사용료: 단장 300,000 / 합장 390,000 / 봉안묘 480,000
// 수정: 연장 사용료 feeType EXTENSION → 제거 (가격 행 유지)
// ============================================================
{
    const p = data.find(d => d.id === 'park-0090');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '단장', price: 923000, note: '6.3㎡, 정선군민만 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '합장', price: 1200000, note: '8.1㎡, 정선군민만 가능', residency: 'LOCAL' },
                { name: '연장 사용료 (단장)', price: 300000 },
                { name: '연장 사용료 (합장)', price: 390000 }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘', price: 1476000, note: '12기, 10㎡, 정선군민만 가능', residency: 'LOCAL', isRepresentative: true },
                { name: '연장 사용료 (봉안묘)', price: 480000 }
            ]
        }
    ];
    console.log('✅ park-0090 fixed');
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ALL v2 fixes applied (82,83,84,86,87,89,90) - no STONE/INSTALLATION/EXTENSION feeType used');
