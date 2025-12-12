const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 카테고리 매핑
const CATEGORY_MAPPING = {
    '기본비용': 'base_cost',
    '매장묘': 'grave',
    '봉안묘': 'charnel_grave',
    '봉안당': 'charnel_house',
    '수목장': 'natural',
    '기타': 'other'
};

// 개선된 카테고리 분류 (우선순위: 석물/작업비 → 시설타입 → 기본비용)
function categorizeItem(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim().toLowerCase();

    // ━━━ 최우선: 석물 (절대적!) ━━━
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석'];
    if (stoneKeywords.some(k => combined.includes(k))) {
        return '매장묘'; // 석물은 매장묘 카테고리로 (사용자 규칙)
    }

    // ━━━ 2순위: 작업비 ━━━
    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선')) {
        return '매장묘'; // 작업비도 매장묘로
    }

    // ━━━ 3순위: 봉안당 (먼저!) ━━━
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    // ━━━ 4순위: 봉안묘 ━━━
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // ━━━ 5순위: 수목장 ━━━
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    // ━━━ 6순위: 기본비용 (엄격!) ━━━
    if (trimmedName === '사용료' || trimmedName === '묘지사용료' ||
        trimmedName === '관리비' || trimmedName === '묘지관리비') {
        return '기본비용';
    }

    return '기타';
}

// 크기 추출
function extractSize(grade) {
    if (!grade) return { value: null, unit: null };

    const pyeongMatch = grade.match(/(\d+\.?\d*)평/);
    if (pyeongMatch) {
        return { value: parseFloat(pyeongMatch[1]), unit: '평' };
    }

    const sqmMatch = grade.match(/(\d+\.?\d*)㎡/);
    if (sqmMatch) {
        const sqm = parseFloat(sqmMatch[1]);
        return { value: Math.round(sqm / 3.3 * 10) / 10, unit: '평' };
    }

    return { value: null, unit: null };
}

// 그룹 타입 추출
function extractGroupType(name, grade) {
    const combined = (name + ' ' + grade).toLowerCase();

    if (combined.includes('단장')) return '단장';
    if (combined.includes('합장')) return '합장';
    if (combined.includes('쌍분')) return '합장';
    if (combined.includes('개인단') || combined.includes('1위')) return '개인';
    if (combined.includes('부부단') || combined.includes('2위')) return '부부';
    if (combined.includes('가족') || combined.includes('4위') || combined.includes('6위')) return '가족';

    return null;
}

// 포함사항 체크
function checkInclusions(name, grade) {
    const combined = (name + ' ' + grade).toLowerCase();

    const hasInstallation = combined.includes('설치비') || combined.includes('석물') && combined.includes('포함');
    const hasManagementFee = combined.includes('관리비') && combined.includes('포함');

    let includedYear = null;
    const yearMatch = combined.match(/(\d+)년\s*(관리비)?.*포함/);
    if (yearMatch) {
        includedYear = parseInt(yearMatch[1]);
    }

    return { hasInstallation, hasManagementFee, includedYear };
}

(async () => {
    console.log('=== 1~3번 시설 Prisma로 마이그레이션 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    for (let i = 0; i < 3; i++) {
        const facility = facilities[i];
        const facilityId = facility.id;
        const facilityName = facility.name;

        console.log(`━━━ ${i + 1}. ${facilityName} ━━━`);

        // Facility가 DB에 없으면 생성
        await prisma.facility.upsert({
            where: { id: facilityId },
            update: {},
            create: {
                id: facilityId,
                name: facilityName,
                category: facility.category || 'FAMILY_GRAVE',
                address: facility.address || '',
                lat: facility.coordinates?.lat || 0,
                lng: facility.coordinates?.lng || 0,
                minPrice: facility.priceRange?.min ? facility.priceRange.min * 10000 : 0,
                maxPrice: facility.priceRange?.max ? facility.priceRange.max * 10000 : 0,
                description: facility.description,
                hasParking: facility.hasParking || false,
                hasRestaurant: facility.hasRestaurant || false,
                hasStore: facility.hasStore || false,
                hasAccessibility: facility.hasAccessibility || false
            }
        });
        console.log(`  ✅ Facility 생성/확인`);

        const priceTable = facility.priceInfo?.priceTable || {};
        const categories = Object.keys(priceTable);

        console.log(`  카테고리: ${categories.length}개`);

        for (const catName of categories) {
            const catData = priceTable[catName];
            const normalizedName = CATEGORY_MAPPING[catName] || 'other';

            //1. price_category 생성
            const category = await prisma.priceCategory.create({
                data: {
                    facilityId: facilityId,
                    name: catName,
                    normalizedName: normalizedName,
                    orderNo: categories.indexOf(catName)
                }
            });

            console.log(`  ✅ ${catName} (${catData.rows.length}개 항목)`);

            // 2. price_item 일괄 생성
            const priceItems = catData.rows.map(row => {
                const size = extractSize(row.grade || '');
                const groupType = extractGroupType(row.name, row.grade || '');
                const inclusions = checkInclusions(row.name, row.grade || '');

                return {
                    categoryId: category.id,
                    facilityId: facilityId,
                    itemName: row.name,
                    normalizedItemType: normalizedName,
                    groupType: groupType,
                    description: row.grade || null,
                    raw: `${row.name} ${row.grade || ''}`.trim(),
                    price: row.price,
                    unit: row.grade || '1기',
                    sizeValue: size.value,
                    sizeUnit: size.unit,
                    hasInstallation: inclusions.hasInstallation,
                    hasManagementFee: inclusions.hasManagementFee,
                    includedYear: inclusions.includedYear,
                    discountAvailable: false,
                    discountTargets: null,
                    refundRule: null,
                    minQty: 1,
                    maxQty: null
                };
            });


            // 2. price_item 하나씩 생성 (SQLite는 createMany 미지원)
            for (const itemData of priceItems) {
                await prisma.priceItem.create({ data: itemData });
            }
        }

        console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 1~3번 마이그레이션 완료!');
    console.log('\n확인:');
    console.log('  npx prisma studio');

    await prisma.$disconnect();
})();
