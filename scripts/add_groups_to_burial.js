const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 그룹명 추출 함수
function extractGroupName(itemName) {
    const name = itemName.trim();

    // 명확한 키워드로 그룹화
    const groups = {
        '상석': ['상석'],
        '비석': ['비석'],
        '와비': ['와비'],
        '둘레석': ['둘레석', '경계석'],
        '봉분': ['봉분'],
        '작업비': ['작업비', '개장'],
        '리모델링': ['리모델링'],
        '평장': ['평장'],
        '월석': ['월석'],
        '묘테석': ['묘테'],
        '담장석': ['담장'],
        '가족봉안묘': ['가봉', '가족봉안'],
        '화병': ['화병'],
        '향로': ['향로'],
        '좌대': ['좌대'],
        '북석': ['북석']
    };

    for (const [groupName, keywords] of Object.entries(groups)) {
        if (keywords.some(k => name.includes(k))) {
            return groupName;
        }
    }

    return '기타';
}

(async () => {
    console.log('=== 매장묘 항목에 그룹 정보 추가 ===\n');

    // 매장묘 카테고리의 모든 항목 조회
    const items = await prisma.priceItem.findMany({
        where: {
            facilityId: 'park-0001',
            categoryId: {
                in: await prisma.priceCategory.findMany({
                    where: {
                        facilityId: 'park-0001',
                        name: '매장묘'
                    },
                    select: { id: true }
                }).then(cats => cats.map(c => c.id))
            }
        }
    });

    console.log(`총 ${items.length}개 항목 처리 중...\n`);

    const groupCounts = {};

    for (const item of items) {
        const groupName = extractGroupName(item.itemName);

        await prisma.priceItem.update({
            where: { id: item.id },
            data: { groupType: groupName }
        });

        groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
    }

    console.log('그룹별 항목 수:');
    Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([group, count]) => {
            console.log(`  ${group}: ${count}개`);
        });

    console.log('\n✅ 완료!');

    await prisma.$disconnect();
})();
