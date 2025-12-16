const { chromium } = require('playwright');

const ADMIN_URL = 'http://localhost:3000/admin/upload';
const START_FROM = 100; // Start from row 101 (first 100 already done)

async function autoSaveAll() {
    console.log('🚀 Auto Save All Facilities (Single Page Mode)');
    console.log('Starting from row:', START_FROM + 1);

    const browser = await chromium.launch({
        headless: false,
        slowMo: 30
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle' });

    console.log('✅ Page loaded, waiting for all facilities...');
    await page.waitForSelector('table tbody tr', { timeout: 60000 });
    await page.waitForTimeout(3000); // Give extra time for all 1500 to load

    const allRows = await page.$$('table tbody tr');
    console.log(`Found ${allRows.length} total facilities`);

    let totalSaved = 0;

    for (let i = START_FROM; i < allRows.length; i++) {
        try {
            // Re-query rows each time (DOM may change after save)
            const currentRows = await page.$$('table tbody tr');
            if (i >= currentRows.length) {
                console.log(`Row ${i} not found, breaking`);
                break;
            }

            const row = currentRows[i];
            const editBtn = await row.$('td:last-child button:first-child');
            if (!editBtn) continue;

            await editBtn.click();
            await page.waitForSelector('[role="dialog"], .mantine-Modal-content', { timeout: 5000 });
            await page.waitForTimeout(150);

            const saveBtn = await page.$('button:has-text("저장")');
            if (saveBtn) {
                await saveBtn.click();
                await page.waitForTimeout(500);
                totalSaved++;

                if (totalSaved % 20 === 0) {
                    console.log(`✅ Saved ${totalSaved} facilities (row ${i + 1})`);
                }
            }

            await page.waitForTimeout(150);

        } catch (e) {
            console.log(`⚠️ Row ${i} error:`, e.message?.slice(0, 40));
        }
    }

    console.log(`\n🎉 Done! Total saved: ${totalSaved}`);
    await browser.close();
}

autoSaveAll().catch(console.error);
