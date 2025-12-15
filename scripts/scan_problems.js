const fs = require('fs');
const CSV_FILE = 'data/pricing_all.csv';

(async () => {
    if (!fs.existsSync(CSV_FILE)) return;

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');

    console.log("=== 잠재적 오류 항목 검사 리포트 (row > 0) ===");
    console.log("조건: 이름이 너무 길거나(>30자), 이름에 쉼표/물결표 포함, 기본비용인데 고가(>200만), 설명이 이름과 중복");

    let count = 0;
    lines.forEach((line, idx) => {
        if (idx === 0) return;
        const cols = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        if (cols.length < 6) return;

        const id = cols[0];
        const name = cols[1];
        const category = cols[2];
        const itemName = cols[3].replace(/^"|"$/g, '');
        const price = parseInt(cols[4] || '0', 10);
        const rawText = cols[5] ? cols[5].replace(/^"|"$/g, '') : '';

        const warnings = [];

        // 1. 이름이 평범하지 않게 김
        if (itemName.length > 30) warnings.push(`긴 이름(${itemName.length}자)`);

        // 2. 이름에 특수문자 (쉼표, 물결표, 등호, 플러스) - 파싱 덜 된 증거
        if (/[~=+,]/.test(itemName)) warnings.push(`특수문자 포함(${itemName.match(/[~=+,]/)[0]})`);

        // 3. 기본비용인데 매우 비쌈 (관리비, 사용료가 500만원 넘는건 드묾 - 물론 30년치면 가능하지만)
        // 임의 기준 500만원
        if (category === '기본비용' && price > 5000000) warnings.push(`고가 기본비용(${price})`);

        // 4. 이름과 설명이 정확히 일치 (설명이 부실함)
        if (itemName === rawText && itemName.length > 5) warnings.push(`이름/설명 중복`);

        if (warnings.length > 0) {
            console.log(`[Line ${idx + 1}] [${id} ${name}] ${itemName} : ${warnings.join(', ')}`);
            count++;
            if (count > 50) { // 너무 많이 찍히면 중단
                console.log("... (50개 초과 생략)");
                return;
            }
        }
    });

    if (count === 0) console.log("특이사항 발견되지 않음.");
})();
