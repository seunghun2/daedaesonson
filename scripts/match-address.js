const fs = require('fs');

// 데이터 로드
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));
const ordinanceData = JSON.parse(fs.readFileSync('data/ordinance_hwp/gemini_parsed_v2_with_address.json'));

console.log('=== 주소 매칭 분석 ===\n');
console.log('기존 시설:', facilities.length);
console.log('조례 데이터:', ordinanceData.length);

// 공설 시설만 필터
const publicFacilities = facilities.filter(f => f.isPublic === true);
console.log('공설 시설:', publicFacilities.length);

// 주소 있는 조례 데이터
const withAddress = ordinanceData.filter(d => d.address && d.address !== '-' && d.address !== null && d.address.length > 5);
console.log('주소 있는 조례 데이터:', withAddress.length);

// 지역별로 그룹화
const byRegion = {};
withAddress.forEach(d => {
    if (!byRegion[d.region]) byRegion[d.region] = [];
    byRegion[d.region].push(d);
});
console.log('조례 지역 수:', Object.keys(byRegion).length);

// 매칭 시도
let matched = 0;
let unmatched = [];
const matchResults = [];

publicFacilities.forEach(f => {
    if (!f.address) {
        unmatched.push({ id: f.id, name: f.name, reason: '주소 없음' });
        return;
    }

    // 주소에서 시/군/구 추출
    const addressParts = f.address.split(' ');
    let region = null;

    for (const part of addressParts) {
        if (part.endsWith('시') || part.endsWith('군') || part.endsWith('구')) {
            region = part;
            break;
        }
    }

    if (!region) {
        // 도 다음 단어 사용
        if (addressParts.length >= 2) {
            region = addressParts[1];
        }
    }

    // 조례 데이터에서 같은 지역 찾기
    let foundMatch = null;

    for (const [ordRegion, ordData] of Object.entries(byRegion)) {
        // 지역명 부분 매칭
        if (ordRegion.includes(region) || (region && region.includes(ordRegion.replace('시', '').replace('군', '').replace('구', '')))) {
            // 주소 유사도 체크
            for (const ord of ordData) {
                if (ord.address && f.address) {
                    // 주소 앞부분 비교
                    const ordAddrClean = ord.address.replace(/\s+/g, '');
                    const facAddrClean = f.address.replace(/\s+/g, '');

                    if (ordAddrClean.includes(facAddrClean.substring(0, 10)) ||
                        facAddrClean.includes(ordAddrClean.substring(0, 10))) {
                        foundMatch = { ordRegion, ordData: ord };
                        break;
                    }
                }
            }
        }
        if (foundMatch) break;
    }

    if (foundMatch) {
        matched++;
        matchResults.push({
            facilityId: f.id,
            facilityName: f.name,
            facilityAddress: f.address,
            ordRegion: foundMatch.ordRegion,
            ordAddress: foundMatch.ordData.address,
            ordFacilityName: foundMatch.ordData.facilityName
        });
    } else {
        unmatched.push({ id: f.id, name: f.name, address: f.address, reason: '매칭 실패' });
    }
});

console.log('\n=== 매칭 결과 ===');
console.log('매칭 성공:', matched);
console.log('매칭 실패:', unmatched.length);

console.log('\n=== 매칭 성공 예시 (처음 10개) ===');
matchResults.slice(0, 10).forEach(m => {
    console.log(`${m.facilityId} ${m.facilityName}`);
    console.log(`  시설주소: ${m.facilityAddress}`);
    console.log(`  조례지역: ${m.ordRegion} / ${m.ordFacilityName}`);
    console.log(`  조례주소: ${m.ordAddress}`);
    console.log('');
});

console.log('\n=== 매칭 실패 예시 (처음 10개) ===');
unmatched.slice(0, 10).forEach(u => {
    console.log(`${u.id} ${u.name} - ${u.reason}`);
    if (u.address) console.log(`  주소: ${u.address}`);
});

// 결과 저장
fs.writeFileSync('data/address_match_results.json', JSON.stringify({ matched: matchResults, unmatched }, null, 2));
console.log('\n결과 저장: data/address_match_results.json');
