const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ---------------------------------------------------------
// 1. 유틸리티: 카테고리 분류 로직
// ---------------------------------------------------------
function categorizeItem(name, price) {
    const n = name.replace(/\s+/g, '').toLowerCase();

    // 기본비용 (가장 우선)
    if (n.includes('관리비') && !n.includes('석') && !n.includes('묘')) return '기본비용';
    if (n.includes('사용료') && !n.includes('석')) return '기본비용';
    if (/^\d+평$/.test(name)) return '기본비용';

    // 매장묘 관련 (석물, 작업비 등)
    if (n.includes('상석') || n.includes('비석') || n.includes('와비') || n.includes('둘레석') || n.includes('묘테')) return '매장묘';
    if (n.includes('망두') || n.includes('장대') || n.includes('석관') || n.includes('화병') || n.includes('향로')) return '매장묘';
    if (n.includes('봉분') || n.includes('개장') || n.includes('작업비') || n.includes('용역비') || n.includes('매장비')) return '매장묘';
    if (n.includes('매장') && !n.includes('사용료') && !n.includes('관리비')) return '매장묘';
    if (n.includes('평장') && !n.includes('분양') && !n.includes('사용료')) return '수목장';

    // 시설 유형
    if (n.includes('봉안당') || n.includes('부부단') || n.includes('개인단')) return '봉안당';
    if (n.includes('봉안묘')) return '봉안묘';
    if (n.includes('수목') || n.includes('자연장')) return '수목장';

    return '기타';
}

function normalizeCategory(catKO) {
    const map = {
        '기본비용': 'base_cost',
        '매장묘': 'grave',
        '봉안묘': 'charnel_grave',
        '봉안당': 'charnel_house',
        '수목장': 'natural',
        '기타': 'other'
    };
    return map[catKO] || 'other';
}

function getOrder(catKO) {
    const map = { '기본비용': 0, '매장묘': 1, '봉안묘': 2, '봉안당': 3, '수목장': 4, '기타': 5 };
    return map[catKO] || 5;
}

// ---------------------------------------------------------
// 2. 유틸리티: 텍스트 파싱 개선 (수량 '1' 처리)
// ---------------------------------------------------------
function parsePdfText(text) {
    const lines = text.split('\n');
    const items = [];

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine.length < 3) return;

        // case 1: "항목명 1,000,000" (맨 뒤가 가격)
        let priceMatch = cleanLine.match(/(\d{1,3}(?:,\d{3})+)원?$/);

        // case 2: "항목명 1,000,000 1" (맨 뒤가 수량이고 그 앞이 가격)
        if (!priceMatch) {
            priceMatch = cleanLine.match(/(\d{1,3}(?:,\d{3})+)원?\s+\d+$/);
        }

        if (priceMatch) {
            const priceStr = priceMatch[1]; // 첫번째 캡쳐그룹이 가격
            const price = parseInt(priceStr.replace(/,/g, ''), 10);

            // 가격 매치 부분(전체 매치 문자열)을 기준으로 앞부분 자르기
            let namePart = cleanLine.substring(0, cleanLine.indexOf(priceMatch[0])).trim();

            // 이름 정제
            namePart = namePart.replace(/\s+/g, ' ');

            if (namePart.length > 0 && price > 0) {
                // 중복 체크 (같은 줄에서 파싱된 것이 아닌 경우)
                items.push({ name: namePart, price: price });
            }
        }
    });
    return items;
}

async function processFacility(num) {
    const id = `park-${String(num).padStart(4, '0')}`;
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const fJson = facilities.find(f => f.id === id);
    if (!fJson) return;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${num}] ${fJson.name}`);

    // PDF 찾기
    const archivePath = path.join(__dirname, '../archive');
    let pdfPath = null;
    if (fs.existsSync(archivePath)) {
        const dirs = fs.readdirSync(archivePath);
        const targetDir = dirs.find(d => d.startsWith(`${num}.`));
        if (targetDir) {
            const files = fs.readdirSync(path.join(archivePath, targetDir));
            const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf') && f.includes('price'));
            if (pdfFile) pdfPath = path.join(archivePath, targetDir, pdfFile);
        }
    }

    let finalItems = [];

    // JSON 데이터 (백업용, 소스로 표시)
    if (fJson.priceInfo?.priceTable) {
        Object.values(fJson.priceInfo.priceTable).forEach(cat => {
            if (cat.rows) {
                cat.rows.forEach(r => {
                    if (r.price > 0) finalItems.push({ name: r.name, price: r.price, source: 'JSON', detail: r.grade });
                });
            }
        });
    }

    // PDF 데이터 파싱
    if (pdfPath) {
        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const pdfItems = parsePdfText(data.text);

            let addedCount = 0;
            pdfItems.forEach(pItem => {
                // 중복 체크: 이름이나 가격이 완전히 같으면 제외 (JSON 우선)
                // 하지만 이름이 JSON쪽이 '매장묘 (단장)' 처럼 다를 수 있으니, 가격이 같으면 중복으로 의심
                const exists = finalItems.find(existing => existing.price === pItem.price && (
                    existing.name.includes(pItem.name) || pItem.name.includes(existing.name)
                ));

                if (!exists) {
                    if (!/전화|주소|업데이트|홈페이지|팩스|만족도|개인정보/.test(pItem.name)) {
                        finalItems.push({ name: pItem.name, price: pItem.price, source: 'PDF', detail: null });
                        addedCount++;
                    }
                }
            });
            console.log(`   ➕ PDF에서 ${addedCount}개 항목 추가됨!`);

        } catch (e) {
            console.log(`   ⚠️ PDF 읽기 실패: ${e.message}`);
        }
    }

    // DB 저장
    await prisma.priceItem.deleteMany({ where: { facilityId: id } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: id } });

    const grouped = {};
    finalItems.forEach(item => {
        let cat = categorizeItem(item.name, item.price);
        // 카테고리 보정
        if (cat === '기타' && (item.name.includes('사용료') || item.name.includes('관리비'))) cat = '기본비용';

        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    for (const [catName, items] of Object.entries(grouped)) {
        if (items.length === 0) continue;
        const category = await prisma.priceCategory.create({
            data: {
                facilityId: id,
                name: catName,
                normalizedName: normalizeCategory(catName),
                orderNo: getOrder(catName)
            }
        });
        for (const item of items) {
            await prisma.priceItem.create({
                data: {
                    categoryId: category.id, facilityId: id,
                    itemName: item.name, normalizedItemType: normalizeCategory(catName),
                    groupType: '미분류', description: item.detail,
                    raw: `${item.name} (${item.source})`,
                    price: BigInt(item.price), unit: '1기',
                    hasInstallation: false, hasManagementFee: false, minQty: 1
                }
            });
        }
    }

    // 결과 출력
    Object.entries(grouped).forEach(([c, i]) => {
        console.log(`   [${c}] ${i.length}개`);
        i.forEach(item => console.log(`      - ${item.name}: ${item.price.toLocaleString()}원`));
    });
}

(async () => {
    await processFacility(47);
})();
