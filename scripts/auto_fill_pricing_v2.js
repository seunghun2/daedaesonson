const { chromium } = require('playwright');

// 1번 시설 가격 데이터
const facilityData = {
    id: 'park-0001',
    name: '(재)낙원추모공원',
    pricing: {
        '매장묘': [
            { name: '기본 매장묘 사용료', price: 3000000, isRepresentative: false },
            { name: '합장 매장묘 사용료', price: 500000, isRepresentative: true }, // 최저가
            { name: '대장작업비', price: 1500000, isRepresentative: false }
        ]
    }
};

async function autoFillPricing() {
    console.log('🚀 자동 가격 입력 시작!\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 800
    });

    const page = await browser.newPage();

    try {
        // 1. Admin 페이지 열기
        console.log('📄 /admin/upload 페이지 열기...\n');
        await page.goto('http://localhost:3000/admin/upload');
        await page.waitForLoadState('networkidle');

        // 2. 시설 검색
        console.log(`🔍 시설 검색: ${facilityData.name}\n`);
        const searchInput = await page.locator('input[placeholder*="시설"]').first();
        await searchInput.fill(facilityData.name);
        await page.waitForTimeout(1000);

        // 3. 첫 번째 행의 편집 버튼(연필 아이콘) 클릭
        console.log('✏️  편집 버튼 클릭...\n');
        const editButton = await page.locator('button svg').first(); // 연필 아이콘
        await editButton.click();
        await page.waitForTimeout(1500);

        // 4. "가격표 관리" 탭 클릭
        console.log('💰 가격표 관리 탭 클릭...\n');
        const priceTab = await page.locator('text="가격표 관리"');
        await priceTab.click();
        await page.waitForTimeout(1000);

        // 5. "매장묘" 탭 클릭
        console.log('📋 매장묘 탭 클릭...\n');
        const graveTab = await page.locator('text="매장묘"').first();
        await graveTab.click();
        await page.waitForTimeout(1000);

        // 6. 기존 행 삭제 (있다면)
        console.log('🗑️  기존 데이터 초기화...\n');
        try {
            const deleteButtons = await page.locator('button:has-text("삭제")');
            const count = await deleteButtons.count();
            for (let i = 0; i < count; i++) {
                await deleteButtons.first().click();
                await page.waitForTimeout(300);
            }
        } catch (e) {
            console.log('  (기존 데이터 없음)\n');
        }

        // 7. 새 그룹 추가
        console.log('➕ 새 그룹 추가...\n');
        const addGroupBtn = await page.locator('button:has-text("새 그룹"), button:has-text("추가")').first();
        await addGroupBtn.click();
        await page.waitForTimeout(1000);

        // 8. 각 항목 입력
        const rows = facilityData.pricing['매장묘'];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            console.log(`📝 항목 ${i + 1}: ${row.name} - ${row.price.toLocaleString()}원\n`);

            // 새 행 추가 (첫 번째 제외)
            if (i > 0) {
                const addRowBtn = await page.locator('button:has-text("행 추가"), button:has-text("+")').last();
                await addRowBtn.click();
                await page.waitForTimeout(500);
            }

            // 항목명 입력
            const nameInputs = await page.locator('input[type="text"]').filter({ hasNot: page.locator('input[placeholder*="검색"]') });
            await nameInputs.nth(i * 2).fill(row.name);
            await page.waitForTimeout(300);

            // 가격 입력
            const priceInputs = await page.locator('input[type="number"]');
            await priceInputs.nth(i).fill(row.price.toString());
            await page.waitForTimeout(300);

            // 대표 가격 별 클릭
            if (row.isRepresentative) {
                console.log(`⭐ 대표 가격 설정: ${row.name}\n`);
                const starButtons = await page.locator('button:has-text("★"), button:has-text("☆")');
                await starButtons.nth(i).click();
                await page.waitForTimeout(500);
            }
        }

        // 9. 저장 버튼 클릭
        console.log('💾 저장 중...\n');
        const saveBtn = await page.locator('button:has-text("저장")').last();
        await saveBtn.click();
        await page.waitForTimeout(3000);

        console.log('\n✅ 완료!\n');
        console.log('💡 결과를 확인하세요. 10초 후 자동 종료됩니다.\n');

        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('\n❌ 에러:', error.message);
        await page.screenshot({ path: 'error.png' });
        console.log('📸 스크린샷 저장: error.png\n');
        await page.waitForTimeout(5000);
    } finally {
        await browser.close();
    }
}

autoFillPricing();
