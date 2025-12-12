const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
    console.log('=== 낙원추모공원 사용료 추가 ===\n');

    // 기본비용 카테고리 찾기
    const basicCategory = await prisma.priceCategory.findFirst({
        where: {
            facilityId: 'park-0001',
            name: '기본비용'
        }
    });

    if (!basicCategory) {
        console.log('❌ 기본비용 카테고리를 찾을 수 없습니다.');
        await prisma.$disconnect();
        return;
    }

    console.log(`✅ 기본비용 카테고리 ID: ${basicCategory.id}`);

    // 사용료 추가
    const usageFee = await prisma.priceItem.create({
        data: {
            categoryId: basicCategory.id,
            facilityId: 'park-0001',
            itemName: '사용료',
            normalizedItemType: 'base_cost',
            groupType: null,
            description: '1평형 기준',
            raw: '사용료 1평형 기준',
            price: 3000000,
            unit: '1평',
            sizeValue: 1,
            sizeUnit: '평',
            hasInstallation: false,
            hasManagementFee: false,
            includedYear: null,
            discountAvailable: false,
            discountTargets: null,
            refundRule: null,
            minQty: 1,
            maxQty: null
        }
    });

    console.log('✅ 사용료 추가 완료:', usageFee.itemName, usageFee.price.toLocaleString() + '원');

    // 확인
    const items = await prisma.priceItem.findMany({
        where: {
            categoryId: basicCategory.id
        },
        select: {
            itemName: true,
            price: true
        }
    });

    console.log('\n현재 기본비용:');
    items.forEach(item => {
        console.log(`  - ${item.itemName}: ${item.price.toLocaleString()}원`);
    });

    await prisma.$disconnect();
})();
