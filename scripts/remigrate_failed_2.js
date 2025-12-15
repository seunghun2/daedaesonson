const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 카테고리 분류 (동일한 로직)
function categorizeItem(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim();

    if (trimmedName === '사용료' || trimmedName === '묘지사용료' ||
        trimmedName === '관리비' || trimmedName === '묘지관리비' ||
        trimmedName === '시설사용료') {
        return '기본비용';
    }

    if (detail && (detail.includes('묘지사용료') || detail.includes('관리비') ||
        detail.includes('사용료') && !detail.includes('석물'))) {
        return '기본비용';
    }

    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석', '오석', '화강석'];

    if (stoneKeywords.some(k => combined.includes(k)) &&
        !trimmedName.startsWith('개인') &&
        !trimmedName.startsWith('부부') &&
        !trimmedName.startsWith('가족')) {
        return '매장묘';
    }

    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선비')) {
        return '매장묘';
    }

    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    if (combined.includes('매장묘') || combined.includes('매장시설')) {
        if (trimmedName.includes('개인') || trimmedName.includes('부부') ||
            trimmedName.includes('가족') || trimmedName.includes('프리미엄')) {
            return '매장묘';
        }
    }

    return '기타';
}

function extractGroupName(itemName, category) {
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

    return '미분류';
}

async function processFacility(facilityData) {
    const facilityId = facilityData.id;

    await prisma.priceItem.deleteMany({ where: { facilityId } });
    await prisma.priceCategory.deleteMany({ where: { facilityId } });

    const imageUrls = [];
    if (facilityData.imageUrl) imageUrls.push(facilityData.imageUrl);
    if (facilityData.imageGallery && Array.isArray(facilityData.imageGallery)) {
        imageUrls.push(...facilityData.imageGallery);
    }
    const imagesString = imageUrls.join(',');

    await prisma.facility.upsert({
        where: { id: facilityId },
        update: {
            name: facilityData.name,
            category: facilityData.category || 'PARK',
            address: facilityData.address || '',
            lat: facilityData.location?.lat || facilityData.lat || 0,
            lng: facilityData.location?.lng || facilityData.lng || 0,
            minPrice: BigInt(facilityData.priceRange?.min || 0),
            maxPrice: BigInt(facilityData.priceRange?.max || 0),
            images: imagesString || null
        },
        create: {
            id: facilityId,
            name: facilityData.name,
            category: facilityData.category || 'PARK',
            address: facilityData.address || '',
            lat: facilityData.location?.lat || facilityData.lat || 0,
            lng: facilityData.location?.lng || facilityData.lng || 0,
            minPrice: BigInt(facilityData.priceRange?.min || 0),
            maxPrice: BigInt(facilityData.priceRange?.max || 0),
            images: imagesString || null
        }
    });

    if (!facilityData.priceInfo?.priceTable) {
        return { success: true, itemCount: 0, categoryCount: 0, imageCount: imageUrls.length, reason: 'no_price_data' };
    }

    const priceTable = facilityData.priceInfo.priceTable;
    const allItems = [];

    Object.entries(priceTable).forEach(([catName, catData]) => {
        if (catData.rows) {
            catData.rows.forEach(row => {
                if (row.price > 0) {
                    allItems.push({
                        name: row.name,
                        price: row.price,
                        detail: row.grade || ''
                    });
                }
            });
        }
    });

    if (allItems.length === 0) {
        return { success: true, itemCount: 0, categoryCount: 0, imageCount: imageUrls.length, reason: 'no_valid_items' };
    }

    const grouped = {};
    allItems.forEach(item => {
        const cat = categorizeItem(item.name, item.detail);
        if (!grouped[cat]) grouped[cat] = [];
        const group = extractGroupName(item.name, cat);
        grouped[cat].push({ ...item, group });
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

    let totalSaved = 0;

    for (const [catName, items] of Object.entries(grouped)) {
        const category = await prisma.priceCategory.create({
            data: {
                facilityId,
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: CATEGORY_ORDER[catName] ?? 5
            }
        });

        for (const item of items) {
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId,
                    itemName: item.name,
                    normalizedItemType: CATEGORY_MAPPING[catName] || 'other',
                    groupType: item.group,
                    description: item.detail || null,
                    raw: `${item.name} ${item.detail || ''}`.trim(),
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

    return {
        success: true,
        itemCount: totalSaved,
        categoryCount: Object.keys(grouped).length,
        imageCount: imageUrls.length
    };
}

(async () => {
    const facilitiesData = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const facilities = Array.isArray(facilitiesData) ? facilitiesData : facilitiesData.facilities || facilitiesData;

    const targetFacilities = facilities.filter(f =>
        f.name.includes('양택공원묘지') || f.name.includes('북성리공설묘지')
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  실패 시설 재마이그레이션 (${targetFacilities.length}개)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const facilityData of targetFacilities) {
        try {
            const result = await processFacility(facilityData);
            if (result.success) {
                console.log(`✅ ${facilityData.name}: ${result.itemCount}개 항목, ${result.categoryCount}개 카테고리`);
            }
        } catch (error) {
            console.error(`❌ ${facilityData.name}: ${error.message}`);
        }
    }

    await prisma.$disconnect();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
