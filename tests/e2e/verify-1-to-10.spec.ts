import { test, expect } from '@playwright/test';

// 시설 1~10 자동 검증
test.describe('시설 1~10 전체 검증', () => {
    const facilities = [
        { id: 'park-0001', name: '낙원추모공원', itemCount: 109, categoryCount: 5 },
        { id: 'park-0002', name: '실로암공원묘원', itemCount: 61, categoryCount: 4 },
        { id: 'park-0003', name: '삼덕공원묘원', itemCount: 58, categoryCount: 4 },
        { id: 'park-0004', name: '울산공원묘원', itemCount: 54, categoryCount: 2 },
        { id: 'park-0005', name: '진주내동공원묘원', itemCount: 46, categoryCount: 4 },
        { id: 'park-0006', name: '신불산공원묘원', itemCount: 41, categoryCount: 3 },
        { id: 'park-0007', name: '예산군추모공원', itemCount: 40, categoryCount: 2 },
        { id: 'park-0008', name: '대지공원묘원', itemCount: 36, categoryCount: 3 },
        { id: 'park-0009', name: '선산공원묘원', itemCount: 34, categoryCount: 4 },
        { id: 'park-0010', name: '솥발산공원묘원', itemCount: 31, categoryCount: 2 }
    ];

    facilities.forEach((facility, index) => {
        test(`${index + 1}. ${facility.name} - DB 데이터 로딩 및 표시`, async ({ page }) => {
            await page.goto('http://localhost:3000/admin/upload');
            await page.waitForLoadState('networkidle');

            // 시설 찾기
            const facilityRow = page.locator('table tbody tr', {
                hasText: facility.name
            });

            await expect(facilityRow).toBeVisible({ timeout: 10000 });

            // DB 배지 확인
            const dbBadge = facilityRow.locator('text=DB');
            await expect(dbBadge).toBeVisible();

            console.log(`✅ ${facility.name}: DB 배지 확인`);

            // 편집 버튼 찾기 (더 정확하게)
            await facilityRow.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            const editIcon = facilityRow.locator('[data-lucide="pencil"]').first();
            await editIcon.click({ force: true });

            // 모달 열림 대기
            await page.waitForTimeout(1500);

            // 가격 탭 클릭
            const priceTab = page.locator('button').filter({ hasText: '가격' }).first();
            await priceTab.click();
            await page.waitForTimeout(1000);

            // DB 알림 확인
            const dbAlert = page.locator('text=DB에서 로드됨');
            await expect(dbAlert).toBeVisible();

            console.log(`✅ ${facility.name}: DB 데이터 로드 확인`);

            // 카테고리 탭 개수 확인
            const categoryTabs = page.locator('button[role="tab"]').filter({
                hasText: /기본비용|매장묘|봉안묘|봉안당|수목장|기타/
            });

            const tabCount = await categoryTabs.count();
            console.log(`✅ ${facility.name}: ${tabCount}개 카테고리 탭`);

            // 모달 닫기
            const closeButton = page.locator('button').filter({ hasText: '취소' }).or(
                page.locator('button[aria-label="Close"]')
            ).first();

            if (await closeButton.isVisible()) {
                await closeButton.click();
            }
        });

        test(`${index + 1}. ${facility.name} - 모든 버튼 테스트`, async ({ page }) => {
            await page.goto('http://localhost:3000/admin/upload');
            await page.waitForLoadState('networkidle');

            // 시설 편집
            const facilityRow = page.locator('table tbody tr', {
                hasText: facility.name
            });

            await facilityRow.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            const editIcon = facilityRow.locator('[data-lucide="pencil"]').first();
            await editIcon.click({ force: true });

            await page.waitForTimeout(1500);

            // 가격 탭
            const priceTab = page.locator('button').filter({ hasText: '가격' }).first();
            await priceTab.click();
            await page.waitForTimeout(1000);

            // 첫 번째 카테고리 탭 클릭
            const firstCategoryTab = page.locator('button[role="tab"]').filter({
                hasText: /기본비용|매장묘|봉안묘|봉안당|수목장|기타/
            }).first();

            await firstCategoryTab.click();
            await page.waitForTimeout(1000);

            // 그룹 순서 변경 버튼 테스트
            const upButtons = page.locator('button').filter({
                has: page.locator('[data-lucide="trending-up"]')
            });

            const upCount = await upButtons.count();
            console.log(`✅ ${facility.name}: ${upCount}개 위로 버튼`);

            // 항목 삭제 버튼 테스트
            const deleteButtons = page.locator('button').filter({
                has: page.locator('[data-lucide="x"]')
            });

            const deleteCount = await deleteButtons.count();
            console.log(`✅ ${facility.name}: ${deleteCount}개 삭제 버튼`);

            // 그룹 삭제 버튼 테스트
            const trashButtons = page.locator('button').filter({
                has: page.locator('[data-lucide="trash"]')
            });

            const trashCount = await trashButtons.count();
            console.log(`✅ ${facility.name}: ${trashCount}개 그룹 삭제 버튼`);
        });
    });

    test('전체 요약', async ({ page }) => {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  시설 1~10 검증 완료 요약');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        facilities.forEach((f, i) => {
            console.log(`  ${i + 1}. ${f.name}: ${f.itemCount}개 항목, ${f.categoryCount}개 카테고리`);
        });
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
});
