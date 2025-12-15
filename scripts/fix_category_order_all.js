const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 올바른 카테고리 순서 정의
const CORRECT_ORDER = {
    '기본비용': 0,
    '매장묘': 1,
    '봉안묘': 2,
    '봉안당': 3,
    '수목장': 4,
    '기타': 5
};

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  전체 시설 카테고리 순서 재정렬');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 가격 데이터가 있는 모든 시설
    const facilities = await prisma.facility.findMany({
        where: {
            priceCategories: {
                some: {}
            }
        },
        include: {
            priceCategories: true
        },
        orderBy: { id: 'asc' }
    });

    console.log(`총 ${facilities.length}개 시설 처리 중...\n`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const facility of facilities) {
        try {
            let needsFix = false;

            // 현재 순서 확인
            for (const cat of facility.priceCategories) {
                const correctOrder = CORRECT_ORDER[cat.name] ?? 5; // 기타로 처리
                if (cat.orderNo !== correctOrder) {
                    needsFix = true;
                    break;
                }
            }

            if (needsFix) {
                // 순서 재정렬
                for (const cat of facility.priceCategories) {
                    const correctOrder = CORRECT_ORDER[cat.name] ?? 5;
                    await prisma.priceCategory.update({
                        where: { id: cat.id },
                        data: { orderNo: correctOrder }
                    });
                }

                fixedCount++;

                if (fixedCount <= 10) {
                    const oldOrder = facility.priceCategories
                        .sort((a, b) => a.orderNo - b.orderNo)
                        .map(c => c.name)
                        .join(' → ');

                    const newOrder = facility.priceCategories
                        .map(c => ({ name: c.name, order: CORRECT_ORDER[c.name] ?? 5 }))
                        .sort((a, b) => a.order - b.order)
                        .map(c => c.name)
                        .join(' → ');

                    console.log(`✅ ${facility.name} (${facility.id})`);
                    console.log(`   변경 전: ${oldOrder}`);
                    console.log(`   변경 후: ${newOrder}\n`);
                }
            }
        } catch (error) {
            console.error(`❌ ${facility.name}: ${error.message}`);
            errorCount++;
        }
    }

    if (fixedCount > 10) {
        console.log(`   ... 그 외 ${fixedCount - 10}개 시설 수정\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 수정: ${fixedCount}개`);
    console.log(`⚪ 정상: ${facilities.length - fixedCount - errorCount}개`);
    console.log(`❌ 오류: ${errorCount}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
})();
