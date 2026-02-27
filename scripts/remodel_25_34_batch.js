require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

// Only process park-0025 to park-0034
const targetIds = Array.from({ length: 10 }, (_, i) => `park-00${i + 25}`);

function refinePrices(parkId, originalPrices) {
    let prices = JSON.parse(JSON.stringify(originalPrices));
    let newPrices = [];

    prices.forEach(group => {
        let st = group.serviceType;
        let sbt = group.subType;

        const usageRows = [];
        const maintenanceRows = [];
        const workRows = [];
        const optionRows = [];

        group.rows.forEach(row => {
            // common cleanups
            let name = row.name || '';
            let grade = row.grade || '';
            let note = row.note || '';

            // Handle MAINTENANCE detection
            if (name.includes('관리비') || note.includes('관리비')) {
                row.feeType = 'MAINTENANCE';
                row.groupType = '묘역 유지 관리비 (필수)';

                // Duration parsing heuristic
                if (name.includes('15년') || note.includes('15년') || note.includes('15yr')) {
                    row.duration = 15;
                    row.durationType = 'YEAR';
                } else if (name.includes('10년') || note.includes('10년')) {
                    row.duration = 10;
                    row.durationType = 'YEAR';
                } else if (name.includes('30년') || note.includes('30년')) {
                    row.duration = 30;
                    row.durationType = 'YEAR';
                } else if (!row.duration) {
                    // Default to 1 YEAR if it's maintenance and no explicit duration
                    if (grade.includes('연간') || name.includes('연간') || name.includes('1년')) {
                        row.duration = 1;
                        row.durationType = 'YEAR';
                    }
                }

                if (parkId === 'park-0028') {
                    if (name.includes('A형')) grade = '구 4평형';
                    if (name.includes('B형')) grade = '구 6평형';
                    if (name.includes('C형')) grade = '구 8평형';
                }
                note = '묘역 외곽 조경 유지보수, 제초 작업, 도로 정비 등을 위해 지정된 기간마다 납부하는 필수 유지관리 비용입니다. (✅ 필수 항목)';
                maintenanceRows.push(row);
                return;
            }

            // Park 25 specific fixes
            if (parkId === 'park-0025') {
                if (name.includes('납골')) {
                    st = 'BONGSAN';
                    sbt = '가족 봉안묘 (야외)';
                    name = name.replace('납골', '기 가족 봉안묘');
                    row.groupType = '봉안묘 (토지+석물+설치비 총액)';
                    note = '가족 단위의 화장한 유골함을 돌무덤 형태(봉안묘) 내부에 다수 모시는 방식입니다. (✅ 석물 자재 및 설치 공사비 포함 총액)';
                    usageRows.push(row);
                    return;
                }
                if (sbt === '부가 항목') {
                    if (name.includes('석물')) {
                        name = name.replace('석물_', '묘역 석물 세트 (');
                        name += ')';
                        row.groupType = '석물 구매 및 조경 공사 (선택)';
                        note = '묘지를 꾸미는 비석, 상석, 묘테 등의 돌출물 자재 및 설치 총 비용입니다. 석재 종류에 따라 다릅니다. (✅ 선택 항목)';
                        optionRows.push(row);
                    } else if (name.includes('목함') || name.includes('유골함') || name.includes('위패')) {
                        row.groupType = '장례 용품 (선택)';
                        note = '장례 및 안치 시 필요에 의해 장지 현장에서 구매할 수 있는 품목입니다. (✅ 선택 항목)';
                        optionRows.push(row);
                    } else {
                        row.groupType = '편의 시설 비용 (선택)';
                        note = '유가족 방문 시 이용할 수 있는 편의 시설이나 조화 구매 비용입니다. (✅ 선택 항목)';
                        optionRows.push(row);
                    }
                    return;
                }
                if (st === 'BURIAL' && sbt === '매장묘') {
                    if (name === '묘지 사용료') {
                        row.groupType = '평당 토지 사용료 (필수)';
                        note = '매장묘 조성에 필요한 토지를 구획받는 비용입니다. (✅ 필수 항목. m²당 단가이므로 실제 분양 면적에 따라 곱해집니다.)';
                        usageRows.push(row);
                        return;
                    }
                }
            }

            // Park 26 (경춘공원묘원)
            if (parkId === 'park-0026') {
                if (st === 'BONGSAN') {
                    row.groupType = '안치단 높이에 따른 분양가';
                    note = '봉안당(실내) 유리단에 유골함을 모시는 비용입니다. 성인 눈높이에 맞는 단(로얄단)일수록 가격이 높습니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return;
                }
            }

            // Park 27 (우성공원묘원)
            if (parkId === 'park-0027') {
                if (st === 'BURIAL' && sbt === '매장묘') {
                    if (name.includes('사용료')) {
                        row.groupType = '토지 사용료 (필수)';
                        note = '시신을 매장할 공간을 분양받는 토지 대금입니다. (✅ 필수 항목)';
                        usageRows.push(row);
                    } else if (name.includes('석') || name.includes('각자') || name.includes('와비')) {
                        row.groupType = '비석 및 석물 작업비 (선택)';
                        note = '묘역을 단장하는 비석(돌 표지판)과 이름 글씨를 새기는(각자) 세공 인건비 및 자재비입니다. (✅ 선택 항목)';
                        optionRows.push(row);
                    } else if (name.includes('잔디') || name.includes('매장비')) {
                        row.groupType = '매장 및 조경 작업비 (필수)';
                        if (name.includes('매장비')) {
                            name = '시신 안치(매장) 작업 인건비';
                            note = '장례 당일관을 직접 땅에 내리고 흙을 덮는 데 투입되는 전문 인력 작업 비용입니다. (✅ 필수 항목)';
                        } else {
                            note = '봉분 위에 잔디를 예쁘게 입히고 다듬는 조경 작업 비용입니다. (✅ 필수 항목)';
                        }
                        workRows.push(row);
                    }
                    return;
                }
                if (sbt === '단장형' || sbt === '합장형') {
                    row.groupType = '기본 묘역 조성 패키지 (토지 별도)';
                    note = '묘테(테두리돌), 비석, 상석(제사상돌), 향로 등을 설치하는 묘역 조성 기본 공사비 총액입니다. (✅ 필수 항목. 신규 조성 시)';
                    workRows.push(row);
                    return;
                }
                if (st === 'BONGSAN' && name.includes('묘테')) {
                    st = 'BURIAL'; // 묘테 is for BURIAL
                    row.groupType = '봉안묘/묘테 조성 공사비';
                    note = '봉분을 보호하는 돌 테두리(묘테)를 단단하게 설치하는 공사 비용입니다.';
                    workRows.push(row);
                    return;
                }
            }

            // Park 28 (화신공원묘원)
            if (parkId === 'park-0028') {
                if (name.includes('사용료')) {
                    if (name.includes('A형')) grade = '구 4평형 (약 13.2m²)';
                    if (name.includes('B형')) grade = '구 6평형 (약 19.8m²)';
                    if (name.includes('C형')) grade = '구 8평형 (약 26.4m²)';
                    row.groupType = '단순 토지 사용료 (참고용)';
                    note = '토지 분양 시 순수 부지 사용 대금입니다. 공원조성비, 석축 및 조경비가 포함되어 있습니다. (실제 총 구매가는 아래 분양금액 참고)';
                    usageRows.push(row);
                    return;
                }
                if (name.includes('분양금액')) {
                    if (name.includes('A형')) grade = '구 4평형';
                    if (name.includes('B형')) grade = '구 6평형';
                    if (name.includes('C형')) grade = '구 8평형';
                    if (name.includes('D형')) grade = '특수묘 (구 8평형)';
                    row.groupType = '최초 분양 총액 (사용료+관리비+조성비)';
                    note = '묘역을 구획받고 기초 석물과 10년 치 관리비까지 모두 합산된 패키지 형태의 총 분양 가격입니다. (✅ 최초 1회 납부 필수)';
                    usageRows.push(row);
                    return;
                }
                if (st === 'BONGSAN') {
                    row.groupType = '야외 가족 봉안묘 패키지 분양가';
                    note = '토지사용료, 초기 관리비, 야외 돌무덤 형태의 봉안 석물이 모두 포함된 초기 세팅 총합계 금액입니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return;
                }
            }

            // Park 29 (청파묘원)
            if (parkId === 'park-0029') {
                if (name.includes('매장묘 사용료') || name.includes('유골매장묘 사용료')) {
                    row.groupType = '매장 작업 및 사용료 (필수)';
                    note = '간단한 봉분 조성을 포함한 시신/유골 매장 시 필요한 작업비 및 사용 비용입니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return;
                }
                if (name.includes('평장묘지분양') || name.includes('평장안치비')) {
                    row.groupType = '가족 평장묘 분양/안치 (필수)';
                    note = name.includes('안치')
                        ? '평장묘(비석 밑 땅에 화장 유골을 묻는 방식)에 실제 1구를 추가로 모실 때 발생하는 파묘 및 인건비입니다. (✅ 안치 시 필수)'
                        : '여러 기를 모실 수 있는 부지를 사전에 분양받는 총액입니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return;
                }
                if (sbt === '부대시설') {
                    row.groupType = '장례식 편의 시설 (선택)';
                    note = '유가족 대기 및 편의를 위해 장지 현장에서 제공하는 부가 시설 이용 요금입니다. (✅ 선택 항목)';
                    optionRows.push(row);
                    return;
                }
                if (sbt === '석물') {
                    row.groupType = '기본 외 추가/고급 석물 (선택)';
                    note = '장식이나 고인을 기리기 위해 상석(제사상), 비석, 묘테 등을 취향에 맞게 고급형이나 지정된 사이즈로 선택 설치하는 비용입니다. (✅ 선택 항목)';
                    optionRows.push(row);
                    return;
                }
            }

            // Park 30 (풍산공원묘원)
            if (parkId === 'park-0030') {
                if (name.includes('재단운영관리비')) {
                    // It was already caught by maintenance detection, but this replaces the generic note
                    row.note = '묘역 부지 외곽 공용 공간, 진입로 및 재단 자체 운영 명목으로 발생하는 필수 공동 관리 기금입니다. (✅ 15년 단위 선납 필수)';
                    return; // Caught by maintenance logic above, Wait, maintenance logic is ALREADY applied?
                    // if it is pulled, we don't process it down here. Let's fix that.
                }
                if (name === '묘지사용료') {
                    row.groupType = '토지 사용료 기본 단가 (필수)';
                    note = '면적 1m² 기준으로 책정된 부지 자체 분양 단가 비용입니다. (✅ 필수 항목. 총 분양가는 아래 실제 분양가격을 참고하세요.)';
                    usageRows.push(row);
                    return;
                }
                if (sbt === '매장묘' && name.includes('사용료')) {
                    row.groupType = '매장묘 실제 부지 총 분양가';
                    let acres = '';
                    if (row.area) acres = `${row.area}㎡ (약 ${(row.area * 0.3025).toFixed(1)}평) 기준`;
                    note = `[${acres}] 시신을 모시는 전통적인 매장묘의 전체 토지를 구획받기 위한 총 사용료입니다. (✅ 15년 계약 기준 필수)`;
                    usageRows.push(row);
                    return;
                }
                if (st === 'BONGSAN') {
                    row.groupType = '봉안묘 (야외 납골묘) 전체 패키지 분양가';
                    note = '부지 사용료, 15년 치 관리 방습 조경 작업 및 돌 석물 구조 공사가 일체 포함된 완성형 패키지 총합 구매 가격입니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return; // The maintenance check will catch this if it has "관리비". Wait! name="풍산8호(2기)" doesn't say "관리비"!
                }
            }

            // Park 31 (평화묘원)
            if (parkId === 'park-0031') {
                if (name.includes('개장비') || name.includes('매장비')) { // Some "개장비" might mean '파묘 후 재매장' or just an error for '매장비'
                    row.groupType = '매장 관련 파묘 및 작업비 (필수/해당시)';
                    row.name = row.name.replace('개장비', '매장(안치) 작업비');
                    note = '시신이나 유골을 묘역 부지에 안치(파묻음)하기 위해 땅을 파고(파묘) 정리하는 필수 현장 인건비입니다. 합장 시 추가금이 발생합니다. (✅ 안치 시 필수)';
                    workRows.push(row);
                    return;
                }
                if (name === '시설 이용료') {
                    row.groupType = '기타 시설 (선택)';
                    note = '일반 편의시설 외에 매장 작업 시 지정된 특수 장비나 천막 등의 이용 비용을 나타냅니다. (✅ 선택 항목)';
                    optionRows.push(row);
                    return;
                }
                if (st === 'BURIAL' && sbt === '평장묘') {
                    if (name.includes('사용료')) {
                        row.groupType = '가족 평장묘 분양가 (필수)';
                        note = '바닥에 작게 명패만 올려놓는 방식의 자연 친화적 평장묘역 부지 1단위 전체에 대한 분양 총액입니다. (✅ 필수 항목)';
                        usageRows.push(row);
                    }
                    return;
                }
            }

            // Park 32 (호정공원)
            if (parkId === 'park-0032') {
                if (st === 'BURIAL' && sbt === '매장묘') {
                    if (name === '묘지 사용료') {
                        row.groupType = '순수 묘지 부지 사용료 단가 (필수)';
                        note = '[1평 (약 3.3m²) 기준] 매장묘역 구성을 위해 차지하는 토지 면적단가입니다. (✅ 필수 항목)';
                        usageRows.push(row);
                    } else if (name.includes('매장묘 특') || name.includes('단장 매장묘')) {
                        row.groupType = '매장묘 석물 공사 및 기반 작업비 (필수)';
                        note = '토지 위에 단단한 묘테를 두르고 비석, 상석 등을 설치하여 묘역 형태를 제대로 갖추어 공사하는 데 들어가는 총 석재 및 시공비입니다. (안장비는 당일 별도)';
                        workRows.push(row);
                    } else if (name.includes('안장비')) {
                        row.groupType = '장례식 당일 시신/유골 매장 작업비 (필수)';
                        note = '장례 현장에서 관을 직접 땅으로 모시거나(하관), 유골을 매장하기 위해 흙을 파고 덮어 다지는 전문 인부 인건비입니다. (✅ 안치 시 1회 필수)';
                        workRows.push(row);
                    }
                    return;
                }
                if (st === 'BONGSAN') {
                    // Park 32 says "매장묘 1단" in BONGSAN. Let's fix!
                    st = 'BURIAL';
                    row.groupType = '매장묘 복합 공사 세트 (단수형)';
                    note = '묘역을 계단식 1단/2단 등으로 층을 올리고, 대리석 등 석물 기반으로 고급스럽게 조성하는 시공 공사비 전체 금액입니다. (✅ 필수 항목. 안장비는 별도)';
                    workRows.push(row);
                    return;
                }
            }

            // Park 33 (광림공원)
            if (parkId === 'park-0033') {
                if (st === 'BURIAL' && sbt === '매장묘') {
                    row.groupType = '기본 석물 패키지 공사 (선택)';
                    note = '취향에 따라 기본 석물을 더 크고 고급스러운 재질로 등급을 올릴 때 들어가는 석물(돌 구조물) 시공 자재비입니다. (석물 종류에 따라 변동 가능. ✅ 선택 항목)';
                    optionRows.push(row);
                    return;
                }
                if (st === 'BONGSAN') { // Has 매장묘 단장 대지사용료 in BONGSAN group.
                    st = 'BURIAL';
                    row.groupType = '단지(위치)별 대지 분양 사용료 (필수)';
                    note = '햇볕이 잘 들거나 접근이 용이한 프리미엄 단지에 따라 부지 가격이 다릅니다. 이 비용은 순수 토지 점유 분양 대금입니다. (✅ 필수 항목)';
                    usageRows.push(row);
                    return;
                }
            }

            // Park 34 (삼척시추모공원)
            if (parkId === 'park-0034') {
                if (name.includes('사용료')) {
                    if (grade.includes('국가')) {
                        row.groupType = '국가유공자/수급자 감면 부지 (필수)';
                        note = '법령에 따라 1종 수급자 및 국가유공자로 증명된 분들을 위한 감면 부지 사용 혜택 건입니다. 일반 사용료는 면제(0원)됩니다.';
                    } else {
                        row.groupType = '면적별 부지 사용료 (필수)';
                        note = '시립·공설 공원이기 때문에 저렴하게 제공되는 토지 구획 자체 분양 원가(사용료)입니다. (✅ 30년 단위 계약 기준 필수)';
                    }
                    usageRows.push(row);
                    return;
                }
                if (name.includes('매장비')) {
                    row.groupType = '공설 묘역 매장(하관) 작업비 (필수)';
                    row.name = row.name.replace('매장비', '시신 매장(파묘 및 안치) 인건비');
                    note = '장례식 당일, 관을 땅 속에 안치하기 위해 포크레인 및 묘지 전문 인부가 땅을 파거나 흙을 덮는 데 드는 공단 인건비입니다. (동절기 언 땅 작업 시 할증 주의. ✅ 안치 시 필수)';
                    workRows.push(row);
                    return;
                }
                if (name.includes('석물비')) {
                    row.groupType = '기본 규격 석물 구매 및 설치 (선택)';
                    note = '시립 묘지 규격에 맞춰 제작된 비석 및 테두리 돌을 시공하는 비용입니다. (일반 화강암 대비 오석-검고 빛나는 돌-이 더 비쌉니다. ✅ 선택 항목)';
                    optionRows.push(row);
                    return;
                }
            }

            // Fallback for anything not caught
            row.groupType = row.groupType || '일반 항목';
            usageRows.push(row);
        });

        const combined = [...usageRows, ...workRows, ...optionRows, ...maintenanceRows];
        if (combined.length > 0) {
            newPrices.push({
                serviceType: st,
                subType: sbt,
                unit: group.unit || '원',
                rows: combined
            });
        }
    });

    return newPrices;
}

const preparedPayload = [];
for (const id of targetIds) {
    const idx = facilitiesData.findIndex(f => f.id === id);
    if (idx !== -1 && facilitiesData[idx].priceInfo && facilitiesData[idx].priceInfo.standardizedPrices) {
        let fData = facilitiesData[idx];
        fData.priceInfo.standardizedPrices = refinePrices(id, fData.priceInfo.standardizedPrices);
        preparedPayload.push(fData);
    }
}

// 2. Save modified to file
fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2), 'utf8');
console.log(`Saved ${preparedPayload.length} updated facilities to data/facilities.json`);

// 3. Resync via API POST to localhost:3000
async function sync() {
    try {
        console.log(`Posting ${preparedPayload.length} facilities to Admin API...`);
        const fetch = require('node-fetch') || globalThis.fetch;
        const res = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preparedPayload)
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Bulk API Sync Success:', data);
        } else {
            const err = await res.text();
            console.error('API Sync Failed:', err);
        }
    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

sync();
