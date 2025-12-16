const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Excel 파일 경로
const MASTER_FILE = 'park_price_master.xlsx';

// 1. 제외 키워드 (강력하게 제외)
const EXCLUDE_KEYWORDS = [
    // 장례용품 / 소모품
    '유골함', '수의', '관', '횡대', '결관', '명정', '위패', '성경책',
    '화병', '향로', '독서대', '사진', '메탈포토', '액자', '꽃', '조화', '화분', '식재', '나무', '철쭉',
    '잔디', // 잔디 추가

    // 서비스 / 의식 / 식사
    '천막', '식사', '식당', '밥', // 식당/밥 추가
    '안치단', '제례', '개토제', '산신제', '위령제',
    '반혼제', '평토제', '성분제', '의전', '상조', '리무진', '버스',
    '엠뷸런스', '운구', '접객', '도우미', '벌초', '성묘', '대행', '제사', '차례', '예초', '전지',

    // 작업비 / 설치비 / 부대비용
    '작업비', '설치비', '개장', '수선', '이장', '파묘', '화장',
    '봉분', '리모델링', '토목', '공사', '각자', '글자', '철거', '운반',

    // 석물 부속 (묘지 자체가 아닌 부속품들)
    '상석', '비석', '와비', '둘레석', '묘테', '경계석', '석관', '석곽', '석실', // 석실 추가
    '월석', '표석', '가족표석', '부부표석', '갓', '좌대', '판석', '석등', '걸방석', '구판', // 구판 추가

    // 기타 잡동사니
    '만족도', '배너', '개인정보', '보건복지부', '장례문화진흥원', 'Copyright',
    '로그인', '회원가입', '원격지원', '화장예약', '선택한 상품', '궁금한게',
    '하늘e', '눌러주세요', '닫기', '열기', '지도', '길찾기', '공유', '금액',
    '품명', '규격', '재질', '원산지', '생산지',

    // 낙원추모공원 특화 제외
    '담장형 월석'
];

async function updateSingleFacility() {
    try {
        console.log(`Reading ${MASTER_FILE}...`);
        const workbook = xlsx.readFile(MASTER_FILE);

        // 시트 1: 가격 정보 (원본 데이터)
        const priceSheetName = workbook.SheetNames[0];
        const priceRows = xlsx.utils.sheet_to_json(workbook.Sheets[priceSheetName]);

        // Target: 낙원추모공원 only
        const targetName = '(재)낙원추모공원';
        const rawItems = priceRows.filter(row => row.FacilityName === targetName);

        if (rawItems.length === 0) {
            console.log('낙원추모공원 데이터를 찾을 수 없습니다.');
            return;
        }

        // Filtering
        const validItems = [];
        rawItems.forEach(item => {
            let text = (item.ExtractedName + ' ' + (item.RawLine || '')).toLowerCase();

            // 제외 키워드 검사 (관리비 제외하고 다 필터)
            if (text.includes('관리비')) {
                validItems.push(item);
                return;
            }

            let isExcluded = false;
            for (const keyword of EXCLUDE_KEYWORDS) {
                if (text.includes(keyword)) {
                    isExcluded = true;
                    break;
                }
            }

            if (!isExcluded && item.ExtractedName && item.ExtractedName.trim() !== '') {
                validItems.push(item);
            }
        });

        console.log(`\n=== [(재)낙원추모공원] 업데이트 준비 ===`);
        console.log(`원본 항목: ${rawItems.length}개 -> 필터링 후: ${validItems.length}개`);

        // DB Find
        const facility = await prisma.facility.findFirst({
            where: { name: targetName }
        });

        if (!facility) {
            console.log('DB에서 시설을 찾을 수 없습니다.');
            return;
        }

        console.log(`DB Facility ID: ${facility.id}`);

        // 기존 가격 삭제
        await prisma.priceItem.deleteMany({ where: { facilityId: facility.id } });
        await prisma.priceCategory.deleteMany({ where: { facilityId: facility.id } });

        // 가격 저장
        await savePriceItems(facility.id, validItems.map(item => ({
            name: item.ExtractedName,
            price: parsePrice(item.ExtractedPrice),
            raw: item.RawLine
        })));

        console.log('\n✅ 업데이트 완료!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

function parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    const clean = String(priceStr).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
}

// -------- 카테고리 분류 및 저장 로직 --------
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

    // 제외 키워드에 해당하는 걸 제외했으므로, 남은 것 중에서 분류
    if (combined.includes('봉안당') || combined.includes('봉안담') || combined.includes('개인단') || combined.includes('부부단') || combined.includes('탑형') || combined.includes('청여')) {
        return '봉안당';
    }
    if (combined.includes('봉안') && !combined.includes('봉안당')) {
        return '봉안묘';
    }
    if (combined.includes('수목') || combined.includes('정원형') || combined.includes('자연장') || combined.includes('평장') || combined.includes('플라타너스') || combined.includes('다알리아') || combined.includes('클로버') || combined.includes('아이리스')) {
        return '수목장';
    }

    // 매장묘 관련 키워드가 부족할 경우 보완
    if (combined.includes('매장') || combined.includes('묘') || combined.includes('봉분')) {
        return '매장묘';
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
        return '매장묘';
    }
    if (category === '봉안당') {
        if (name.includes('개인')) return '개인단';
        if (name.includes('부부')) return '부부단';
        if (name.includes('가족')) return '가족단';
        if (name.includes('청여')) return '청여';
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

updateSingleFacility();
