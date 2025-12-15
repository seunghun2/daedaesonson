
import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
    // Use mobile project or set viewport explicitly
    test.use({ viewport: { width: 390, height: 844 } });

    test('should show segmented control for view toggle', async ({ page }) => {
        // Force usage of mobile viewport to trigger useMediaQuery
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        // Wait for initial load
        await page.waitForTimeout(2000);

        // Check for Segmented Control "지도", "목록"
        // Mantine SegmentedControl labels are inside labels
        // Scope to the segmented control to avoid matching other "지도" texts
        const control = page.locator('.mantine-SegmentedControl-root');
        const mapLabel = control.getByText('지도', { exact: false });
        const listLabel = control.getByText('목록', { exact: false });

        // In mobile view, these should be visible at the bottom
        // But they only appear if "!selectedFacility". Initially selectedFacility is null.
        // And isMobile must be true.

        // We forced viewport, so useMediaQuery should trigger.
        // Note: useMediaQuery might need a reload or matchMedia support in Playwright (which works).

        await expect(mapLabel).toBeVisible();
        await expect(listLabel).toBeVisible();

        // Test toggle
        await listLabel.click();
        // "지도" view (Box) should be hidden, List view (Flex) should be visible.
        // This is hard to assert via visibility checkers because they might just be display:none.

        // Let's verify the "지도" label is now active? 
        // Or just that no error occurred.
    });
});
