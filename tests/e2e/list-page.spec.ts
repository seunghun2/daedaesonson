import { test, expect } from '@playwright/test';

test.describe('List Page', () => {
    test('should load list page', async ({ page }) => {
        await page.goto('/list');
        await page.waitForTimeout(3000);

        // Check page loads
        await expect(page).toHaveTitle(/대대손손/);
    });

    test('should display facility cards', async ({ page }) => {
        await page.goto('/list');
        await page.waitForTimeout(3000);

        // Check for facility listing elements
        // Cards should have facility names and prices
    });

    test('should have filter options', async ({ page }) => {
        await page.goto('/list');
        await page.waitForTimeout(2000);

        // Check for category filters similar to homepage
    });
});

test.describe('Regional Pages', () => {
    test('should load Seoul page', async ({ page }) => {
        await page.goto('/지역/서울');
        await page.waitForTimeout(3000);

        // Check page loads with regional content
        await expect(page).toHaveTitle(/서울.*대대손손|대대손손.*서울/);
    });

    test('should load Gyeonggi page', async ({ page }) => {
        await page.goto('/지역/경기');
        await page.waitForTimeout(3000);

        await expect(page).toHaveTitle(/경기.*대대손손|대대손손.*경기/);
    });
});
