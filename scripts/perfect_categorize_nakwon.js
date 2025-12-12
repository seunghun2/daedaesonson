const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 🔥 완전히 새로운 분류 로직 (더 정밀)
function categorizeItem(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim();

    // ━━━ 1순위: 기본비용 (정확한 매칭만!) ━━━
    if (trimmedName === '사용료' ||
        trimmedName === '묘지사용료' ||
        trimmedName === '관리비' ||
        trimmedName === '묘지관리비' ||
        trimmedName === '시설사용료') {
        return '기본비용';
    }

    // ━━━ 2순위: 석물 (절대적!) ━━━
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석', '오석', '화강석'];

    // 석물 키워드가 있고, "매장묘" 단어가 없으면 무조건 매장묘(석물)
    if (stoneKeywords.some(k => combined.includes(k)) &&
        !trimmedName.startsWith('개인') &&
        !trimmedName.startsWith('부부') &&
        !trimmedName.startsWith('가족')) {
        return '매장묘';
    }

    // ━━━ 3순위: 작업비 ━━━
    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선비')) {
        return '매장묘'; // 작업비도 매장묘 카테고리
    }

    // ━━━ 4순위: 봉안당 ━━━
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    // ━━━ 5순위: 봉안묘 (봉안당 제외) ━━━
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // ━━━ 6순위: 수목장/평장 ━━━
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    // ━━━ 7순위: 개인/부부/가족 매장묘 (시설 제공 상품) ━━━
    if (combined.includes('매장묘') || combined.includes('매장시설')) {
        // "개인 매장묘", "부부 매장묘" 등
        if (trimmedName.includes('개인') || trimmedName.includes('부부') ||
            trimmedName.includes('가족') || trimmedName.includes('프리미엄')) {
            return '매장묘';
        }
    }

    // ━━━ 기타 ━━━
    return '기타';
}

// 그룹명 추출 (더 정밀하게)
function extractGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    // 기본비용은 그룹 없음
    if (category === '기본비용') return null;

    // 매장묘 세부 그룹
    if (category === '매장묘') {
        // 시설 제공 상품
        if (name.includes('개인')) return '개인묘';
        if (name.includes('부부')) return '부부묘';
        if (name.includes('가족')) return '가족묘';
        if (name.includes('프리미엄')) return '프리미엄';

        // 석물
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

        // 작업비
        if (name.includes('봉분')) return '봉분공사';
        if (name.includes('작업비') || name.includes('개장')) return '작업비';
        if (name.includes('리모델')) return '리모델링';
    }

    // 봉안당
    if (category === '봉안당') {
        if (name.includes('개인')) return '개인단';
        if (name.includes('부부')) return '부부단';
        if (name.includes('가족')) return '가족단';
    }

    // 수목장
    if (category === '수목장') {
        if (name.includes('평장')) return '평장';
        if (name.includes('정원')) return '정원형';
        if (name.includes('수목')) return '수목장';
    }

    return null;
}

(async () => {
    console.log('=== 낙원추모공원 완전 재분류 ===\n');

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0001' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0001' } });

    console.log('✅ 기존 데이터 삭제');

    // 원본 데이터
    const data = JSON.parse(fs.readFileSync('nakwon_full_prices.json', 'utf-8'));
    const validItems = data.items.filter(item => item.price > 0);

    console.log(`\n총 ${validItems.length}개 항목 재분류 중...\n`);

    // 카테고리별 그룹화
    const grouped = {};
    validItems.forEach(item => {
        const cat = categorizeItem(item.name, item.detail);
        if (!grouped[cat]) grouped[cat] = [];
        const group = extractGroupName(item.name, cat);
        grouped[cat].push({ ...item, group });
    });

    console.log('분류 결과:');
    Object.entries(grouped).forEach(([cat, items]) => {
        console.log(`  ${cat}: ${items.length}개`);

        // 그룹별 카운트
        const groups = {};
        items.forEach(item => {
            const g = item.group || '미분류';
            groups[g] = (groups[g] || 0) + 1;
        });
        Object.entries(groups).forEach(([g, count]) => {
            console.log(`    - ${g}: ${count}개`);
        });
    });

    // DB 저장
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
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0001',
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: orderNo++
            }
        });

        for (const item of items) {
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0001',
                    itemName: item.name,
                    normalizedItemType: CATEGORY_MAPPING[catName] || 'other',
                    groupType: item.group,
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
