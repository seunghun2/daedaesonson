const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Excel 파일 경로
const MASTER_FILE = 'park_price_master.xlsx';

async function updateFacilitiesFromExcel() {
    try {
        console.log(`Reading ${MASTER_FILE}...`);
        const workbook = xlsx.readFile(MASTER_FILE);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(`Total rows in Excel: ${rows.length}`);

        // 시설별로 데이터 그룹화
        const facilityMap = new Map();

        rows.forEach(row => {
            // FileName에서 facility ID 또는 핵심 키를 추출하여 매핑해야 함.
            // 하지만 여기서는 FacilityName을 기준으로 할 수 있을지 확인
            const name = row.FacilityName;
            if (!name) return;

            if (!facilityMap.has(name)) {
                facilityMap.set(name, []);
            }

            // 유효한 가격 정보만 담기
            if (row.ExtractedName && row.ExtractedPrice) {
                facilityMap.get(name).push({
                    name: row.ExtractedName,
                    price: parsePrice(row.ExtractedPrice),
                    raw: row.RawLine
                });
            }
        });

        console.log(`Unique facilities found: ${facilityMap.size}`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const [facilityName, items] of facilityMap) {
            // DB에서 시설 찾기 (이름으로 매칭)
            // 주의: 이름이 정확히 일치하지 않을 수 있음.
            const facility = await prisma.facility.findFirst({
                where: { name: facilityName }
            });

            if (!facility) {
                console.log(`⚠️ Facility not found in DB: ${facilityName}`);
                continue;
            }

            console.log(`Updating ${facilityName} (${facility.id})... Items: ${items.length}`);

            // 기존 가격 데이터 삭제 (재설정)
            await prisma.priceItem.deleteMany({ where: { facilityId: facility.id } });
            await prisma.priceCategory.deleteMany({ where: { facilityId: facility.id } });

            if (items.length === 0) continue;

            // 카테고리 분류 및 저장 로직 (migrate_all_graves_complete.js 로직 재사용)
            await savePriceItems(facility.id, items);
            updatedCount++;
        }

        console.log(`Finished! Updated: ${updatedCount}, DB Missing: ${facilityMap.size - updatedCount}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    // "3000000" or "3,000,000" -> 3000000
    const clean = String(priceStr).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
}


// -------- 카테고리 분류 로직 (재사용) --------

async function savePriceItems(facilityId, items) {
    // 1. 그룹화
    const grouped = {};
    items.forEach(item => {
        const cat = categorizeItem(item.name, item.raw);
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

    let orderNo = 0;

    for (const [catName, groupItems] of Object.entries(grouped)) {
        const category = await prisma.priceCategory.create({
            data: {
                facilityId,
                name: catName,
                normalizedName: CATEGORY_MAPPING[catName] || 'other',
                orderNo: orderNo++
            }
        });

        for (const item of groupItems) {
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id,
                    facilityId,
                    itemName: item.name,
                    normalizedItemType: CATEGORY_MAPPING[catName] || 'other',
                    groupType: item.group,
                    description: null, // 상세 설명은 RawLine에서 가져올 수도 있지만 일단 비움
                    raw: item.raw,
                    price: item.price,
                    unit: '1기', // 기본값
                    minQty: 1
                }
            });
        }
    }
}

// 카테고리 분류 헬퍼
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

// 그룹명 추출 헬퍼
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

updateFacilitiesFromExcel();
