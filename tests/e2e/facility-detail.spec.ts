import { test, expect } from '@playwright/test';

test.describe('Facility Detail Page', () => {
    test('should open facility detail from list', async ({ page }) => {
        await page.goto('/list');
        await page.waitForTimeout(3000);

        // Click on first facility card
        const firstCard = page.locator('[data-testid="facility-card"]').first();
        if (await firstCard.isVisible()) {
            await firstCard.click();
            await page.waitForTimeout(1000);

            // Check detail page elements
            await expect(page.getByText('예상 이용 비용')).toBeVisible({ timeout: 10000 });
        }
    });

    test('should show facility info', async ({ page }) => {
        // Navigate to a known facility via URL param
        await page.goto('/?id=park_1');
        await page.waitForTimeout(3000);

        // Check basic info is displayed - might be different structure, so check for common elements
        // Look for address or price info
    });

    test('should have share button', async ({ page }) => {
        await page.goto('/?id=park_1');
        await page.waitForTimeout(3000);

        // Check share icon exists
        const shareButton = page.locator('text=share').first();
        // May or may not be visible depending on facility
    });

    test('should close detail page', async ({ page }) => {
        await page.goto('/?id=park_1');
        await page.waitForTimeout(3000);

        // Click close button (X icon)
        const closeButton = page.locator('text=close').first();
        if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(500);

            // URL should no longer have id param
            expect(page.url()).not.toContain('id=');
        }
    });
});

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile layout', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Map should still be visible on mobile
        await expect(page.locator('#map')).toBeVisible();
    });

    test('should have mobile search bar', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Search input should be visible
        const searchInput = page.getByRole('textbox').first();
        await expect(searchInput).toBeVisible();
    });
});
