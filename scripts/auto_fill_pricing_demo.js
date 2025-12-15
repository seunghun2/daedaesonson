const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 1번 시설 가격 데이터 (이미지에서 추출 및 가공)
const facilityData = {
    id: 'park-0001',
    name: '(재)낙원추모공원',
    pricing: {
        '매장묘': {
            category: 'grave',
            unit: '원',
            rows: [
                {
                    name: '기본 매장묘 사용료',
                    price: 3000000,
                    description: '',
                    isRepresentative: false
                },
                {
                    name: '합장 매장묘 사용료',
                    price: 500000,
                    description: '',
                    isRepresentative: true // 최저가
                },
                {
                    name: '대장작업비',
                    price: 1500000,
                    description: '',
                    isRepresentative: false
                }
            ]
        }
    }
};

async function autoFillPricing() {
    console.log('🚀 자동 가격 입력 시작!\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 500 // 천천히 실행 (볼 수 있도록)
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Admin 페이지 열기
        console.log('📄 /admin/upload 페이지 열기...\n');
        await page.goto('http://localhost:3000/admin/upload');
        await page.waitForTimeout(2000);

        // 2. 시설 검색
        console.log(`🔍 시설 검색: ${facilityData.name}\n`);
        const searchInput = page.locator('input[placeholder*="시설"], input[type="search"]').first();
        await searchInput.fill(facilityData.name);
        await page.waitForTimeout(1000);

        // 3. 시설 선택 (첫 번째 결과 클릭)
        console.log('✅ 시설 선택 중...\n');
        const firstResult = page.locator('text=' + facilityData.name).first();
        await firstResult.click();
        await page.waitForTimeout(2000);

        // 4. 가격 탭으로 이동
        console.log('💰 가격 탭으로 이동...\n');
        const priceTab = page.locator('text="가격 정보"').or(page.locator('text="가격"')).first();
        await priceTab.click();
        await page.waitForTimeout(1000);

        // 5. 매장묘 카테고리 선택
        console.log('📋 매장묘 탭 선택...\n');
        const graveTab = page.locator('text="매장묘"').first();
        await graveTab.click();
        await page.waitForTimeout(1000);

        // 6. 기존 데이터 확인 및 초기화
        console.log('🗑️  기존 데이터 초기화 중...\n');
        const deleteButtons = page.locator('button:has-text("삭제")');
        const deleteCount = await deleteButtons.count();

        for (let i = 0; i < deleteCount; i++) {
            await deleteButtons.first().click();
            await page.waitForTimeout(300);
        }

        // 7. 새 그룹 추가 버튼 클릭
        console.log('➕ 새 그룹 추가...\n');
        const addGroupBtn = page.locator('button:has-text("새 그룹"), button:has-text("추가")').first();
        await addGroupBtn.click();
        await page.waitForTimeout(1000);

        // 8. 각 항목 입력
        const rows = facilityData.pricing['매장묘'].rows;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            console.log(`📝 항목 ${i + 1} 입력: ${row.name} - ${row.price.toLocaleString()}원\n`);

            // 새 행 추가 (첫 번째 항목 제외)
            if (i > 0) {
                const addRowBtn = page.locator('button:has-text("행 추가"), button:has-text("+")').first();
                await addRowBtn.click();
                await page.waitForTimeout(500);
            }

            // 항목명 입력
            const nameInputs = page.locator('input[placeholder*="항목"], input[placeholder*="이름"]');
            await nameInputs.nth(i).fill(row.name);
            await page.waitForTimeout(300);

            // 가격 입력
            const priceInputs = page.locator('input[type="number"], input[placeholder*="가격"]');
            await priceInputs.nth(i).fill(row.price.toString());
            await page.waitForTimeout(300);

            // 대표 가격 별 클릭
            if (row.isRepresentative) {
                console.log(`⭐ 대표 가격 설정: ${row.name}\n`);
                const starButtons = page.locator('button:has-text("★"), button:has-text("☆")');
                await starButtons.nth(i).click();
                await page.waitForTimeout(500);
            }
        }

        // 9. 저장 버튼 클릭
        console.log('💾 저장 중...\n');
        const saveBtn = page.locator('button:has-text("저장")').first();
        await saveBtn.click();
        await page.waitForTimeout(2000);

        // 10. 성공 메시지 확인
        const successMsg = page.locator('text="성공"').or(page.locator('text="완료"'));
        if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('✅ 저장 성공!\n');
        } else {
            console.log('⚠️  저장 상태 확인 필요\n');
        }

        console.log('\n🎉 자동 입력 완료!\n');
        console.log('💡 브라우저를 열어두었습니다. 확인 후 닫아주세요.\n');

        // 브라우저 자동으로 닫지 않음 (확인을 위해)
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
        console.log('\n💡 스크린샷 저장 중...\n');
        await page.screenshot({ path: 'error-screenshot.png' });
    } finally {
        await browser.close();
    }
}

// 실행
autoFillPricing();
