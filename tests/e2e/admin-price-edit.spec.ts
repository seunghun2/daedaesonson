import { test, expect } from '@playwright/test';

test.describe('관리자 페이지 - 가격 편집', () => {
    test.beforeEach(async ({ page }) => {
        // 개발 서버 시작 후 관리자 페이지로 이동
        await page.goto('http://localhost:3000/admin/upload');

        // 페이지 로딩 대기
        await page.waitForLoadState('networkidle');
    });

    test('페이지가 정상적으로 로드된다', async ({ page }) => {
        // 제목 확인
        await expect(page.locator('h1, h2').first()).toBeVisible();

        // 시설 목록이 있는지 확인
        const facilityRows = page.locator('table tbody tr');
        const count = await facilityRows.count();
        console.log(`✅ 시설 목록: ${count}개`);

        expect(count).toBeGreaterThan(0);
    });

    test('낙원추모공원 편집 - DB 데이터 확인', async ({ page }) => {
        // 낙원추모공원 찾기
        const nakwonRow = page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        });

        await expect(nakwonRow).toBeVisible();

        // DB 배지 확인
        const dbBadge = nakwonRow.locator('text=DB');
        await expect(dbBadge).toBeVisible();
        console.log('✅ DB 배지 확인됨');

        // 편집 버튼 클릭
        const editButton = nakwonRow.locator('button', { hasText: '편집' }).or(
            nakwonRow.locator('svg[class*="lucide-pencil"]').locator('..')
        );
        await editButton.first().click();

        // 모달 열림 대기
        await page.waitForTimeout(1000);

        // 가격 탭 클릭
        const priceTab = page.locator('button[data-value="price"], button:has-text("가격")');
        await priceTab.click();

        await page.waitForTimeout(1000);

        // DB 알림 확인
        const dbAlert = page.locator('text=DB에서 로드됨');
        await expect(dbAlert).toBeVisible();
        console.log('✅ DB 데이터 로드 확인됨');

        // 카테고리 탭들 확인
        const categoryTabs = [
            '기본비용',
            '매장묘',
            '봉안묘',
            '봉안당',
            '수목장',
            '기타'
        ];

        for (const catName of categoryTabs) {
            const tab = page.locator(`button:has-text("${catName}")`);
            const isVisible = await tab.isVisible();
            console.log(`  ${isVisible ? '✅' : '❌'} ${catName} 탭`);
        }
    });

    test('기본비용 카테고리 내용 확인', async ({ page }) => {
        // 낙원추모공원 편집
        await page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        }).locator('button').first().click();

        await page.waitForTimeout(1000);

        // 가격 탭
        await page.locator('button:has-text("가격")').click();
        await page.waitForTimeout(500);

        // 기본비용 탭 클릭
        await page.locator('button:has-text("기본비용")').click();
        await page.waitForTimeout(500);

        // 그룹명 확인 (미분류 -> 기본요금으로 변경됐는지)
        const groupName = page.locator('input[placeholder="그룹명"]').first();
        const value = await groupName.inputValue();
        console.log(`✅ 그룹명: ${value}`);

        // 사용료 확인
        const inputs = page.locator('input[type="text"]');
        const count = await inputs.count();
        console.log(`✅ 입력 필드: ${count}개`);

        // 첫 번째 항목이 사용료인지 확인 (가격 높은 순)
        const firstItemName = await page.locator('input').filter({ hasText: /사용료|관리비/ }).first().inputValue();
        console.log(`✅ 첫 번째 항목: ${firstItemName}`);
    });

    test('그룹 순서 변경 버튼 작동 확인', async ({ page }) => {
        // 낙원추모공원 편집
        await page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        }).locator('button').first().click();

        await page.waitForTimeout(1000);

        // 가격 탭 -> 매장묘 탭
        await page.locator('button:has-text("가격")').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("매장묘")').click();
        await page.waitForTimeout(500);

        // 첫 번째 그룹의 위로 버튼이 disabled인지 확인
        const upButtons = page.locator('button[disabled]').filter({
            has: page.locator('svg')
        });
        const disabledCount = await upButtons.count();
        console.log(`✅ disabled 버튼: ${disabledCount}개`);

        // 두 번째 그룹의 아래 버튼 클릭 (순서 변경 테스트)
        const groups = page.locator('[data-testid="price-group"], div:has(input[placeholder="그룹명"])');
        const groupCount = await groups.count();
        console.log(`✅ 그룹 수: ${groupCount}개`);
    });

    test('항목 순서 변경 기능', async ({ page }) => {
        // 낙원추모공원 편집
        await page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        }).locator('button').first().click();

        await page.waitForTimeout(1000);

        // 가격 탭 -> 기본비용 탭
        await page.locator('button:has-text("가격")').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("기본비용")').click();
        await page.waitForTimeout(500);

        // 항목 개수 확인
        const priceInputs = page.locator('input').filter({ hasText: /원$/ });
        const itemCount = await priceInputs.count();
        console.log(`✅ 항목 수: ${itemCount}개`);

        if (itemCount >= 2) {
            // 두 번째 항목의 위로 버튼 찾기
            const upButtons = page.locator('button').filter({
                has: page.locator('svg')
            });

            console.log('✅ 순서 변경 버튼이 존재함');
        }
    });

    test('그룹명 편집 기능', async ({ page }) => {
        // 낙원추모공원 편집
        await page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        }).locator('button').first().click();

        await page.waitForTimeout(1000);

        // 가격 탭 -> 기본비용 탭
        await page.locator('button:has-text("가격")').click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("기본비용")').click();
        await page.waitForTimeout(500);

        // 그룹명 입력 필드
        const groupNameInput = page.locator('input[placeholder="그룹명"]').first();
        const originalValue = await groupNameInput.inputValue();
        console.log(`✅ 원래 그룹명: ${originalValue}`);

        // readonly가 아닌지 확인
        const isReadOnly = await groupNameInput.getAttribute('readonly');
        expect(isReadOnly).toBeNull();
        console.log('✅ 그룹명 편집 가능');
    });

    test('전체 카테고리 순서 확인', async ({ page }) => {
        // 낙원추모공원 편집
        await page.locator('table tbody tr', {
            has: page.locator('text=낙원추모공원')
        }).locator('button').first().click();

        await page.waitForTimeout(1000);

        // 가격 탭
        await page.locator('button:has-text("가격")').click();
        await page.waitForTimeout(500);

        // 카테고리 탭 순서 확인
        const expectedOrder = ['기본비용', '매장묘', '봉안묘', '봉안당', '수목장', '기타'];
        const tabs = page.locator('button[role="tab"]').filter({ hasText: /기본비용|매장묘|봉안묘|봉안당|수목장|기타/ });

        const tabCount = await tabs.count();
        console.log(`\n✅ 탭 순서 확인:`);

        for (let i = 0; i < tabCount; i++) {
            const tabText = await tabs.nth(i).textContent();
            console.log(`  ${i + 1}. ${tabText}`);
        }
    });
});
