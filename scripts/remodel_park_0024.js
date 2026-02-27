require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

// Find Park 24
const parkIndex = facilitiesData.findIndex(f => f.id === 'park-0024');
if (parkIndex === -1) {
    console.error('Park 24 not found');
    process.exit(1);
}

let parkData = facilitiesData[parkIndex];
let prices = JSON.parse(JSON.stringify(parkData.priceInfo.standardizedPrices));

// 1. Rewrite Park 24 prices
let newPrices = [];
prices.forEach(group => {
    if (group.serviceType === 'BURIAL') {
        const usageRows = [];
        const maintenanceRows = [];
        const workRows = [];

        group.rows.forEach(row => {
            if (row.name.includes('토지사용료')) {
                row.grade = '평당';
                row.groupType = '토지 분양 및 기본 매장 작업비 (필수)';
                row.note = '매장묘 조성에 필요한 토지 사용 비용입니다. (✅ 15년 단위로 계약 및 별도 연장 갱신 필요)';
                row.feeType = 'USAGE';
                usageRows.push(row);
            } else if (row.name.includes('관리비')) {
                row.grade = '평당 (1년)';
                row.groupType = '묘역 공동 관리비';
                row.note = '벌초, 진입로 및 외곽 조경 유지보수 등 묘역 전체 관리를 위해 발생하는 비용입니다. (✅ 필수 항목)';
                row.feeType = 'MAINTENANCE';
                row.duration = 1;
                row.durationType = 'YEAR';
                maintenanceRows.push(row);
            } else if (row.name.includes('재래식유골매장비')) {
                row.grade = '합장 1기당';
                row.name = '재래식 유골 매장비';
                row.groupType = '추가 작업비 (해당 시)';
                row.note = '화장하지 않은 시신을 묻은 후, 오랜 시간이 지나 남은 뼈(유골)를 다시 모아 매장하는 전통 방식의 합장 시 발생하는 재작업 인건비입니다. (✅ 해당되는 경우에 한함)';
                row.feeType = 'USAGE';
                workRows.push(row);
            } else if (row.name === '시신매장작업비') {
                row.grade = '1기당';
                row.name = '시신 매장 작업비';
                row.groupType = '토지 분양 및 기본 매장 작업비 (필수)';
                row.note = '화장하지 않은 시신을 관째로 매장(안치)할 때 발생하는 인부들의 필수 작업 인건비입니다. (✅ 최초 1회, 1기 기준)';
                row.feeType = 'USAGE';
                workRows.push(row);
            } else if (row.name === '유골매장작업비') {
                row.grade = '합장 1기당';
                row.name = '유골 매장 작업비';
                row.groupType = '추가 매장 작업비';
                row.note = '이미 시신(관)이 모셔져 있는 기존 합장묘역에 유골(화장한 뼈)을 추가로 매장할 때 발생하는 작업 인건비입니다. (✅ 합장 1기 기준)';
                row.feeType = 'USAGE';
                workRows.push(row);
            } else if (row.name === '분상보수작업비') {
                row.grade = '평당';
                row.name = '분묘 보수 작업비';
                row.groupType = '추가 작업비 (해당 시)';
                row.note = '시간이 오래 지나 깎이거나 무너진 봉분(무덤 형태 흙)을 다시 쌓아 올리고 다듬는 형태 복원 작업비용입니다.';
                row.feeType = 'USAGE';
                workRows.push(row);
            } else if (row.name === '축대작업비') {
                row.grade = '평당';
                row.name = '봉분 축대 공사비';
                row.groupType = '추가 작업비 (해당 시)';
                row.note = '가파른 묘역 주변 흙이 무너지지 않도록 돌이나 시멘트로 단단한 지지대(축대)를 보강 설치하는 조경 공사 인건비입니다.';
                row.feeType = 'USAGE';
                workRows.push(row);
            }
        });

        // Push rows separately if they exist
        if (usageRows.length > 0 || maintenanceRows.length > 0 || workRows.length > 0) {
            newPrices.push({
                serviceType: 'BURIAL',
                subType: '매장묘 기본 비용 및 작업비',
                unit: '원',
                rows: [...usageRows, ...maintenanceRows, ...workRows]
            });
        }
    } else if (group.serviceType === 'OTHER') {
        const repairRows = [];
        const purchaseRows = [];

        group.subType = '석물 설치 및 부가 시설물'; // To avoid filtering

        group.rows.forEach(row => {
            if (row.name.includes('석물재조리비')) row.name = '석물 재조립비';

            if (row.name.includes('재조립')) {
                row.name = row.name.replace('석물재조립비', '기존 석물 재조립 작업');
                // grade already has the description, let's clean it up
                if (row.grade === '1단 특묘테') row.grade = '특묘테(1단)';
                if (row.grade === '2단 합장묘테') row.grade = '합장묘테(2단)';
                if (row.grade === '3단묘테') row.grade = '일반묘테(3단)';
                if (row.grade === '화강둘레석') row.grade = '화강석 재질 둘레석';

                row.groupType = '기존 묘역 재정비 (해당 시)';
                row.note = '이미 설치된 묘테(봉분 둘레석) 등의 단단한 구조물을 해체한 뒤 추가 작업(합장 등) 후 다시 안전하게 조립 설치하는 공사 비용입니다.';
                repairRows.push(row);
            } else {
                // Purchases
                let readableGrade = row.grade;
                let addNote = '묘역 조성을 위해 선택적으로 구매하여 설치하는 추가 석물 자재 구조물입니다.';

                if (row.name === '묘테' && row.grade.includes('1단(합장)/화강석/중국')) {
                    row.name = '묘테 (봉분 보호석) [1단 합장형]';
                    readableGrade = '중국산 단단한 화강석';
                } else if (row.name === '묘테' && row.grade.includes('2단(합장)/화강석/중국')) {
                    row.name = '묘테 (봉분 보호석) [2단 합장형]';
                    readableGrade = '중국산 단단한 화강석';
                    addNote = '1단보다 높게 쌓아올려 흙 무너짐을 방지하고 장엄함을 더하는 2단형 보호석 구조물입니다.';
                } else if (row.name === '상석') {
                    row.name = '상석 (제사용 탁자)';
                    readableGrade = '2.5자 규격 / 중국산 화강석';
                    addNote = '제사나 절을 할 때 술잔과 제사 음식을 올려놓는 넓고 평평한 돌로 만들어진 필수급 제단입니다.';
                } else if (row.name === '화석분(꽃병)') {
                    row.name = '향로 및 돌꽃병 세트';
                    readableGrade = '1세트(2개) / 화강석제';
                    addNote = '상석 측면에 배치하여 제사 시 향을 꽂는 향로와 헌화용 생화/조화를 담아두는 돌로 조각된 견고한 꽃병입니다.';
                } else if (row.name === '비석' && row.grade.includes('2.5/오석비석')) {
                    row.name = '비석 [고급 오석 재질]';
                    readableGrade = '2.5자 규격 (세로형)';
                    addNote = '고인의 성함과 본관, 업적 등을 먹의 광택이 감도는 단단한 검은돌(오석)에 새겨 세우는 무덤 앞 기념비입니다.';
                } else if (row.name === '비석' && row.grade.includes('3.0/오석비석')) {
                    row.name = '비석 [고급 오석 재질]';
                    readableGrade = '3.0자 규격 (세로형)';
                    addNote = '고인의 성함과 본관, 업적 등을 먹의 광택이 감도는 단단한 검은돌(오석)에 새겨 세우는 무덤 앞 넓고 큰 크기의 기념비입니다.';
                } else if (row.name === '비석' && row.grade.includes('2.0/오석와비')) {
                    row.name = '와비 (눕힌 비석)';
                    readableGrade = '2.0자 규격 (오석 재질)';
                    addNote = '현대식 묘역에 주로 사용되며 시야를 가리지 않게 비스듬히 눕혀 설치하는 세련된 검은 돌 형태의 비석입니다.';
                } else if (row.name === '비석' && row.grade.includes('2.3/오석와비')) {
                    row.name = '와비 (눕힌 비석)';
                    readableGrade = '2.3자 규격 (오석 재질)';
                    addNote = '현대식 묘역에 주로 사용되며 시야를 가리지 않게 비스듬히 눕혀 설치하는 세련된 검은 돌 형태의 비석입니다.';
                } else if (row.name === '비석' && row.grade.includes('2.5/오석와비')) {
                    row.name = '와비 (눕힌 비석)';
                    readableGrade = '2.5자 규격 (오석 재질)';
                    addNote = '현대식 묘역에 주로 사용되며 시야를 가리지 않게 비스듬히 눕혀 설치하는 세련된 검은 돌 형태의 비석입니다.';
                } else if (row.name === '비석' && row.grade.includes('1.8/평오석와비')) {
                    row.name = '평와비 (바닥형 눕힌 비석)';
                    readableGrade = '1.8자 규격 (오석 재질)';
                    addNote = '평장묘역(봉분 없이 지면과 평평하게 묻는 방식)에서 지면에 납작하게 밀착시켜 설치하는 작고 깔끔한 형태의 표지석입니다.';
                } else if (row.name === '평장형묘테') {
                    row.name = '평장형 전용 묘테';
                    readableGrade = '1단 묘테 (가로100cm)';
                    addNote = '봉분을 높이지 않는 평장 방식으로 모실 때 묘역의 단정한 구획을 나누기 위해 바닥을 얇게 두르는 테두리 돌입니다.';
                }

                row.grade = readableGrade;
                row.groupType = '신규 석물 구매 및 조경 설치 (선택)';
                row.note = addNote;
                purchaseRows.push(row);
            }
        });

        if (repairRows.length > 0 || purchaseRows.length > 0) {
            newPrices.push({
                serviceType: 'OTHER',
                subType: '석물 설치 및 부가 시설물', // safe name
                unit: '원',
                rows: [...purchaseRows, ...repairRows]
            });
        }
    } else {
        newPrices.push(group);
    }
});

parkData.priceInfo.standardizedPrices = newPrices;

// Save to disk
fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2), 'utf8');
console.log('Saved data to data/facilities.json for Park-0024');

// Execute POST to API
async function postToApi() {
    try {
        console.log('Posting Park-0024 to API...');
        const fetch = require('node-fetch') || globalThis.fetch;
        const res = await fetch('http://localhost:3000/api/facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([parkData])
        });

        if (res.ok) {
            const data = await res.json();
            console.log('API Sync Success:', data);
        } else {
            const err = await res.text();
            console.error('API Sync Failed:', err);
        }
    } catch (e) {
        console.error('API Call Error:', e);
    }
}

postToApi();
