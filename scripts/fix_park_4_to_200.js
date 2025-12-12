const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// 개선된 카테고리 분류
function categorizeItem(name, detail) {
    const lowerName = name.trim().toLowerCase();
    const lowerDetail = (detail || '').toLowerCase();
    const combined = lowerName + ' ' + lowerDetail;

    // 1. 패키지 상품 (매장묘)
    if ((lowerName.includes('매장묘(') || lowerName.includes('매장시설(')) &&
        (lowerName.includes('평') || lowerName.includes('형'))) {
        return '매장묘';
    }

    // 2. 봉안묘 패키지
    if (lowerName.includes('봉안묘(') || (lowerName.includes('봉안묘') && lowerName.includes('위'))) {
        return '봉안묘';
    }

    // 3. 봉안당 패키지
    if (lowerName.includes('봉안당(')) {
        return '봉안당';
    }

    // 4. 수목장/평장 패키지
    if ((lowerName.includes('평장') || lowerName.includes('수목장')) &&
        (lowerName.includes('평') || lowerName.includes('위'))) {
        return '수목장';
    }

    // 5. 진짜 기본비용
    if (/^\d*\.?\d+평/.test(lowerName) &&
        (lowerName.includes('년') || lowerName.includes('기준') ||
            lowerDetail.includes('묘지사용료') || lowerDetail.includes('관리비'))) {
        return '기본비용';
    }

    if (lowerName === '묘지사용료' || lowerName === '묘지 사용료' ||
        lowerName === '관리비' || lowerName === '묘지관리비' ||
        lowerName === '묘지 관리비' || lowerName === '시설사용료') {
        return '기본비용';
    }

    // 6. 석물류 (매장묘)
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석', '오석', '화강석', '거비'];

    if (stoneKeywords.some(k => lowerName.includes(k))) {
        return '매장묘';
    }

    // 7. 작업비 (매장묘)
    if (lowerName.includes('작업비') || lowerName.includes('설치비') ||
        lowerName.includes('개장') || lowerName.includes('수선비') ||
        lowerName.includes('봉분')) {
        return '매장묘';
    }

    // 8. 봉안당 관리비
    if (combined.includes('봉안당') && combined.includes('관리비')) {
        return '기본비용';
    }

    // 9. 봉안당
    if (combined.includes('봉안당') || combined.includes('봉안담')) {
        return '봉안당';
    }

    // 10. 봉안묘
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // 11. 수목장
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    return '기타';
}

function extractGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    if (category === '기본비용') return '기본요금';

    if (category === '매장묘') {
        if (name.includes('일반매장묘') || name.includes('단봉')) return '개인묘';
        if (name.includes('부부매장묘') || name.includes('고급매장묘') || name.includes('쌍봉')) return '부부묘';
        if (name.includes('가족')) return '가족묘';
        if (name.includes('상석') || name.includes('혼유석')) return '상석';
        if (name.includes('비석') || name.includes('거비')) return '비석';
        if (name.includes('와비')) return '와비';
        if (name.includes('둘레석') || name.includes('경계석')) return '둘레석';
        if (name.includes('봉분')) return '봉분공사';
        if (name.includes('작업') || name.includes('개장')) return '작업비';
        if (name.includes('화병')) return '화병';
        if (name.includes('향로')) return '향로';
        if (name.includes('묘테')) return '묘테석';
        if (name.includes('북석')) return '북석';
        return '매장묘';
    }

    if (category === '봉안당') {
        return '봉안당';
    }

    if (category === '봉안묘') {
        return '봉안묘';
    }

    if (category === '수목장') {
        if (name.includes('평장')) return '평장';
        return '수목장';
    }

    return '미분류';
}

async function processFacility(facilityData, index, total) {
    const facilityId = facilityData.id;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[' + index + '/' + total + '] ' + facilityData.name + ' (' + facilityId + ')');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!facilityData.priceInfo || !facilityData.priceInfo.priceTable) {
        console.log('⚪ 가격 데이터 없음');
        return { success: true, skipped: true };
    }

    await prisma.priceItem.deleteMany({ where: { facilityId } });
    await prisma.priceCategory.deleteMany({ where: { facilityId } });

    const allItems = [];
    Object.entries(facilityData.priceInfo.priceTable).forEach(function (entry) {
        const sourceCat = entry[0];
        const catData = entry[1];
        if (!catData.rows) return;
        catData.rows.forEach(function (row) {
            if (row.price > 0) {
                const correctCat = categorizeItem(row.name, row.grade);
                allItems.push({
                    name: row.name,
                    price: row.price,
                    detail: row.grade || null,
                    sourceCategory: sourceCat,
                    targetCategory: correctCat
                });
            }
        });
    });

    const grouped = {};
    allItems.forEach(function (item) {
        if (!grouped[item.targetCategory]) grouped[item.targetCategory] = [];
        grouped[item.targetCategory].push(item);
    });

    console.log('📊 재분류 결과:');
    Object.entries(grouped).forEach(function (entry) {
        console.log('  ' + entry[0] + ': ' + entry[1].length + '개');
    });

    const reclassified = allItems.filter(function (item) {
        return item.sourceCategory !== item.targetCategory;
    });

    if (reclassified.length > 0) {
        console.log('\n🔄 재분류된 항목: ' + reclassified.length + '개');
        reclassified.slice(0, 3).forEach(function (item) {
            console.log('  "' + item.name + '" → ' + item.sourceCategory + ' ➜ ' + item.targetCategory);
        });
        if (reclassified.length > 3) {
            console.log('  ... 외 ' + (reclassified.length - 3) + '개');
        }
    }

    const CATEGORY_MAPPING = {
        '기본비용': { normalized: 'base_cost', orderNo: 0 },
        '매장묘': { normalized: 'grave', orderNo: 1 },
        '봉안묘': { normalized: 'charnel_grave', orderNo: 2 },
        '봉안당': { normalized: 'charnel_house', orderNo: 3 },
        '수목장': { normalized: 'natural', orderNo: 4 },
        '기타': { normalized: 'other', orderNo: 5 }
    };

    let totalSaved = 0;

    for (const catEntry of Object.entries(grouped)) {
        const catName = catEntry[0];
        const items = catEntry[1];
        const mapping = CATEGORY_MAPPING[catName] || { normalized: 'other', orderNo: 5 };

        const category = await prisma.priceCategory.create({
            data: {
                facilityId: facilityId,
                name: catName,
                normalizedName: mapping.normalized,
                orderNo: mapping.orderNo
            }
        });

        for (const item of items) {
            const groupType = extractGroupName(item.name, catName);

            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: facilityId,
                    itemName: item.name,
                    normalizedItemType: mapping.normalized,
                    groupType: groupType,
                    description: item.detail,
                    raw: item.name + ' ' + (item.detail || ''),
                    price: BigInt(item.price),
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
            totalSaved++;
        }
    }

    console.log('✅ 저장 완료: ' + totalSaved + '개 항목');

    return {
        success: true,
        skipped: false,
        itemCount: totalSaved,
        categoryCount: Object.keys(grouped).length,
        reclassified: reclassified.length
    };
}

(async function () {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #4~#200 일괄 재분류');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

    const targetFacilities = facilities.filter(function (f) {
        const num = parseInt(f.id.replace('park-', ''));
        return num >= 4 && num <= 200 && f.category !== 'CHARNEL_HOUSE';
    });

    console.log('총 ' + targetFacilities.length + '개 시설 처리 예정\n');

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalReclassified = 0;

    for (let i = 0; i < targetFacilities.length; i++) {
        const facility = targetFacilities[i];
        try {
            const result = await processFacility(facility, i + 1, targetFacilities.length);

            if (result.skipped) {
                skippedCount++;
            } else {
                successCount++;
                totalReclassified += result.reclassified || 0;
            }

        } catch (error) {
            errorCount++;
            console.error('❌ 오류: ' + error.message);
        }
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 성공: ' + successCount + '개');
    console.log('⚪ 건너뜀: ' + skippedCount + '개');
    console.log('❌ 오류: ' + errorCount + '개');
    console.log('🔄 총 재분류 항목: ' + totalReclassified + '개');
    console.log('⏱️  소요 시간: ' + totalTime.toFixed(1) + '분');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
})();
