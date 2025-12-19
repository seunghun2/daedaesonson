/**
 * API에서 priceInfo를 가져와서 priceRange.min 업데이트
 */

const fs = require('fs');
const path = require('path');

// 제외할 카테고리 패턴
const EXCLUDE_PATTERN = /옵션|관리비|기타|공통|제외|석물|비고|안내|별도/;

// 시설 카테고리별 우선 키워드
const CATEGORY_KEYWORDS = {
    'FAMILY_GRAVE': ['매장', '묘지', '분양'],
    'CHARNEL_HOUSE': ['봉안', '납골', '안치'],
    'NATURAL_BURIAL': ['수목', '자연', '잔디', '화초']
};

async function fetchPriceInfo(facilityId) {
    const url = `http://localhost:3000/api/facilities/${facilityId}/prices`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
}

function getRepPrice(priceTable, category) {
    if (!priceTable) return null;

    const subRepItems = [];

    Object.keys(priceTable).forEach(key => {
        if (EXCLUDE_PATTERN.test(key)) return;

        const cat = priceTable[key];
        if (cat && Array.isArray(cat.rows)) {
            const rep = cat.rows.find(r => r.isRepresentative);
            if (rep && rep.price > 0) {
                const priceInWon = Number(rep.price);
                const priceInManwon = priceInWon >= 10000 ? Math.round(priceInWon / 10000) : priceInWon;
                subRepItems.push({ label: key, price: priceInManwon });
            }
        }
    });

    if (subRepItems.length === 0) return null;

    const preferredKeywords = CATEGORY_KEYWORDS[category] || [];
    const mainItem = subRepItems.find(item =>
        preferredKeywords.some(k => item.label.includes(k))
    ) || subRepItems[0];

    return mainItem;
}

async function main() {
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

    console.log(`총 ${facilities.length}개 시설 처리 시작...`);

    let updatedCount = 0;

    for (let i = 0; i < facilities.length; i++) {
        const fac = facilities[i];

        try {
            const priceInfo = await fetchPriceInfo(fac.id);
            if (!priceInfo?.priceTable) continue;

            const mainItem = getRepPrice(priceInfo.priceTable, fac.category);

            if (mainItem) {
                const oldMin = fac.priceRange?.min;
                const newMin = mainItem.price;

                if (oldMin !== newMin) {
                    if (!fac.priceRange) fac.priceRange = {};
                    fac.priceRange.min = newMin;
                    console.log(`[${fac.id}] ${fac.name}: ${oldMin || 0} → ${newMin} (${mainItem.label})`);
                    updatedCount++;
                }
            }
        } catch (err) {
            // skip
        }

        // 진행상황
        if (i % 100 === 0) {
            console.log(`진행: ${i}/${facilities.length} (${updatedCount}개 업데이트)`);
            // 중간 저장
            fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');
        }

        await new Promise(r => setTimeout(r, 20)); // Rate limit
    }

    // 최종 저장
    fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');

    console.log(`\n완료! 총 ${updatedCount}개 업데이트`);
}

main().catch(console.error);
