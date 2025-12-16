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

        // 시트 1: Price Items
        const priceSheetName = workbook.SheetNames[0];
        const priceRows = xlsx.utils.sheet_to_json(workbook.Sheets[priceSheetName]);

        // 시트 2: Full Text (시트 6에 해당한다고 추정 - 메타 데이터)
        const textSheetName = workbook.SheetNames[1];
        const textRows = xlsx.utils.sheet_to_json(workbook.Sheets[textSheetName]);

        console.log(`Rows - Price: ${priceRows.length}, FullText: ${textRows.length}`);

        // 1. 메타 데이터 매핑 (이름 -> 메타정보)
        const metaMap = new Map();
        textRows.forEach(row => {
            const name = row.FacilityName;
            if (!name) return;

            const meta = extractMeta(row.FullText || '');
            metaMap.set(name, meta);
        });

        // 2. 가격 데이터 매핑 (이름 -> 가격항목들)
        const priceMap = new Map();
        priceRows.forEach(row => {
            const name = row.FacilityName;
            if (!name) return;

            if (!priceMap.has(name)) {
                priceMap.set(name, []);
            }

            if (row.ExtractedName && row.ExtractedPrice) {
                priceMap.get(name).push({
                    name: row.ExtractedName,
                    price: parsePrice(row.ExtractedPrice),
                    raw: row.RawLine
                });
            }
        });

        console.log(`Unique facilities (Price): ${priceMap.size}`);
        console.log(`Unique facilities (Meta): ${metaMap.size}`);

        let updatedCount = 0;

        // DB 업데이트 루프
        // priceMap에 있는 시설들을 기준으로 순회 (여기에 없는 시설은 업데이트 안 함)
        for (const [facilityName, items] of priceMap) {

            // DB에서 찾기
            const facility = await prisma.facility.findFirst({
                where: { name: facilityName }
            });

            if (!facility) {
                // console.log(`⚠️ Facility not found in DB: ${facilityName}`);
                continue;
            }

            const meta = metaMap.get(facilityName) || {};

            // 업데이트 내용 준비
            const updateData = {};
            if (meta.address && meta.address.length > 5) updateData.address = meta.address;

            // 편의시설 업데이트
            if (meta.hasParking) updateData.hasParking = true;

            // Description에 메타 정보 추가 (기존 description 유지하면서)
            let newDesc = facility.description || '';
            const addDesc = [];

            // 전화번호가 있고 기존 설명에 없으면 추가
            if (meta.phone && !newDesc.includes(meta.phone)) {
                addDesc.push(`전화문의: ${meta.phone}`);
            }
            // 매장능력이 있고 기존 설명에 없으면 추가
            if (meta.capacity > 0 && !newDesc.includes('매장능력')) {
                addDesc.push(`총매장능력: ${meta.capacity.toLocaleString()}기`);
            }

            if (addDesc.length > 0) {
                updateData.description = (newDesc ? newDesc + '\n' : '') + addDesc.join('\n');
            }

            // Facility 업데이트 실행
            await prisma.facility.update({
                where: { id: facility.id },
                data: updateData
            });

            // 가격 데이터 업데이트 (기존 삭제 후 재등록)
            await prisma.priceItem.deleteMany({ where: { facilityId: facility.id } });
            await prisma.priceCategory.deleteMany({ where: { facilityId: facility.id } });

            if (items.length > 0) {
                await savePriceItems(facility.id, items);
            }

            updatedCount++;
            if (updatedCount % 50 === 0) process.stdout.write('.');
        }

        console.log(`\nFinished! Updated facilities: ${updatedCount}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

function extractMeta(fullText) {
    const lines = fullText.split('\n');
    const result = { address: '', phone: '', capacity: 0, hasParking: false };

    // 주소
    const addrLine = lines.find(l => l.endsWith('주소'));
    if (addrLine) result.address = addrLine.replace(/주소$/, '').trim();

    // 전화번호
    const phoneLine = lines.find(l => l.includes('전화번호'));
    if (phoneLine) {
        const match = phoneLine.match(/([\d-]+)전화번호/);
        if (match) result.phone = match[1];
    }

    // 매장능력
    const capLine = lines.find(l => l.includes('총매장능력'));
    if (capLine) {
        const match = capLine.match(/총매장능력([\d,]+)\s*개/);
        if (match) {
            result.capacity = parseInt(match[1].replace(/,/g, ''), 10);
        }
    }

    // 주차 및 편의시설
    if (fullText.includes('주차') || fullText.includes('🅿️')) {
        result.hasParking = true;
    }

    return result;
}

function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    const clean = String(priceStr).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
}

// -------- 카테고리 분류 로직 (재사용) --------

async function savePriceItems(facilityId, items) {
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
                    description: null,
                    raw: item.raw,
                    price: item.price,
                    unit: '1기',
                    minQty: 1
                }
            });
        }
    }
}

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
        !trimmedName.startsWith('개인') && !trimmedName.startsWith('부부') && !trimmedName.startsWith('가족')) {
        return '매장묘';
    }
    if (combined.includes('작업비') || combined.includes('설치비') || combined.includes('개장') || combined.includes('수선비')) {
        return '매장묘';
    }
    if (combined.includes('봉안당') || combined.includes('봉안담') || combined.includes('개인단') || combined.includes('부부단') || combined.includes('탑형')) {
        return '봉안당';
    }
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }
    if (combined.includes('수목') || combined.includes('정원형') || combined.includes('자연장') || combined.includes('평장')) {
        return '수목장';
    }
    if (combined.includes('매장묘') || combined.includes('매장시설')) {
        if (trimmedName.includes('개인') || trimmedName.includes('부부') || trimmedName.includes('가족') || trimmedName.includes('프리미엄')) {
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

updateFacilitiesFromExcel();
