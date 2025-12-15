const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 개선된 그룹명 추출 (기타 카테고리 포함)
function extractBetterGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    if (category === '기본비용') return '기본요금';

    if (category === '매장묘') {
        if (name.includes('개인')) return '개인묘';
        if (name.includes('부부')) return '부부묘';
        if (name.includes('가족')) return '가족묘';
        if (name.includes('프리미엄')) return '프리미엄';
        if (name.includes('상석')) return '상석';
        if (name.includes('비석')) return '비석';
        if (name.includes('와비')) return '와비';
        if (name.includes('둘레석') || name.includes('경계석')) return '둘레석';
        if (name.includes('묘테')) return '묘테석';
        if (name.includes('담장')) return '담장석';
        if (name.includes('월석')) return '월석';
        if (name.includes('화병')) return '화병';
        if (name.includes('향로')) return '향로';
        if (name.includes('좌대')) return '좌대';
        if (name.includes('북석')) return '북석';
        if (name.includes('봉분')) return '봉분공사';
        if (name.includes('작업비') || name.includes('개장')) return '작업비';
        if (name.includes('리모델')) return '리모델링';
        return '매장묘';
    }

    if (category === '봉안당') {
        if (name.includes('개인')) return '개인단';
        if (name.includes('부부')) return '부부단';
        if (name.includes('가족')) return '가족단';
        return '봉안당';
    }

    if (category === '봉안묘') {
        if (name.includes('개인')) return '개인묘';
        if (name.includes('부부')) return '부부묘';
        if (name.includes('가족')) return '가족묘';
        return '봉안묘';
    }

    if (category === '수목장') {
        if (name.includes('평장')) return '평장';
        if (name.includes('정원')) return '정원형';
        if (name.includes('수목')) return '수목장';
        return '수목장';
    }

    // 기타 카테고리도 가능한 그룹화
    if (category === '기타') {
        // 묘 관련
        if (name.includes('개인묘') || name.includes('1인')) return '개인묘';
        if (name.includes('부부묘') || name.includes('2인')) return '부부묘';
        if (name.includes('가족묘')) return '가족묘';

        // 시설 관련
        if (name.includes('대리석') || name.includes('화강암')) return '석재';
        if (name.includes('잔디') || name.includes('조경')) return '조경';
        if (name.includes('비용') || name.includes('수수료')) return '부대비용';

        // 위치/등급
        if (name.includes('특') || name.includes('premium')) return '특급';
        if (name.includes('일반')) return '일반';

        return '기타';
    }

    return '미분류';
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  "미분류" 그룹명 개선');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 미분류 항목 가져오기
    const unclassified = await prisma.priceItem.findMany({
        where: {
            OR: [
                { groupType: '미분류' },
                { groupType: null }
            ]
        },
        include: {
            category: true
        }
    });

    console.log(`📦 총 ${unclassified.length}개 미분류 항목 발견\n`);

    let updated = 0;
    let unchanged = 0;

    for (const item of unclassified) {
        const newGroup = extractBetterGroupName(item.itemName, item.category.name);

        if (newGroup !== '미분류' && newGroup !== item.groupType) {
            await prisma.priceItem.update({
                where: { id: item.id },
                data: { groupType: newGroup }
            });
            updated++;

            if (updated <= 10) {
                console.log(`✅ "${item.itemName}" → ${newGroup}`);
            }
        } else {
            unchanged++;
        }
    }

    if (updated > 10) {
        console.log(`   ... 그 외 ${updated - 10}개 업데이트`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  결과:`);
    console.log(`  ✅ 업데이트: ${updated}개`);
    console.log(`  ⚪ 변경 없음: ${unchanged}개`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    await prisma.$disconnect();
})();
