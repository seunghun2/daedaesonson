const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

console.log('=== 1~10번 카테고리 분류 검증 ===\n');

const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const issues = [];

for (let i = 0; i < 10; i++) {
    const facility = facilities[i];
    const num = i + 1;

    console.log(`━━━ ${num}. ${facility.name} ━━━`);

    const priceTable = facility.priceInfo?.priceTable || {};
    const categories = Object.keys(priceTable);

    console.log(`카테고리: ${categories.join(', ')}`);

    // 각 카테고리의 항목 샘플 출력
    categories.forEach(cat => {
        const rows = priceTable[cat].rows || [];
        console.log(`\n[${cat}] ${rows.length}개`);

        // 처음 5개 항목명 출력
        rows.slice(0, 5).forEach(r => {
            console.log(`  - ${r.name} (${r.price.toLocaleString()}원)`);
        });

        if (rows.length > 5) {
            console.log(`  ... 외 ${rows.length - 5}개`);
        }

        // 의심스러운 항목 체크
        rows.forEach(r => {
            const name = r.name.toLowerCase();

            // 기본비용에 있으면 안 되는 것들
            if (cat === '기본비용') {
                if (name.includes('매장') || name.includes('봉안') || name.includes('석물') || name.includes('비석')) {
                    issues.push({
                        facility: num,
                        category: cat,
                        item: r.name,
                        problem: '기본비용에 시설/석물 항목이 들어감'
                    });
                }
            }

            // 매장시설에 석물이 들어간 경우
            if (cat === '매장시설') {
                if (name.includes('상석') || name.includes('비석') || name.includes('둘레석')) {
                    issues.push({
                        facility: num,
                        category: cat,
                        item: r.name,
                        problem: '매장시설에 석물 항목이 들어감'
                    });
                }
            }

            // 석물_작업비에 시설 사용료가 들어간 경우
            if (cat === '석물_작업비') {
                if (name.includes('사용료') && !name.includes('작업')) {
                    issues.push({
                        facility: num,
                        category: cat,
                        item: r.name,
                        problem: '석물/작업비에 사용료가 들어감'
                    });
                }
            }
        });
    });

    console.log('\n');
}

if (issues.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  발견된 문제:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue.facility}번 시설`);
        console.log(`   카테고리: ${issue.category}`);
        console.log(`   항목: ${issue.item}`);
        console.log(`   문제: ${issue.problem}`);
        console.log('');
    });
} else {
    console.log('✅ 문제 없음!');
}

// 결과 저장
fs.writeFileSync(
    path.join(__dirname, '../validation_report.json'),
    JSON.stringify({ issues }, null, 2)
);

console.log(`총 ${issues.length}개 문제 발견`);
