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
    if (n.includes('봉분') || n.includes('개장') || n.includes('작업비') || n.includes('용역비')) return '매장묘';
    if (n.includes('매장')) return '매장묘';
    if (n.includes('평장') && !n.includes('분양')) return '수목장'; // 평장 석물은 수목장/평장으로

    // 시설 유형
    if (n.includes('봉안당') || n.includes('부부단') || n.includes('개인단')) return '봉안당';
    if (n.includes('봉안묘')) return '봉안묘';
    if (n.includes('수목') || n.includes('자연장')) return '수목장';

    // 기본값
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
// 2. 유틸리티: 텍스트 파싱 (PDF 붙은 글자 분리)
// ---------------------------------------------------------
function parsePdfText(text) {
    const lines = text.split('\n');
    const items = [];

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine.length < 3) return;

        // 가격 찾기 (콤마 포함 숫자)
        // 예: "상석(오석)2.5570,000" -> "상석(오석)2.5" / "570,000"
        // 뒤에서부터 000으로 끝나는 숫자 패턴을 찾음
        const priceMatch = cleanLine.match(/(\d{1,3}(?:,\d{3})+)원?$/);

        if (priceMatch) {
            const priceStr = priceMatch[1];
            const price = parseInt(priceStr.replace(/,/g, ''), 10);

            // 가격을 제외한 앞부분이 이름
            let namePart = cleanLine.substring(0, cleanLine.lastIndexOf(priceMatch[0])).trim();

            // 이름 끝에 붙은 숫자가 있다면? (예: 2.5)
            // 하지만 이건 이름의 일부(규격)일 수 있으므로 떼어내지 않고 그대로 둡니다.
            // 다만, 이름이 너무 짧거나(없거나) 하면 스킵
            if (namePart.length > 0 && price > 0) {
                items.push({ name: namePart, price: price });
            }
        }
    });
    return items;
}

// ---------------------------------------------------------
// 3. 메인 프로세스
// ---------------------------------------------------------
async function processFacility(num, total) {
    const id = `park-${String(num).padStart(4, '0')}`;

    // 1. JSON 데이터 확인
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
    const fJson = facilities.find(f => f.id === id);
    if (!fJson) return; // 없는 시설

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${num}/${total}] ${fJson.name} (${id})`);

    // 2. PDF 찾기
    const archivePath = path.join(__dirname, '../archive');
    let pdfPath = null;

    if (fs.existsSync(archivePath)) {
        const dirs = fs.readdirSync(archivePath);
        // "6.신불산..." 처럼 번호로 시작하는 폴더 찾기
        const targetDir = dirs.find(d => d.startsWith(`${num}.`));
        if (targetDir) {
            const files = fs.readdirSync(path.join(archivePath, targetDir));
            const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf') && f.includes('price'));
            if (pdfFile) {
                pdfPath = path.join(archivePath, targetDir, pdfFile);
            }
        }
    }

    let finalItems = [];

    // 3. JSON 데이터 수집
    if (fJson.priceInfo?.priceTable) {
        Object.values(fJson.priceInfo.priceTable).forEach(cat => {
            if (cat.rows) {
                cat.rows.forEach(r => {
                    if (r.price > 0) finalItems.push({ name: r.name, price: r.price, source: 'JSON', detail: r.grade });
                });
            }
        });
    }

    // 4. PDF 데이터 수집 및 병합
    if (pdfPath) {
        // console.log(`   📄 PDF 발견: ${path.basename(pdfPath)}`);
        try {
            const dataBuffer = fs.readFileSync(pdfPath);
            const data = await pdf(dataBuffer);
            const pdfItems = parsePdfText(data.text);

            let addedCount = 0;
            pdfItems.forEach(pItem => {
                // 이름 유사도 체크 (완전히 같지 않아도 포함되면 중복으로 간주 등)
                // 여기서는 안전하게 '가격'과 '이름'이 모두 일치하면 중복
                const exists = finalItems.find(existing =>
                    existing.name.replace(/\s/g, '') === pItem.name.replace(/\s/g, '') ||
                    (existing.price === pItem.price && existing.name.includes(pItem.name.substr(0, 5)))
                );

                if (!exists) {
                    // 유효성 체크: 이름에 '전화', '주소', '업데이트' 같은 쓰레기 데이터 제외
                    if (!/전화|주소|업데이트|홈페이지|팩스|만족도|개인정보/.test(pItem.name)) {
                        finalItems.push({ name: pItem.name, price: pItem.price, source: 'PDF', detail: null });
                        addedCount++;
                    }
                }
            });
            if (addedCount > 0) console.log(`   ➕ PDF에서 ${addedCount}개 항목 추가됨!`);

        } catch (e) {
            console.log(`   ⚠️ PDF 읽기 실패: ${e.message}`);
        }
    } else {
        console.log(`   ⚪ PDF 없음 (JSON 데이터만 사용)`);
    }

    // 5. DB 저장
    await prisma.priceItem.deleteMany({ where: { facilityId: id } });
    await prisma.priceCategory.deleteMany({ where: { facilityId: id } });

    // 카테고리별 그룹화
    const grouped = {};
    finalItems.forEach(item => {
        let cat = categorizeItem(item.name, item.price);

        // 이름 표준화 (기본비용)
        if (cat === '기본비용') {
            if (item.name.includes('관리비')) item.name = '묘지 관리비';
            else item.name = '묘지사용료';
        }

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
                    categoryId: category.id,
                    facilityId: id,
                    itemName: item.name,
                    normalizedItemType: normalizeCategory(catName),
                    groupType: '미분류',
                    description: item.detail,
                    raw: `${item.name} (${item.source})`,
                    price: BigInt(item.price),
                    unit: '1기',
                    hasInstallation: false,
                    hasManagementFee: false,
                    minQty: 1
                }
            });
        }
    }

    const summary = Object.entries(grouped).map(([c, i]) => `${c} ${i.length}`).join(', ');
    console.log(`   ✅ 저장 완료: 총 ${finalItems.length}개 (${summary})`);
}

// ---------------------------------------------------------
// 실행
// ---------------------------------------------------------
(async () => {
    const START = 6;
    const END = 55;

    console.log(`작업 시작: 시설 #${START} ~ #${END} (총 ${END - START + 1}개)`);

    for (let i = START; i <= END; i++) {
        await processFacility(i, END);
    }

    console.log(`\n🎉 1차 배치 완료!`);
})();
