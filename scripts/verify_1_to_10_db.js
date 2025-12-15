const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 1~10 DB 검증');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const targetIds = ['park-0001', 'park-0002', 'park-0003', 'park-0004', 'park-0005',
        'park-0006', 'park-0007', 'park-0008', 'park-0009', 'park-0010'];

    const results = [];

    for (const facilityId of targetIds) {
        const facility = await prisma.facility.findUnique({ where: { id: facilityId } });

        if (!facility) {
            console.log(`❌ ${facilityId}: Facility 레코드 없음`);
            results.push({ id: facilityId, success: false, reason: 'no_facility' });
            continue;
        }

        const categories = await prisma.priceCategory.findMany({
            where: { facilityId },
            include: { priceItems: true }
        });

        const totalItems = categories.reduce((sum, cat) => sum + cat.priceItems.length, 0);

        // 그룹 분포 확인
        const groupStats = {};
        categories.forEach(cat => {
            cat.priceItems.forEach(item => {
                const group = item.groupType || '미분류';
                const key = `${cat.name}::${group}`;
                groupStats[key] = (groupStats[key] || 0) + 1;
            });
        });

        console.log(`✅ ${facility.name} (${facilityId})`);
        console.log(`   카테고리: ${categories.length}개`);
        console.log(`   항목: ${totalItems}개`);

        categories.forEach(cat => {
            const groups = {};
            cat.priceItems.forEach(item => {
                const g = item.groupType || '미분류';
                groups[g] = (groups[g] || 0) + 1;
            });

            console.log(`   - ${cat.name} (${cat.priceItems.length}개)`);
            Object.entries(groups).forEach(([g, count]) => {
                console.log(`     * ${g}: ${count}개`);
            });
        });
        console.log('');

        results.push({
            id: facilityId,
            name: facility.name,
            success: true,
            categories: categories.length,
            items: totalItems
        });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  검증 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const successful = results.filter(r => r.success);
    console.log(`✅ 성공: ${successful.length}/${targetIds.length}`);

    await prisma.$disconnect();
})();
