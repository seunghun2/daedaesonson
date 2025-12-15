const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 개선된 카테고리 분류
function categorizeItem(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim().toLowerCase();

    // 최우선: 석물
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석'];
    if (stoneKeywords.some(k => combined.includes(k))) {
        return '매장묘';
    }

    // 2순위: 작업비
    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선')) {
        return '매장묘';
    }

    // 3순위: 봉안당
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단')) {
        return '봉안당';
    }

    // 4순위: 봉안묘
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // 5순위: 수목장
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    // 6순위: 기본비용
    if (trimmedName === '사용료' || trimmedName === '묘지사용료' ||
        trimmedName === '관리비' || trimmedName === '묘지관리비') {
        return '기본비용';
    }

    return '기타';
}

(async () => {
    console.log('=== 낙원추모공원 제대로 재마이그레이션 ===\n');

    const data = JSON.parse(fs.readFileSync('nakwon_full_prices.json', 'utf-8'));

    // 0원 제거
    const validItems = data.items.filter(item => item.price > 0);

    console.log(`총 ${validItems.length}개 유효 항목`);

    // 카테고리별 그룹화
    const grouped = {};
    validItems.forEach(item => {
        const cat = categorizeItem(item.name, item.detail);
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    console.log('\n분류 결과:');
    Object.keys(grouped).forEach(cat => {
        console.log(`  ${cat}: ${grouped[cat].length}개`);
    });

    // DB에 저장
    const CATEGORY_MAPPING = {
        '기본비용': 'base_cost',
        '매장묘': 'grave',
        '봉안묘': 'charnel_grave',
        '봉안당': 'charnel_house',
        '수목장': 'natural',
        '기타': 'other'
    };

    let orderNo = 0;
    for (const [catName, items] of Object.entries(grouped)) {
        // 카테고리 생성
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0001',
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: orderNo++
            }
        });

        console.log(`\n${catName} 삽입 중... (${items.length}개)`);

        // 항목 하나씩 생성
        for (const item of items) {
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0001',
                    itemName: item.name,
                    normalizedItemType: CATEGORY_MAPPING[catName] || 'other',
                    groupType: null,
                    description: item.detail || null,
                    raw: `${item.name} ${item.detail || ''}`.trim(),
                    price: item.price,
                    unit: item.detail || '1기',
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
        }
    }

    console.log('\n✅ 완료!');

    await prisma.$disconnect();
})();
