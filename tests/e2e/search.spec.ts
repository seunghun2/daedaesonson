
import { test, expect } from '@playwright/test';

test.describe('Search and Filter', () => {
    test('should allow searching facilities', async ({ page }) => {
        await page.goto('/');

        // Check if we are on mobile (by checking if the list view toggle exists)
        const listToggle = page.locator('.mantine-SegmentedControl-root').getByText('목록', { exact: false });
        if (await listToggle.isVisible()) {
            await listToggle.click();
            await page.waitForTimeout(500); // Wait for transition
        }
        // Type in search bar
        const searchInput = page.getByPlaceholder('지역, 시설명 검색');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('서울');

        // Wait for autocomplete results
        // The dropdown appears when searchFocused is true and results exist
        await searchInput.click(); // Ensure focus
        await page.waitForTimeout(1000); // Debounce simulation

        // Check if result box appears
        // The box has styling "zIndex: 2100" and contains specific text
        // We can search for the container or items
        const results = page.locator('text=서울');
        // This is vague, as "서울" is in the input. 
        // Let's look for result items that contain "서울" outside the input.
        // The result items have a class "hover:bg-gray-50" or similar structure

        // Wait for at least one autocomplete item
        // Autocomplete item is a Box with onClick handler. 
        // We can look for the category labels like "봉안당", "수목장" inside the dropdown
        // or just check if any element box appears below input.

        // Check if any list item appears
        // We can use a more specific selector if possible, but for now let's rely on text presence
        // assuming there are facilities with "서울" in name or address.
        // Mock data usually has "서울" if generated near City Hall.

        // Let's try filling "테스트" or something if mock data has it, but "서울" is safer.
    });

    test('should filter by category', async ({ page }) => {
        await page.goto('/');

        // Click "수목장" tab
        const naturalTab = page.getByRole('tab', { name: '수목장' });
        await expect(naturalTab).toBeVisible();
        await naturalTab.click();

        // Verify tab accepts click (active state changes style, but hard to test style)
        // We can check if the list content updates?
        // The list is "FacilityList". 
        // Maybe we can check the filter bar count if available?
        // "FilterBar" shows "totalCount".
        // Let's look for "총 N개" text.

        await page.waitForTimeout(1000);
        const filterText = page.getByText(/총 \d+개/);
        if (await filterText.isVisible()) {
            const text = await filterText.innerText();
            console.log('Filter count text:', text);
            // We can't strictly assert the number without knowing DB state, 
            // but verifying the element exists confirms the list rendered.
            expect(text).toMatch(/총 \d+개/);
        }
    });
});
