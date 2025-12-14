const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const DATA_DIR = path.join(__dirname, '../data');
const FILES = [
    'pricing_cemetery.csv',
    'pricing_cremation.csv',
    'pricing_enshrinement.csv',
    'pricing_natural.csv'
];

function getNum(idStr) {
    if (!idStr) return 999999;
    const match = idStr.match(/park-(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
}

function run() {
    console.log('🔄 Calculating Combined Missing IDs...\n');

    const allIds = new Set();
    let fileRanges = [];

    FILES.forEach(filename => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            const ids = parsed.data.map(r => getNum(r.ParkID)).filter(n => n !== 999999);

            ids.forEach(id => allIds.add(id));

            if (ids.length > 0) {
                const min = Math.min(...ids);
                const max = Math.max(...ids);
                fileRanges.push({ name: filename, min, max, count: ids.length });
            }
        }
    });

    // 전체 통계
    const sortedIds = Array.from(allIds).sort((a, b) => a - b);

    if (sortedIds.length === 0) {
        console.log('No IDs found.');
        return;
    }

    const minId = 1; // 1번부터라고 가정
    const maxId = sortedIds[sortedIds.length - 1]; // 실제 존재하는 가장 큰 번호

    const missingIds = [];
    for (let i = minId; i <= maxId; i++) {
        if (!allIds.has(i)) {
            missingIds.push(i);
        }
    }

    console.log(`✅ 통합 분석 결과 (1번 ~ ${maxId}번)`);
    console.log(`- 가격 정보가 존재하는 시설 수: ${allIds.size}개`);
    console.log(`- **누락된 번호(결번) 총 개수**: **${missingIds.length}개**`);
    console.log('--------------------------------------------------');

    // 주요 결번 구간 분석
    // 연속된 결번을 묶어서 보여줌
    let ranges = [];
    if (missingIds.length > 0) {
        let start = missingIds[0];
        let prev = missingIds[0];

        for (let i = 1; i < missingIds.length; i++) {
            if (missingIds[i] !== prev + 1) {
                ranges.push(start === prev ? `${start}` : `${start}~${prev}`);
                start = missingIds[i];
            }
            prev = missingIds[i];
        }
        ranges.push(start === prev ? `${start}` : `${start}~${prev}`);
    }

    console.log('❌ 주요 결번 구간 (비어있는 번호들):');
    if (ranges.length > 20) {
        console.log(ranges.slice(0, 20).join(', '));
        console.log(`... 외 ${ranges.length - 20}개 구간`);
    } else {
        console.log(ranges.join(', '));
    }
}

run();
