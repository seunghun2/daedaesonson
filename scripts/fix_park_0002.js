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

function extractGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    if (category === '기본비용') return '기본요금';

    if (category === '매장묘') {
        // 패키지 상품 (평형 기반) - 먼저 체크!
        if (name.includes('쌍봉')) return '부부묘';
        if (name.includes('단봉')) return '개인묘';

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

    return '미분류';
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #2: 실로암공원묘원 재분류');
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

    const CATEGORY_MAPPING = {
        '기본비용': 'base_cost',
        '매장묘': 'grave',
        '봉안묘': 'charnel_grave',
        '봉안당': 'charnel_house',
        '수목장': 'natural',
        '기타': 'other'
    };

    const CATEGORY_ORDER = {
        '기본비용': 0,
        '매장묘': 1,
        '봉안묘': 2,
        '봉안당': 3,
        '수목장': 4,
        '기타': 5
    };

    // 1. 모든 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0002' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0002' } });

    console.log('✅ 기존 데이터 삭제 완료\n');

    // 2. 카테고리별로 재그룹화
    const categoryMap = new Map();

    for (const cat of f2.priceCategories) {
        for (const item of cat.priceItems) {
            const correctCat = categorizeItem(item.itemName, item.description);

            if (!categoryMap.has(correctCat)) {
                categoryMap.set(correctCat, []);
            }

            categoryMap.get(correctCat).push({
                itemName: item.itemName,
                description: item.description,
                price: item.price,
                raw: item.raw
            });
        }
    }

    console.log('📊 재분류 결과:');
    categoryMap.forEach((items, catName) => {
        console.log(`  ${catName}: ${items.length}개`);
    });
    console.log('');

    // 3. DB에 저장
    let totalSaved = 0;

    for (const [catName, items] of categoryMap.entries()) {
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0002',
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: CATEGORY_ORDER[catName] ?? 5
            }
        });

        for (const item of items) {
            const groupType = extractGroupName(item.itemName, catName);

            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0002',
                    itemName: item.itemName,
                    normalizedItemType: CATEGORY_MAPPING[catName] || 'other',
                    groupType: groupType,
                    description: item.description || null,
                    raw: item.raw || `${item.itemName} ${item.description || ''}`.trim(),
                    price: BigInt(item.price || 0),
                    unit: item.description || '1기',
                    sizeValue: null,
                    sizeUnit: null,
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
            totalSaved++;
        }

        console.log(`✅ "${catName}" 카테고리: ${items.length}개 저장`);
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  총 ${totalSaved}개 항목 재분류 완료!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    await prisma.$disconnect();
})();
