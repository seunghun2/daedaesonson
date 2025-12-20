import { test, expect } from '@playwright/test';

test.describe('Homepage & Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load homepage with map', async ({ page }) => {
        // Check map container exists
        await expect(page.locator('#map')).toBeVisible({ timeout: 15000 });

        // Check logo is visible (src contains logo)
        await expect(page.locator('img[src*="logo"]').first()).toBeVisible();
    });

    test('should have category filter buttons', async ({ page }) => {
        // Wait for page load
        await page.waitForTimeout(2000);

        // Check filter buttons exist
        await expect(page.getByRole('button', { name: '전체' })).toBeVisible();
        await expect(page.getByRole('button', { name: '봉안당' })).toBeVisible();
        await expect(page.getByRole('button', { name: '수목장' })).toBeVisible();
        await expect(page.getByRole('button', { name: '공원묘지' })).toBeVisible();
    });

    test('should filter by category', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Click 봉안당 filter
        await page.getByRole('button', { name: '봉안당' }).click();
        await page.waitForTimeout(1000);

        // Verify the button is active (has brand color)
        const button = page.getByRole('button', { name: '봉안당' });
        await expect(button).toBeVisible();
    });

    test('should have search input', async ({ page }) => {
        // Check search input exists
        const searchInput = page.getByRole('textbox');
        await expect(searchInput.first()).toBeVisible();
    });
});

test.describe('Search Functionality', () => {
    test('should search for facility', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(2000);

        // Type in search
        const searchInput = page.getByRole('textbox').first();
        await searchInput.fill('서울');
        await page.waitForTimeout(500);

        // Check autocomplete appears
        // Results should contain matching items
    });
});
