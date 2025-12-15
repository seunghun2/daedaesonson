const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

// 개선된 카테고리 분류 (항목명 우선)
function categorizeItem(name, detail) {
    const lowerName = name.trim().toLowerCase();
    const lowerDetail = (detail || '').toLowerCase();

    // 1. 명확한 패키지 상품들 (평형 기반)
    if (lowerName.includes('매장묘(') && lowerName.includes('평')) {
        return '매장묘';
    }

    if (lowerName.includes('봉안') && lowerName.includes('평장묘')) {
        // "봉안/평장묘" → 수목장으로 분류
        return '수목장';
    }

    // 2. 진짜 기본비용 (1평 기준)
    if (/1평/.test(lowerName) && (lowerName.includes('년') || lowerName.includes('기준'))) {
        return '기본비용';
    }

    // 3. 석물 (매장묘)
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석', '오석', '화강석'];

    if (stoneKeywords.some(k => lowerName.includes(k))) {
        return '매장묘';
    }

    // 4. 작업비 (매장묘)
    if (lowerName.includes('작업비') || lowerName.includes('개장') || lowerName.includes('봉분')) {
        return '매장묘';
    }

    // 5. 봉안묘 (위 기반)
    if (lowerName.includes('봉안묘') || (lowerName.includes('위') && lowerDetail.includes('리모델'))) {
        return '봉안묘';
    }

    return '기타';
}

function extractGroupName(itemName, category) {
    const name = itemName.trim().toLowerCase();

    if (category === '기본비용') return '기본요금';

    if (category === '매장묘') {
        if (name.includes('일반매장묘')) return '개인묘';
        if (name.includes('부부매장묘') || name.includes('고급매장묘')) return '부부묘';
        if (name.includes('쌍봉')) return '부부묘';
        if (name.includes('단봉')) return '개인묘';
        if (name.includes('상석') || name.includes('혼유석')) return '상석';
        if (name.includes('비석')) return '비석';
        if (name.includes('와비')) return '와비';
        if (name.includes('둘레석') || name.includes('경계석')) return '둘레석';
        if (name.includes('봉분')) return '봉분공사';
        if (name.includes('작업') || name.includes('개장')) return '작업비';
        if (name.includes('화병')) return '화병';
        if (name.includes('향로')) return '향로';
        if (name.includes('리모델')) return '리모델링';
        return '매장묘';
    }

    if (category === '봉안묘') {
        if (name.includes('위')) return '봉안묘';
        return '봉안묘';
    }

    if (category === '수목장') {
        if (name.includes('평장')) return '평장';
        if (name.includes('봉안')) return '봉안형';
        return '수목장';
    }

    return '미분류';
}

(async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  시설 #4: 재단법인울산공원묘원');
    console.log('  올바른 재분류');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const f4 = facilities.find(f => f.id === 'park-0004');

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId: 'park-0004' } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: 'park-0004' } });
    console.log('✅ 기존 데이터 삭제\n');

    // 모든 항목 수집
    const allItems = [];
    Object.entries(f4.priceInfo.priceTable).forEach(([sourceCat, catData]) => {
        if (!catData.rows) return;
        catData.rows.forEach(row => {
            if (row.price > 0) {
                const correctCat = categorizeItem(row.name, row.grade);
                allItems.push({
                    name: row.name,
                    price: row.price,
                    detail: row.grade || null,
                    category: correctCat
                });
            }
        });
    });

    console.log('📊 재분류 결과:');
    const grouped = {};
    allItems.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    Object.entries(grouped).forEach(([cat, items]) => {
        console.log(\`  \${cat}: \${items.length}개\`);
    });
    console.log('');
    
    // DB 저장
    const CATEGORY_MAPPING = {
        '기본비용': { normalized: 'base_cost', orderNo: 0 },
        '매장묘': { normalized: 'grave', orderNo: 1 },
        '봉안묘': { normalized: 'charnel_grave', orderNo: 2 },
        '수목장': { normalized: 'natural', orderNo: 4 },
        '기타': { normalized: 'other', orderNo: 5 }
    };
    
    for (const [catName, items] of Object.entries(grouped)) {
        const mapping = CATEGORY_MAPPING[catName] || { normalized: 'other', orderNo: 5 };
        
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: 'park-0004',
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
                    facilityId: 'park-0004',
                    itemName: item.name,
                    normalizedItemType: mapping.normalized,
                    groupType: groupType,
                    description: item.detail,
                    raw: \`\${item.name} \${item.detail || ''}\`.trim(),
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
        }
        
        console.log(\`✅ [\${catName}] 저장완료: \${items.length}개\`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await prisma.$disconnect();
})();
