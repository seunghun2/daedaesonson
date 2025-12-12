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

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #3: 삼덕공원묘원 재마이그레이션');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 원본 JSON 로드
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const f3 = facilities.find(f => f.id === 'park-0003');

    if (!f3 || !f3.priceInfo?.priceTable) {
        console.log('❌ 가격 데이터 없음');
        await prisma.$disconnect();
        return;
    }

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0003' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0003' } });
    console.log('✅ 기존 데이터 삭제 완료\n');

    // 카테고리별로 처리
    for (const [catName, catData] of Object.entries(f3.priceInfo.priceTable)) {
        if (!catData.rows || catData.rows.length === 0) continue;

        // 카테고리 생성
        const mapping = CATEGORY_MAPPING[catName] || { normalized: 'other', orderNo: 5 };

        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0003',
                name: catName,
                normalizedName: mapping.normalized,
                orderNo: mapping.orderNo
            }
        });

        console.log(`📂 [${catName}] 카테고리 생성`);

        // 항목 저장
        let savedCount = 0;
        for (const row of catData.rows) {
            if (row.price <= 0) continue;

            const groupType = extractGroupName(row.name, catName);

            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId: 'park-0003',
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
            savedCount++;
        }

        console.log(`   ✅ ${savedCount}개 항목 저장\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
})();
