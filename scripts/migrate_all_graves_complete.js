const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 카테고리 분류 (개선된 버전)
function categorizeItem(name, detail) {
    const combined = (name + ' ' + (detail || '')).toLowerCase();
    const trimmedName = name.trim();

    // 1순위: 기본비용
    if (trimmedName === '사용료' || trimmedName === '묘지사용료' ||
        trimmedName === '관리비' || trimmedName === '묘지관리비' ||
        trimmedName === '시설사용료') {
        return '기본비용';
    }

    // detail에 묘지사용료나 관리비 포함 시 기본비용으로 분류
    if (detail && (detail.includes('묘지사용료') || detail.includes('관리비') ||
        detail.includes('사용료') && !detail.includes('석물'))) {
        return '기본비용';
    }

    // 2순위: 석물
    const stoneKeywords = ['상석', '비석', '와비', '둘레석', '경계석', '묘테',
        '석관', '장대석', '망두석', '좌대', '북석', '혼유',
        '화병', '향로', '월석', '갓석', '오석', '화강석'];

    if (stoneKeywords.some(k => combined.includes(k)) &&
        !trimmedName.startsWith('개인') &&
        !trimmedName.startsWith('부부') &&
        !trimmedName.startsWith('가족')) {
        return '매장묘';
    }

    // 3순위: 작업비
    if (combined.includes('작업비') || combined.includes('설치비') ||
        combined.includes('개장') || combined.includes('수선비')) {
        return '매장묘';
    }

    // 4순위: 봉안당
    if (combined.includes('봉안당') || combined.includes('봉안담') ||
        combined.includes('개인단') || combined.includes('부부단') ||
        combined.includes('탑형')) {
        return '봉안당';
    }

    // 5순위: 봉안묘
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }

    // 6순위: 수목장
    if (combined.includes('수목') || combined.includes('정원형') ||
        combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }

    // 7순위: 개인/부부/가족 매장묘
    if (combined.includes('매장묘') || combined.includes('매장시설')) {
        if (trimmedName.includes('개인') || trimmedName.includes('부부') ||
            trimmedName.includes('가족') || trimmedName.includes('프리미엄')) {
            return '매장묘';
        }
    }

    return '기타';
}

// 그룹명 추출
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

// 시설 처리
async function processFacility(facilityData) {
    const facilityId = facilityData.id;

    // 기존 데이터 삭제
    await prisma.priceItem.deleteMany({ where: { facilityId } });
    await prisma.priceCategory.deleteMany({ where: { facilityId } });

    // 이미지 URL 준비
    const imageUrls = [];
    if (facilityData.imageUrl) imageUrls.push(facilityData.imageUrl);
    if (facilityData.imageGallery && Array.isArray(facilityData.imageGallery)) {
        imageUrls.push(...facilityData.imageGallery);
    }
    const imagesString = imageUrls.join(',');

    // Facility upsert
    await prisma.facility.upsert({
        where: { id: facilityId },
        update: {
            name: facilityData.name,
            category: facilityData.category || 'PARK',
            address: facilityData.address || '',
            lat: facilityData.location?.lat || facilityData.lat || 0,
            lng: facilityData.location?.lng || facilityData.lng || 0,
            minPrice: facilityData.priceRange?.min || 0,
            maxPrice: facilityData.priceRange?.max || 0,
            images: imagesString || null
        },
        create: {
            id: facilityId,
            name: facilityData.name,
            category: facilityData.category || 'PARK',
            address: facilityData.address || '',
            lat: facilityData.location?.lat || facilityData.lat || 0,
            lng: facilityData.location?.lng || facilityData.lng || 0,
            minPrice: facilityData.priceRange?.min || 0,
            maxPrice: facilityData.priceRange?.max || 0,
            images: imagesString || null
        }
    });

    const imageCount = imageUrls.length;

    // 가격 데이터 처리
    if (!facilityData.priceInfo?.priceTable) {
        return { success: true, itemCount: 0, categoryCount: 0, imageCount, reason: 'no_price_data' };
    }

    const priceTable = facilityData.priceInfo.priceTable;
    const allItems = [];

    // ⚠️ 원본 카테고리를 신뢰하지 않고, 모든 항목을 itemName과 detail로만 재분류!
    Object.entries(priceTable).forEach(([sourceCatName, catData]) => {
        if (catData.rows) {
            catData.rows.forEach(row => {
                if (row.price > 0) {
                    allItems.push({
                        name: row.name,
                        price: row.price,
                        detail: row.grade || '',
                        sourceCategory: sourceCatName // 디버깅용
                    });
                }
            });
        }
    });

    if (allItems.length === 0) {
        return { success: true, itemCount: 0, categoryCount: 0, imageCount, reason: 'no_valid_items' };
    }

    // 카테고리별 그룹화
    const grouped = {};
    allItems.forEach(item => {
        const cat = categorizeItem(item.name, item.detail);
        if (!grouped[cat]) grouped[cat] = [];
        const group = extractGroupName(item.name, cat);
        grouped[cat].push({ ...item, group });
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
    let totalSaved = 0;

    for (const [catName, items] of Object.entries(grouped)) {
        const category = await prisma.priceCategory.create({
            data: {
                facilityId,
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: orderNo++
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
            totalSaved++;
        }
    }

    return {
        success: true,
        itemCount: totalSaved,
        categoryCount: Object.keys(grouped).length,
        imageCount
    };
}

// 메인
(async () => {
    const facilitiesData = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const facilities = Array.isArray(facilitiesData) ? facilitiesData : facilitiesData.facilities || facilitiesData;

    // 목표: park-0001 ~ park-0508 (동산공원묘원까지, 묘원만)
    const targetFacilities = facilities.filter(f => {
        const num = parseInt(f.id.replace('park-', ''));
        return num >= 1 && num <= 508 && f.category !== 'CHARNEL_HOUSE';
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  묘원 시설 마이그레이션 (총 ${targetFacilities.length}개)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const results = [];
    let processedCount = 0;
    const startTime = Date.now();
    let lastReportTime = startTime;

    for (const facilityData of targetFacilities) {
        try {
            const result = await processFacility(facilityData);
            processedCount++;

            if (result.success) {
                console.log(`✅ [${processedCount}/${targetFacilities.length}] ${facilityData.name}: ${result.itemCount}개 항목, ${result.categoryCount}개 카테고리, ${result.imageCount}개 이미지`);
            }

            results.push({
                id: facilityData.id,
                name: facilityData.name,
                ...result
            });

            // 1시간마다 보고
            const now = Date.now();
            if (now - lastReportTime > 3600000) { // 1시간
                const elapsed = (now - startTime) / 1000 / 60;
                const rate = processedCount / elapsed;
                const remaining = targetFacilities.length - processedCount;
                const eta = remaining / rate;

                console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`  진행 상황 보고 (${elapsed.toFixed(1)}분 경과)`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`  완료: ${processedCount}/${targetFacilities.length} (${(processedCount / targetFacilities.length * 100).toFixed(1)}%)`);
                console.log(`  속도: ${rate.toFixed(1)}개/분`);
                console.log(`  예상 완료: ${eta.toFixed(1)}분 후`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

                lastReportTime = now;
            }

        } catch (error) {
            console.error(`❌ [${processedCount + 1}/${targetFacilities.length}] ${facilityData.name} 실패:`, error.message);
            results.push({
                id: facilityData.id,
                name: facilityData.name,
                success: false,
                error: error.message
            });
            processedCount++;
        }
    }

    // 최종 결과
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  마이그레이션 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalTime = (Date.now() - startTime) / 1000 / 60;

    console.log(`✅ 성공: ${successful.length}/${targetFacilities.length} (${totalTime.toFixed(1)}분 소요)`);
    console.log(`   총 항목: ${successful.reduce((sum, r) => sum + (r.itemCount || 0), 0)}개`);
    console.log(`   총 이미지: ${successful.reduce((sum, r) => sum + (r.imageCount || 0), 0)}개`);

    if (failed.length > 0) {
        console.log(`\n❌ 실패: ${failed.length}개`);
        failed.slice(0, 10).forEach(r => {
            console.log(`  - ${r.name}: ${r.error || r.reason}`);
        });
        if (failed.length > 10) {
            console.log(`  ... 그 외 ${failed.length - 10}개`);
        }
    }

    await prisma.$disconnect();
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
