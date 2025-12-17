const fs = require('fs');

// 데이터 로드
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
const ordinanceData = JSON.parse(fs.readFileSync('data/ordinance_hwp/gemini_parsed_v2_with_address.json'));

console.log('=== 주소 매칭 v2 ===\n');

const publicFacilities = facilities.filter(f => f.isPublic === true);
console.log('공설 시설:', publicFacilities.length);

// 조례 데이터를 지역별로 그룹화
const ordByRegion = {};
ordinanceData.forEach(d => {
    const region = d.region;
    if (!ordByRegion[region]) ordByRegion[region] = [];
    ordByRegion[region].push(d);
});
console.log('조례 지역:', Object.keys(ordByRegion).length);

// 지역명 추출 함수
function extractRegion(address) {
    if (!address) return null;

    // 특별시/광역시/도 다음의 시/군/구 찾기
    const patterns = [
        /특별자치도\s+(\S+[시군구])/,
        /특별자치시/,
        /광역시\s+(\S+[구])/,
        /광역시/,
        /특별시\s+(\S+[구])/,
        /(\S+[시군])\s/,
    ];

    for (const p of patterns) {
        const m = address.match(p);
        if (m) return m[1] || m[0];
    }

    // 두 번째 단어 사용
    const parts = address.split(/\s+/);
    if (parts.length >= 2) return parts[1];

    return null;
}

// 도로명 추출
function extractRoadName(address) {
    if (!address) return null;
    const match = address.match(/(\S+[로길])\s*\d+/);
    return match ? match[1] : null;
}

// 시설명 정규화
function normalizeName(name) {
    if (!name) return '';
    return name.replace(/[공설시군구립]/g, '')
        .replace(/[묘지공원추모원당장지]/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
}

// 매칭 함수
function findMatch(facility) {
    const fAddr = facility.address || '';
    const fName = facility.name || '';
    const fRegion = extractRegion(fAddr);
    const fRoad = extractRoadName(fAddr);

    let bestMatch = null;
    let bestScore = 0;

    for (const [ordRegion, ordList] of Object.entries(ordByRegion)) {
        // 지역 매칭
        let regionMatch = false;
        if (fRegion) {
            const fRegionClean = fRegion.replace(/[시군구]/g, '');
            const ordRegionClean = ordRegion.replace(/[시군구]/g, '');
            regionMatch = fRegionClean.includes(ordRegionClean) || ordRegionClean.includes(fRegionClean);
        }

        if (!regionMatch) continue;

        for (const ord of ordList) {
            let score = 10; // 지역 매칭 기본 점수

            // 도로명 매칭
            if (fRoad && ord.address) {
                const ordRoad = extractRoadName(ord.address);
                if (ordRoad && fRoad === ordRoad) {
                    score += 50;
                }
            }

            // 시설명 매칭
            const fNameNorm = normalizeName(fName);
            const ordNameNorm = normalizeName(ord.facilityName);
            if (fNameNorm && ordNameNorm) {
                if (fNameNorm.includes(ordNameNorm) || ordNameNorm.includes(fNameNorm)) {
                    score += 30;
                }
            }

            // 주소 번지 매칭
            if (fAddr && ord.address) {
                const fNum = fAddr.match(/\d+-?\d*/g);
                const ordNum = ord.address.match(/\d+-?\d*/g);
                if (fNum && ordNum) {
                    const commonNums = fNum.filter(n => ordNum.includes(n));
                    score += commonNums.length * 5;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = { ord, ordRegion, score };
            }
        }
    }

    return bestMatch && bestScore >= 20 ? bestMatch : null;
}

// 매칭 실행
const results = { matched: [], unmatched: [] };

publicFacilities.forEach(f => {
    const match = findMatch(f);

    if (match) {
        results.matched.push({
            facilityId: f.id,
            facilityName: f.name,
            facilityAddress: f.address,
            ordRegion: match.ordRegion,
            ordName: match.ord.facilityName,
            ordAddress: match.ord.address,
            score: match.score
        });
    } else {
        results.unmatched.push({
            id: f.id,
            name: f.name,
            address: f.address
        });
    }
});

console.log('\n=== 매칭 결과 ===');
console.log('매칭 성공:', results.matched.length);
console.log('매칭 실패:', results.unmatched.length);
console.log('매칭률:', (results.matched.length / publicFacilities.length * 100).toFixed(1) + '%');

// 점수별 분포
const scoreRanges = { '90+': 0, '60-89': 0, '30-59': 0, '20-29': 0 };
results.matched.forEach(m => {
    if (m.score >= 90) scoreRanges['90+']++;
    else if (m.score >= 60) scoreRanges['60-89']++;
    else if (m.score >= 30) scoreRanges['30-59']++;
    else scoreRanges['20-29']++;
});
console.log('\n점수 분포:', scoreRanges);

console.log('\n=== 고점수 매칭 예시 (상위 10개) ===');
results.matched.sort((a, b) => b.score - a.score).slice(0, 10).forEach(m => {
    console.log(`[${m.score}점] ${m.facilityId} ${m.facilityName}`);
    console.log(`  → ${m.ordRegion} ${m.ordName}`);
});

// 저장
fs.writeFileSync('data/address_match_v2.json', JSON.stringify(results, null, 2));
console.log('\n저장: data/address_match_v2.json');
