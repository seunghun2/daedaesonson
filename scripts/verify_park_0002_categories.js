const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 개선된 카테고리 분류 (항목명 우선)
function categorizeItem(name, detail) {
    const trimmedName = name.trim();
    const lowerName = trimmedName.toLowerCase();
    const combined = (name + ' ' + (detail || '')).toLowerCase();

    // 🔥 1순위: 항목명이 명확하게 카테고리를 지정하는 경우

    // 매장묘 패턴 (평형 기반)
    if ((lowerName.includes('매장묘(') || lowerName.includes('매장시설(')) &&
        (lowerName.includes('평형') || lowerName.includes('단봉') || lowerName.includes('쌍봉'))) {
        return '매장묘';
    }

    // 봉안묘 패턴 (위 기반)
    if (lowerName.startsWith('봉안묘(') || (lowerName.includes('봉안묘') && lowerName.includes('위'))) {
        return '봉안묘';
    }

    // 봉안당 패턴
    if (lowerName.startsWith('봉안당(')) {
        return '봉안당';
    }

    // 수목장/평장 패턴 (평형 + 자연장)
    if ((lowerName.startsWith('평장(') || lowerName.startsWith('정원형(')) && !lowerName.includes('와비')) {
        return '수목장';
    }

    // 2순위: 순수 기본비용 (사용료/관리비 단독)
    if (trimmedName === '사용료' || trimmedName === '묘지사용료' ||
        trimmedName === '관리비' || trimmedName === '묘지관리비' ||
        trimmedName === '시설사용료') {
        return '기본비용';
    }

    // "1평", "1평/1년" 같은 단위 기반 항목 (묘지사용료/관리비)
    if (/^\d+평/.test(trimmedName)) {
        if (detail?.includes('묘지사용료') || detail?.includes('관리비') ||
            detail?.includes('사용료')) {
            return '기본비용';
        }
    }

    // 3순위: 석물류 (매장묘)
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '갓석', '오석', '화강석'];

    if (stoneKeywords.some(k => lowerName.includes(k))) {
        return '매장묘';
    }

    // 4순위: 작업비 (매장묘)
    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선비') ||
        combined.includes('봉분')) {
        return '매장묘';
    }

    // 5순위: 봉안당
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    // 6순위: 봉안묘
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // 7순위: 수목장
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장') ||
        combined.includes('입주비')) {
        return '수목장';
    }

    // 8순위: 장식품/소품 → 기타
    const decorKeywords = ['월석', '화병', '향로', '성경책', '천판', '각자대'];
    if (decorKeywords.some(k => lowerName.includes(k))) {
        return '기타';
    }

    return '기타';
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #2 항목별 카테고리 검증');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const f2 = await prisma.facility.findUnique({
        where: { id: 'park-0002' },
        include: {
            priceCategories: {
                include: { priceItems: true },
                orderBy: { orderNo: 'asc' }
            }
        }
    });

    let wrongCount = 0;
    const fixes = [];

    for (const cat of f2.priceCategories) {
        for (const item of cat.priceItems) {
            const correctCat = categorizeItem(item.itemName, item.description);

            if (correctCat !== cat.name) {
                wrongCount++;
                fixes.push({
                    itemName: item.itemName,
                    currentCat: cat.name,
                    correctCat: correctCat,
                    price: item.price,
                    itemId: item.id
                });

                console.log(`❌ ${item.itemName} (${item.price?.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')}원)`);
                console.log(`   현재: ${cat.name} → 수정: ${correctCat}\n`);
            }
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  총 ${wrongCount}개 항목이 잘못된 카테고리에 있습니다.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (fixes.length > 0) {
        console.log('수정이 필요합니다. 재분류를 진행할까요?');
    } else {
        console.log('✅ 모든 항목이 올바른 카테고리에 있습니다!');
    }

    await prisma.$disconnect();
})();
