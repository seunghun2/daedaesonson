const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  전체 시설 검증');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 전체 통계
    const totalFacilities = await prisma.facility.count();
    const totalCategories = await prisma.priceCategory.count();
    const totalItems = await prisma.priceItem.count();
    const withImages = await prisma.facility.count({ where: { images: { not: null } } });

    console.log(`📊 전체 통계:`);
    console.log(`   시설: ${totalFacilities}개`);
    console.log(`   카테고리: ${totalCategories}개`);
    console.log(`   가격 항목: ${totalItems}개`);
    console.log(`   이미지 보유: ${withImages}/${totalFacilities}개 (${(withImages / totalFacilities * 100).toFixed(1)}%)\n`);

    // 카테고리별 통계
    const categoryStats = await prisma.priceCategory.groupBy({
        by: ['name'],
        _count: { id: true }
    });

    console.log(`📁 카테고리별 분포:`);
    categoryStats
        .sort((a, b) => b._count.id - a._count.id)
        .forEach(stat => {
            console.log(`   ${stat.name}: ${stat._count.id}개`);
        });

    // 가격 데이터가 있는 시설
    const facilitiesWithPrices = await prisma.facility.findMany({
        where: {
            priceCategories: {
                some: {}
            }
        },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    priceCategories: true,
                    priceItems: true
                }
            }
        },
        orderBy: {
            id: 'asc'
        }
    });

    console.log(`\n✅ 가격 데이터 보유 시설: ${facilitiesWithPrices.length}개\n`);

    // 항목 많은 순 TOP 10
    const top10 = facilitiesWithPrices
        .sort((a, b) => b._count.priceItems - a._count.priceItems)
        .slice(0, 10);

    console.log(`🏆 항목 수 TOP 10:`);
    top10.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f.name}: ${f._count.priceItems}개 항목, ${f._count.priceCategories}개 카테고리`);
    });

    // 오류 검증: 카테고리는 있지만 항목이 없는 경우
    const emptyCategories = await prisma.priceCategory.findMany({
        where: {
            priceItems: {
                none: {}
            }
        },
        include: {
            facility: {
                select: { name: true }
            }
        }
    });

    if (emptyCategories.length > 0) {
        console.log(`\n⚠️  항목 없는 카테고리: ${emptyCategories.length}개`);
        emptyCategories.slice(0, 5).forEach(cat => {
            console.log(`   - ${cat.facility.name}: ${cat.name}`);
        });
        if (emptyCategories.length > 5) {
            console.log(`   ... 그 외 ${emptyCategories.length - 5}개`);
        }
    }

    // 그룹 분포 확인
    const groupStats = await prisma.$queryRaw`
        SELECT groupType, COUNT(*) as count
        FROM PriceItem
        WHERE groupType IS NOT NULL
        GROUP BY groupType
        ORDER BY count DESC
        LIMIT 20
    `;

    console.log(`\n📦 그룹 분포 TOP 20:`);
    groupStats.forEach(stat => {
        console.log(`   ${stat.groupType}: ${stat.count}개`);
    });

    // 랜덤 시설 5개 샘플 검증
    const sampleIds = ['park-0001', 'park-0050', 'park-0100', 'park-0200', 'park-0300'];
    console.log(`\n🔍 샘플 시설 검증:`);

    for (const id of sampleIds) {
        const facility = await prisma.facility.findUnique({
            where: { id },
            include: {
                priceCategories: {
                    include: {
                        priceItems: true
                    }
                }
            }
        });

        if (facility) {
            const totalItems = facility.priceCategories.reduce((sum, cat) => sum + cat.priceItems.length, 0);
            const hasImages = facility.images ? '🖼️' : '⚪';
            console.log(`   ${hasImages} ${facility.name}: ${facility.priceCategories.length}개 카테고리, ${totalItems}개 항목`);
        } else {
            console.log(`   ❌ ${id}: 시설 없음`);
        }
    }

    await prisma.$disconnect();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  검증 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
