const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 카테고리 로직 (동일)
function categorizeItem(name, price) {
    const n = name.replace(/\s+/g, '').toLowerCase();
    if (n.includes('관리비') && !n.includes('석') && !n.includes('묘')) return '기본비용';
    if (n.includes('사용료') && !n.includes('석')) return '기본비용';
    if (/^\d+평$/.test(name)) return '기본비용';
    if (n.includes('상석') || n.includes('비석') || n.includes('와비') || n.includes('둘레석') || n.includes('묘테')) return '매장묘';
    if (n.includes('망두') || n.includes('장대') || n.includes('석관') || n.includes('화병') || n.includes('향로')) return '매장묘';
    if (n.includes('봉분') || n.includes('개장') || n.includes('작업비') || n.includes('용역비') || n.includes('매장비')) return '매장묘';
    if (n.includes('매장') && !n.includes('사용료') && !n.includes('관리비')) return '매장묘';
    if (n.includes('평장') && !n.includes('분양') && !n.includes('사용료')) return '수목장';
    if (n.includes('봉안당') || n.includes('부부단') || n.includes('개인단')) return '봉안당';
    if (n.includes('봉안묘')) return '봉안묘';
    if (n.includes('수목') || n.includes('자연장')) return '수목장';
    return '기타';
}

function normalizeCategory(catKO) {
    const map = { '기본비용': 'base_cost', '매장묘': 'grave', '봉안묘': 'charnel_grave', '봉안당': 'charnel_house', '수목장': 'natural', '기타': 'other' };
    return map[catKO] || 'other';
}

function getOrder(catKO) {
    const map = { '기본비용': 0, '매장묘': 1, '봉안묘': 2, '봉안당': 3, '수목장': 4, '기타': 5 };
    return map[catKO] || 5;
}

// ---------------------------------------------------------
// 파싱 로직 개선 (핵심)
// ---------------------------------------------------------
function parsePdfText(text) {
    const lines = text.split('\n');
    const items = [];

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine.length < 3) return;

        // 패턴 1: "항목명 가격 1" (가격 뒤에 수량 1이 붙음)
        // 예: "사용료 단장묘 359,440 1"
        // 예: "관리비 단장묘 240,000 1"
        let match = cleanLine.match(/^(.*?)\s+([\d,]+)\s+\d+$/);

        // 패턴 2: "항목명 가격" (수량 없음)
        // 예: "매장비 단장묘 240,000"
        if (!match) {
            match = cleanLine.match(/^(.*?)\s+([\d,]+)$/);
        }

        if (match) {
            const namePart = match[1].trim();
            const priceStr = match[2].replace(/,/g, '');
            const price = parseInt(priceStr, 10);

            // 유효성 체크
            // 1. 가격이 100원 이상이어야 함 (페이지 번호 등 제외)
            // 2. 이름이 너무 짧거나 숫자로만 되어 있으면 제외
            if (price >= 100 && namePart.length > 1 && !/^\d+$/.test(namePart)) {

                // 이름 정제
                const cleanName = namePart.replace(/\s+/g, ' ');

                // 중복 체크
                if (!items.some(i => i.name === cleanName && i.price === price)) {
                    items.push({ name: cleanName, price: price });
                }
            }
        }
    });
    return items;
}

async function processFacility(num) {
    const id = `park-${String(num).padStart(4, '0')}`;
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const fJson = facilities.find(f => f.id === id);

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

    // JSON 데이터
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
        if (cat === '기타' && (item.name.includes('사용료') || item.name.includes('관리비'))) cat = '기본비용';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    for (const [catName, items] of Object.entries(grouped)) {
        if (items.length === 0) continue;
        const category = await prisma.priceCategory.create({
            data: { facilityId: id, name: catName, normalizedName: normalizeCategory(catName), orderNo: getOrder(catName) }
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
        console.log(`\n   [${c}] ${i.length}개`);
        i.forEach(item => console.log(`      - ${item.name}: ${item.price.toLocaleString()}원`));
    });
}

(async () => {
    await processFacility(47);
})();
