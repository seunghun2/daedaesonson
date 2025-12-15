const { chromium } = require('playwright');

const facilityData = {
    id: 'park-0001',
    name: '(재)낙원추모공원',
    pricing: {
        '매장묘': [
            { name: '기본 매장묘 사용료', price: 3000000, isRepresentative: false },
            { name: '합장 매장묘 사용료', price: 500000, isRepresentative: true },
            { name: '대장작업비', price: 1500000, isRepresentative: false }
        ]
    }
};

async function autoFillPricing() {
    console.log('🚀 자동 가격 입력 시작!\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const page = await browser.newPage();

    try {
        await page.goto('http://localhost:3000/admin/upload');
        await page.waitForLoadState('networkidle');

        console.log(`🔍 시설 검색: ${facilityData.name}\n`);
        const searchInput = await page.locator('input[placeholder*="시설"]').first();
        await searchInput.fill(facilityData.name);
        await page.waitForTimeout(1000);

        console.log('✏️  편집 버튼 클릭...\n');
        const editButton = await page.locator('tbody tr').first().locator('button').first();
        await editButton.click();
        await page.waitForTimeout(1500);

        console.log('💰 가격표 관리 탭 클릭...\n');
        await page.locator('text="가격표 관리"').click();
        await page.waitForTimeout(1000);

        console.log('📋 매장묘 탭 클릭...\n');
        await page.locator('text="매장묘"').first().click();
        await page.waitForTimeout(1000);

        console.log('📂 매장묘 섹션 아코디언 확장...\n');
        // "매장묘" 섹션 아코디언 클릭 (0 항목, 1 항목 등)
        const sectionAccordion = page.locator('button:has-text("항목")').first();
        await sectionAccordion.click();
        await page.waitForTimeout(1000);

        // 빈 상태 확인 및 처리
        console.log('🔍 빈 상태 확인...\n');
        const addGroupBtn = page.locator('button:has-text("새 그룹 추가")');
        const hasAddButton = await addGroupBtn.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasAddButton) {
            console.log('➕ 새 그룹 추가 클릭...\n');
            await addGroupBtn.click();
            await page.waitForTimeout(1500);
        } else {
            console.log('⚠️  새 그룹 추가 버튼을 찾을 수 없습니다.\n');
        }

        // 생성된 그룹의 아코디언 확장
        console.log('📂 그룹 아코디언 확장...\n');
        const groupAccordion = page.locator('.mantine-Accordion-item button').first();
        const isGroupVisible = await groupAccordion.isVisible({ timeout: 2000 }).catch(() => false);

        if (isGroupVisible) {
            await groupAccordion.click();
            await page.waitForTimeout(800);
        }

        const rows = facilityData.pricing['매장묘'];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            console.log(`📝 항목 ${i + 1}: ${row.name} - ${row.price.toLocaleString()}원\n`);

            // 첫 번째 항목이 아니면 "+ 행 추가" 클릭
            if (i > 0) {
                const addRowBtn = await page.locator('.mantine-Accordion-content button').filter({ hasText: '항목 추가' }).first();
                await addRowBtn.click();
                await page.waitForTimeout(800);
            }

            // 각 행의 필드들을 찾기 (행별로)
            const rows_elements = await page.locator('.mantine-Accordion-content > div > div').all();

            if (rows_elements[i]) {
                // 상품명 (첫 번째 input)
                const nameInput = await rows_elements[i].locator('input').nth(0);
                await nameInput.fill(row.name);
                await page.waitForTimeout(300);

                // 가격 (세 번째 input - 숫자 타입)
                const priceInput = await rows_elements[i].locator('input[type="number"]').first();
                await priceInput.fill(row.price.toString());
                await page.waitForTimeout(300);

                // 대표 가격 별 클릭
                if (row.isRepresentative) {
                    console.log(`⭐ 대표 가격 설정: ${row.name}\n`);
                    const starBtn = await rows_elements[i].locator('button').first();
                    await starBtn.click();
                    await page.waitForTimeout(500);
                }
            }
        }

        console.log('💾 저장 중...\n');
        await page.locator('button:has-text("저장")').last().click();
        await page.waitForTimeout(3000);

        console.log('\n✅ 완료! 10초 후 종료...\n');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('\n❌ 에러:', error.message);
        await page.screenshot({ path: 'error2.png', fullPage: true });
        console.log('📸 스크린샷: error2.png\n');
        await page.waitForTimeout(10000);
    } finally {
        await browser.close();
    }
}

autoFillPricing();
