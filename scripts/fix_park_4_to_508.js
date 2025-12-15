const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 카테고리 매핑
const CATEGORY_MAPPING = {
    '기본비용': { normalized: 'base_cost', orderNo: 0 },
    '매장묘': { normalized: 'grave', orderNo: 1 },
    '봉안묘': { normalized: 'charnel_grave', orderNo: 2 },
    '봉안당': { normalized: 'charnel_house', orderNo: 3 },
    '수목장': { normalized: 'natural', orderNo: 4 },
    '기타': { normalized: 'other', orderNo: 5 }
};

// groupType 추출
function extractGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    if (category === '기본비용') return '기본요금';

    if (category === '매장묘') {
        if (name.includes('쌍봉')) return '부부묘';
        if (name.includes('단봉')) return '개인묘';
        if (name.includes('개인')) return '개인묘';
        if (name.includes('부부')) return '부부묘';
        if (name.includes('가족')) return '가족묘';
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
        if (name.includes('작업') || name.includes('개장')) return '작업비';
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
        return '수목장';
    }

    return '미분류';
}

async function processFacility(facilityData) {
    const facilityId = facilityData.id;

    if (!facilityData.priceInfo?.priceTable) {
        return { success: true, skipped: true, reason: 'no_price_data' };
    }

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId } });
    await prisma.priceCategory.deleteMany({ where: { facilityId } });

    let totalItems = 0;
    let categoryCount = 0;

    // 카테고리별로 처리
    for (const [catName, catData] of Object.entries(facilityData.priceInfo.priceTable)) {
        if (!catData.rows || catData.rows.length === 0) continue;

        const mapping = CATEGORY_MAPPING[catName] || { normalized: 'other', orderNo: 5 };

        const category = await prisma.priceCategory.create({
            data: {
                facilityId,
                name: catName,
                normalizedName: mapping.normalized,
                orderNo: mapping.orderNo
            }
        });

        categoryCount++;

        for (const row of catData.rows) {
            if (row.price <= 0) continue;

            const groupType = extractGroupName(row.name, catName);

            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId,
                    itemName: row.name,
                    normalizedItemType: mapping.normalized,
                    groupType: groupType,
                    description: row.grade || null,
                    raw: `${row.name} ${row.grade || ''}`.trim(),
                    price: BigInt(row.price),
                    unit: row.grade || '1기',
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
            totalItems++;
        }
    }

    return {
        success: true,
        skipped: false,
        itemCount: totalItems,
        categoryCount
    };
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #4~#508 일괄 재마이그레이션');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

    // #4부터 #508까지 (앞의 #1~#3은 건너뜀)
    const targetFacilities = facilities.filter(f => {
        const num = parseInt(f.id.replace('park-', ''));
        return num >= 4 && num <= 508 && f.category !== 'CHARNEL_HOUSE';
    });

    console.log(`총 ${targetFacilities.length}개 시설 처리 예정\n`);

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const [index, facility] of targetFacilities.entries()) {
        try {
            const result = await processFacility(facility);

            if (result.skipped) {
                skippedCount++;
                console.log(`⚪ [${index + 1}/${targetFacilities.length}] ${facility.name}: 가격 데이터 없음`);
            } else {
                successCount++;
                console.log(`✅ [${index + 1}/${targetFacilities.length}] ${facility.name}: ${result.itemCount}개 항목, ${result.categoryCount}개 카테고리`);
            }

            // 10초마다 진행률 출력
            if ((index + 1) % 10 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = (index + 1) / elapsed;
                const remaining = targetFacilities.length - (index + 1);
                const eta = remaining / rate;

                console.log(`\n📊 진행률: ${index + 1}/${targetFacilities.length} (${((index + 1) / targetFacilities.length * 100).toFixed(1)}%)`);
                console.log(`   속도: ${rate.toFixed(1)}개/초`);
                console.log(`   예상 완료: ${(eta / 60).toFixed(1)}분 후\n`);
            }

        } catch (error) {
            errorCount++;
            console.error(`❌ [${index + 1}/${targetFacilities.length}] ${facility.name}: ${error.message}`);
        }
    }

    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`⚪ 건너뜀: ${skippedCount}개`);
    console.log(`❌ 오류: ${errorCount}개`);
    console.log(`⏱️  소요 시간: ${totalTime.toFixed(1)}분`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
})();
