const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
    console.log('=== 1~3번 시설 데이터 삭제 ===\n');

    const facilityIds = ['park-0001', 'park-0002', 'park-0003'];

    for (const id of facilityIds) {
        // PriceItem 삭제 (cascade로 자동 삭제되지만 명시적으로)
        const deletedItems = await prisma.priceItem.deleteMany({
            where: { facilityId: id }
        });

        // PriceCategory 삭제
        const deletedCategories = await prisma.priceCategory.deleteMany({
            where: { facilityId: id }
        });

        console.log(`${id}: ${deletedCategories.count}개 카테고리, ${deletedItems.count}개 항목 삭제`);
    }

    console.log('\n✅ 삭제 완료!');

    await prisma.$disconnect();
})();
