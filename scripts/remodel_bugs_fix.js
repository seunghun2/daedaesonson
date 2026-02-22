require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const facilitiesPath = path.resolve(__dirname, '../data/facilities.json');
let facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

async function updatePark(parkId, applyChanges) {
    const parkIndex = facilitiesData.findIndex(f => f.id === parkId);
    if (parkIndex === -1) {
        console.error(`Park ${parkId} not found`);
        return;
    }

    let pData = facilitiesData[parkIndex];
    let newPrices = applyChanges(JSON.parse(JSON.stringify(pData.priceInfo.standardizedPrices)));

    const { error } = await supabase.from('Facility').update({ pricing: { standardizedPrices: newPrices } }).eq('id', parkId);
    if (error) {
        console.error(`Error updating ${parkId}:`, error);
    } else {
        console.log(`${parkId} updated successfully!`);
        facilitiesData[parkIndex].priceInfo.standardizedPrices = newPrices;
        fs.writeFileSync(facilitiesPath, JSON.stringify(facilitiesData, null, 2));
    }
}

async function runAll() {
    // ----------------------------------------
    // PARK 19 Fix: "기타안나오고 오류 있음"
    // Reason: React duplicate key constraint broken because multiple products had the same name "오석" etc.
    // Solution: Append grade to name to ensure uniqueness and clear info.
    // ----------------------------------------
    await updatePark('park-0019', (prices) => {
        prices.forEach(group => {
            if (group.serviceType === 'OTHER') {
                group.subType = '부가 시설물 (석물/비석)';
                group.rows.forEach(row => {
                    // Fix duplicate names
                    if (row.grade) {
                        row.name = `${row.name} (${row.grade})`;
                    }

                    if (row.name.includes('애석')) {
                        row.groupType = '비석 - 애석 (회색/컬러화강암)';
                        row.note = '밝은 회색 등 자연스러운 색감을 띠는 돌망치 비석 재질입니다. \\n✅ [포함 내역: 자재 및 설치비용]';
                    } else if (row.name.includes('오석')) {
                        row.groupType = '비석 - 오석 (검은색 화강암)';
                        row.note = '글씨가 뚜렷하게 보이며 고급스러운 검은색이 특징인 비석입니다. \\n✅ [포함 내역: 자재 및 설치비용]';
                    } else if (row.name.includes('향로') || row.name.includes('화병')) {
                        row.groupType = '제례용품 (향로/화병)';
                        row.note = '제사를 지낼 때 향을 피우거나 헌화용 꽃을 꽂아두기 위해 제단에 설치하는 석물입니다. \\n✅ [포함 내역: 자재 및 설치비용]';
                    } else if (row.name.includes('서구식')) {
                        row.groupType = '묘테 (서구식 평장형 디자인)';
                        row.note = '봉분을 높이 쌓지 않고, 기독교 및 서양식 묘지처럼 낮고 평평하게 대리석을 까는 세련된 디자인입니다. \\n✅ [포함 내역: 자재 및 시공비용]';
                    } else if (row.name.includes('원형둘레석')) {
                        row.groupType = '묘테 (원형 둘레석)';
                        row.note = '동그랗게 쌓은 흙(봉분)이 무너지지 않고 깔끔하게 유지되도록 테두리를 둘러싸는 돌(묘테)입니다. \\n✅ [포함 내역: 자재 및 시공비용]';
                    }
                });
            } else {
                // Add robust notes to Burial rows too, to match our standard style
                group.rows.forEach(row => {
                    const existingNote = row.note || '';
                    if (!existingNote.includes('포함 내역')) {
                        row.note = existingNote + (existingNote ? ' \\n' : '') + '✅ [포함 내역: 묘지 사용료 + 묘지조성 및 석물비용 + 최초 5년 관리비]';
                    }
                });
            }
        });
        return prices;
    });

    // ----------------------------------------
    // PARK 21 Fix: "기타 탭이 뭐가뭔지 모름"
    // Reason: All "단장", "합장" merged to "부가 항목" without specific group distinction in name
    // ----------------------------------------
    await updatePark('park-0021', (prices) => {
        // Restoring proper names for OTHER category by mapping specific prices since subType is gone
        prices.forEach(group => {
            if (group.serviceType === 'OTHER') {
                group.subType = '기타 부가 비용';
                group.rows.forEach(row => {
                    if (row.price === 480000 && row.name.includes('단장')) {
                        row.name = '매장 작업비 (단장)';
                        row.groupType = '매장 작업비';
                        row.note = '매장 작업비 : 시신을 매장할 때 발생하는 인건비 및 장비 사용료입니다. (단장 기준) \\n✅ [단장 묘역 매장 시 1회 부과]';
                    } else if (row.price === 580000 && row.name.includes('합장')) {
                        row.name = '매장 작업비 (합장)';
                        row.groupType = '매장 작업비';
                        row.note = '매장 작업비 : 부부를 함께 모시는 합장 시 발생하는 인건비 및 장비 사용료입니다. \\n✅ [합장 묘역 매장 시 1회 부과]';
                    } else if (row.price === 100000 && row.name.includes('단장')) {
                        row.name = '석물 설치비 (단장)';
                        row.groupType = '석물 설치 인건비';
                        row.note = '석물 설치비 : 상석, 향로 등 기본 석물을 묘역에 설치할 때 발생하는 인건비입니다. (단장) \\n✅ [설치 시 1회 부과]';
                    } else if (row.price === 100000 && row.name.includes('합장')) {
                        row.name = '석물 설치비 (합장)';
                        row.groupType = '석물 설치 인건비';
                        row.note = '석물 설치비 : 상석, 향로 등 석물을 묘역에 설치할 때 발생하는 인건비입니다. (합장) \\n✅ [설치 시 1회 부과]';
                    } else if (row.price === 1129000 && row.name.includes('단장')) {
                        row.name = '석물 자재비 (단장)';
                        row.groupType = '석물 자재 (구매비용)';
                        row.note = '석물 자재비 : 비석, 상석 등 묘를 꾸미는 데 필요한 돌로 만든 시설물 전체의 자재비용입니다. \\n✅ [단장 묘역 기준 기본 석물 일체]';
                    } else if (row.price === 1366000 && row.name.includes('합장')) {
                        row.name = '석물 자재비 (합장)';
                        row.groupType = '석물 자재 (구매비용)';
                        row.note = '석물 자재비 : 부부 묘역을 꾸미기 위한 비석, 상석 등 석물 전체 자재비용입니다. \\n✅ [합장 묘역 기준 기본 석물 일체]';
                    }
                });
            } else {
                group.rows.forEach(row => {
                    if (row.groupType === '단장' || row.groupType === '합장') {
                        if (!row.note) row.note = '';
                        if (row.name === '사용료' && !row.note.includes('포함 내역')) {
                            row.note = row.note + ' \\n✅ [포함 내역: 순수 묘지 공간 (토지) 사용 권한]';
                        }
                    } else if (group.subType === '봉안시설') {
                        if (row.name === '사용료') {
                            row.note = row.note + ' \\n✅ [포함 내역: 봉안시설 안치 공간 사용 권한 (관리비 별도)]';
                        }
                    }
                });
            }
        });
        return prices;
    });

    // ----------------------------------------
    // PARK 22 Fix: "단장묘 합장표 매장사용료 합쳐짐 / 의미없는거 삭제 / 봉분 설치비용 별도"
    // ----------------------------------------
    await updatePark('park-0022', (prices) => {
        let newPrices = [];

        prices.forEach(group => {
            if (group.serviceType === 'BURIAL') {
                const danjangRows = [];
                const hapjangRows = [];

                group.rows.forEach(row => {
                    // Ignore these explicitly as requested by user
                    if (row.name.includes('99년 이후') || row.name.includes('99년 이전')) {
                        return;
                    }
                    if (row.groupType === '단장묘') {
                        row.note = '매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다. \\n✅ [포함 내역: 매장 토지 사용료]\\n🚨 [안내: 봉분 설치(조성) 비용 및 석물 비용은 별도 입니다.]';
                        danjangRows.push(row);
                    }
                    if (row.groupType === '합장묘') {
                        row.note = '넓은 공간에 부부를 함께 모시는 합장 형태의 묘지입니다. \\n✅ [포함 내역: 매장 토지 사용료]\\n🚨 [안내: 봉분 설치(조성) 비용 및 석물 비용은 별도 입니다.]';
                        hapjangRows.push(row);
                    }
                });

                if (danjangRows.length > 0) {
                    newPrices.push({
                        serviceType: 'BURIAL',
                        subType: '매장 (단장묘)',
                        unit: '원',
                        rows: danjangRows
                    });
                }
                if (hapjangRows.length > 0) {
                    newPrices.push({
                        serviceType: 'BURIAL',
                        subType: '매장 (합장묘)',
                        unit: '원',
                        rows: hapjangRows
                    });
                }
            } else {
                // OTHER items logic
                group.rows.forEach(row => {
                    if (!row.note) row.note = '';
                    if (!row.note.includes('안내:')) {
                        row.note = row.note + (row.note ? ' / ' : '') + '✅ [별도의 부가 시설 비용입니다.]';
                    }
                });
                newPrices.push(group);
            }
        });
        return newPrices;
    });

    // ----------------------------------------
    // PARK 23 Fix: Add rich descriptions
    // ----------------------------------------
    await updatePark('park-0023', (prices) => {
        prices.forEach(group => {
            group.rows.forEach(row => {
                if (group.subType === '매장묘' && row.name === '토지사용료') {
                    row.note = '1기당 / 매장묘 : 화장하지 않은 시신을 관째로 모시는 전통적인 묘지 방식입니다.\\n✅ [포함 내역: 순수 매장 공간 사용 권한 (조성비, 안장비 별도)]';
                } else if (group.subType === '평장묘' && row.name === '토지사용료') {
                    row.note = '1기당 / 평장묘 : 화장한 유골을 땅에 묻고 작고 얕은 비석만 올리는 깔끔한 방식입니다.\\n✅ [포함 내역: 평장 잔디역 사용 권한 (조성비, 안장비 별도)]';
                } else if (group.subType === '수목장' && row.name === '토지사용료') {
                    row.note = '1기당 / 수목장 : 지정된 추모목 주변에 유골을 묻어 자연과 함께하는 친환경 장법입니다.\\n✅ [포함 내역: 주변 묘역 사용 권한 (수목조성비, 안장비 별도)]';
                } else if (row.feeType === 'MAINTENANCE') {
                    row.note = '묘역을 깔끔하게 유지/관리하기 위해 매년 발생하는 필수 운영비입니다. (' + row.note + ')';
                } else if (row.name === '안장비' || row.name === '조성비' || row.name === '수목조성비') {
                    row.note = row.note + ' / 묘를 꾸미고 시신이나 유골을 온전하게 모시는 데 들어가는 실제 작업/설치 비용입니다.';
                } else if (group.serviceType === 'OTHER') {
                    row.note = row.note + (row.note ? ' / ' : '') + '필요 시 추가하실 수 있는 장례/제례 용품입니다.';
                }
            });
        });
        return prices;
    });

}

runAll().then(() => {
    console.log('All updates complete.');
});
