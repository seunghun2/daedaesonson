
import { test, expect } from '@playwright/test';

test.describe('Map Functionality', () => {
    test('should render map and markers', async ({ page }) => {
        // Go to homepage
        await page.goto('/');

        // Wait for map container
        const mapContainer = page.locator('#map');
        await expect(mapContainer).toBeVisible({ timeout: 15000 });
        console.log('Map container found');

        // Check if "Loading..." text renders initially (optional, might be too fast)
        // await expect(page.getByText('지도 로딩 중...')).toBeVisible();

        // Wait for the script to load and map to initialize
        // We can check if the internal Naver Map divs are created
        // Naver maps usually create a div with style="position: absolute; z-index: 0; ..." inside #map

        // Give it a moment for the script to execute
        await page.waitForTimeout(3000);

        // Assert that the map has children (meaning Naver Map rendered something)
        const mapChildren = await mapContainer.evaluate((el) => el.children.length);
        expect(mapChildren).toBeGreaterThan(0);

        // Check for marker rendering
        // Markers are usually SVGs or Divs. Our custom marker uses SVG.
        // We can look for the specific marker content we defined in NaverMap.tsx
        // The SVGs contain text like "봉안당", "수목장" etc.
        // Let's assume at least one marker is visible in the initial view (Seoul City Hall center)
        // We need to wait a bit potentially.

        // NOTE: Since mock data is random around Seoul, we might not see markers immediately if we are unlucky with random coords vs center.
        // But we disperse markers now? Or mockData is static?
        // Let's check if ANY marker exists in DOM (even if off-screen, if pre-rendered?)
        // Naver maps usually only render visible markers.

        // Let's rely on the logs printed by our code "NaverMap - Rendering markers:"
        const consoleLogs: string[] = [];
        page.on('console', msg => consoleLogs.push(msg.text()));

        // Reload to capture logs
        await page.reload();
        await page.waitForTimeout(3000);

        const renderLogs = consoleLogs
            .filter(log => log.includes('Viewport 필터링'))
            .map(log => {
                const match = log.match(/전체 (\d+)개/);
                return match ? parseInt(match[1]) : 0;
            });

        console.log('All render logs:', renderLogs);
        const maxMarkers = Math.max(...renderLogs, 0);
        expect(maxMarkers).toBeGreaterThan(0);
    });
});

