const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #1-#10 전체 검증');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const CORRECT_ORDER = ['기본비용', '매장묘', '봉안묘', '봉안당', '수목장', '기타'];

    for (let i = 1; i <= 10; i++) {
        const id = `park-${String(i).padStart(4, '0')}`;

        const facility = await prisma.facility.findUnique({
            where: { id },
            include: {
                priceCategories: {
                    include: { priceItems: true },
                    orderBy: { orderNo: 'asc' }
                }
            }
        });

        if (!facility) {
            console.log(`❌ ${id}: 시설 없음\n`);
            continue;
        }

        // 카테고리 순서 검증
        const catNames = facility.priceCategories.map(c => c.name);
        const expectedOrder = CORRECT_ORDER.filter(c => catNames.includes(c));

        let orderOk = true;
        for (let j = 0; j < catNames.length; j++) {
            if (catNames[j] !== expectedOrder[j]) {
                orderOk = false;
                break;
            }
        }

        // 미분류 항목 개수
        let ungroupedCount = 0;
        facility.priceCategories.forEach(cat => {
            cat.priceItems.forEach(item => {
                if (!item.groupType || item.groupType === '미분류') {
                    ungroupedCount++;
                }
            });
        });

        const statusIcon = orderOk ? '✅' : '❌';
        const warning = ungroupedCount > 0 ? ` ⚠️ 미분류 ${ungroupedCount}개` : '';

        console.log(`${statusIcon} ${facility.name} (${id})`);
        console.log(`   카테고리: ${catNames.join(' → ')}${warning}`);

        if (!orderOk) {
            console.log(`   ❌ 예상 순서: ${expectedOrder.join(' → ')}`);
        }

        // 카테고리별 세부 정보
        facility.priceCategories.forEach(cat => {
            const groups = {};
            cat.priceItems.forEach(item => {
                const g = item.groupType || '미분류';
                if (!groups[g]) groups[g] = 0;
                groups[g]++;
            });
            const groupStr = Object.entries(groups).map(([g, c]) => `${g}(${c})`).join(', ');
            console.log(`     - ${cat.name}: ${cat.priceItems.length}개 [${groupStr}]`);
        });

        console.log('');
    }

    await prisma.$disconnect();
})();
