const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const TARGET_FACILITY_NAME = "(재)낙원추모공원";
// 1920x1080 size typically shows full PC layout
const VIEWPORT = { width: 1920, height: 1080 };
const LIST_URL = "https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000";
const OUTPUT_DIR = path.join(__dirname, '../archive');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper: Download Image
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

(async () => {
    // Launch Puppeteer in headful mode for debugging
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }, // Force PC resolution
        args: ['--start-maximized', '--window-size=1920,1080'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 }); // Explicitly set viewport
    // Configure download behavior for PDF if needed, but Page.printToPDF is usually used.

    try {
        console.log(`Navigating to list page: ${LIST_URL}`);
        await page.goto(LIST_URL, { waitUntil: 'networkidle2' });

        // Wait for search input
        const searchInputSelector = '#search_company';
        await page.waitForSelector(searchInputSelector);

        // Search Name
        const SEARCH_NAME = TARGET_FACILITY_NAME.replace('(재)', '').trim(); // Remove common prefix for search
        console.log(`Starting search for: ${SEARCH_NAME} (Target: ${TARGET_FACILITY_NAME})`);

        // Potential Tabs
        const tabsToCheck = ['묘지', '봉안시설', '자연장지', '장례식장'];
        let found = false;

        for (const tabName of tabsToCheck) {
            console.log(`\nChecking Tab: ${tabName}`);

            // 1. Click Tab
            const foundTab = await page.evaluateHandle((text) => {
                const links = Array.from(document.querySelectorAll('a.facgroupcd'));
                return links.find(a => a.innerText.includes(text));
            }, tabName);

            if (foundTab && foundTab.asElement()) {
                await foundTab.asElement().click();
                await new Promise(r => setTimeout(r, 2000)); // Wait for tab switch

                // 2. Clear & Type Search
                await page.evaluate((term) => {
                    const input = document.querySelector('#search_company');
                    if (input) {
                        input.value = ''; // clear first
                        input.value = term;
                        // Some sites need input event
                    }
                }, SEARCH_NAME);

                // 3. Click Search
                await page.click('#btn_search');

                console.log('Clicked search. Waiting for results...');
                await new Promise(r => setTimeout(r, 3000));

                // 4. Check Results
                const isNoResult = await page.evaluate(() => document.body.innerText.includes('검색된 시설이 없습니다'));

                if (!isNoResult) {
                    // Get all items in the list - robust parsing
                    const searchResults = await page.evaluate(() => {
                        const items = Array.from(document.querySelectorAll('#loc li'));
                        return items.map((li, index) => {
                            // Try to find the title link
                            let a = li.querySelector('.fac_tit a');
                            if (!a) a = li.querySelector('a'); // Fallback to any link

                            return {
                                index: index,
                                text: li.innerText.trim(), // Check full text of LI
                                href: a ? a.href : ''
                            };
                        });
                    });

                    console.log(`Found ${searchResults.length} items in ${tabName}.`);

                    // Find match in full text
                    const match = searchResults.find(r => r.text.includes(SEARCH_NAME));

                    if (match) {
                        console.log(`>>> MATCH FOUND in ${tabName} (Index ${match.index}) <<<`);
                        found = true;

                        // Click
                        const matchIndex = match.index + 1;
                        const itemSelector = `#loc li:nth-child(${matchIndex}) a`;
                        // Just click the first link in that LI
                        await page.waitForSelector(itemSelector);

                        console.log("Entering detail page...");
                        await Promise.all([
                            page.waitForNavigation({ waitUntil: 'networkidle0' }),
                            page.click(itemSelector)
                        ]);
                        console.log("Detail page loaded.");
                        break;
                    }
                } else {
                    console.log(`No match in ${tabName}`);
                }
            }
        }

        if (!found) {
            throw new Error(`Could not find facility '${TARGET_FACILITY_NAME}' in any expected tab.`);
        }

        // Prepare Output Directory - Allow brackets
        const safeName = TARGET_FACILITY_NAME.replace(/[^a-z0-9가-힣()]/gi, '_').replace(/_+/g, ' ').trim();
        // User wants "1.(재)낙원추모공원" format. 
        // My replace might turn ( into _. Let's just use the name directly but check for really bad chars.
        // Actually user said: "1.(재)낙산추모공원이여야해" (implied Nakwon).
        const folderName = `1.${TARGET_FACILITY_NAME}`; // Use exact requested format if safe
        const facilityDir = path.join(OUTPUT_DIR, folderName);
        if (!fs.existsSync(facilityDir)) {
            fs.mkdirSync(facilityDir, { recursive: true });
        }

        // --- Detail Page Operations ---

        // Helper to click tab by text
        const clickTab = async (textVariants) => {
            return page.evaluate((texts) => {
                const elements = Array.from(document.querySelectorAll('a, button, li'));
                for (const el of elements) {
                    const t = el.innerText.trim();
                    if (texts.includes(t)) {
                        el.click();
                        return true;
                    }
                }
                return false;
            }, textVariants);
        };

        // 1. Price Tab
        console.log("Processing '가격' tab...");
        const priceClicked = await clickTab(['가격', '시설/용품가격']);
        if (priceClicked) {
            await new Promise(r => setTimeout(r, 4000)); // Wait for render

            // Expand all accordions
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('.btn_view, .btn_toggle, .accordion button');
                buttons.forEach(b => b.click());
            });
            await new Promise(r => setTimeout(r, 1000));

            // Calculate height for full page PDF
            const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

            const pdfPath = path.join(facilityDir, 'price_info.pdf');
            await page.pdf({
                path: pdfPath,
                printBackground: true,
                width: '1920px', // Wide format
                height: `${Math.ceil(bodyHeight + 100)}px` // Full height
            });
            console.log(`Saved PDF: ${pdfPath}`);
        } else {
            console.warn("Could not find '가격' tab.");
        }

        // 2. Photo Tab
        console.log("Processing '사진' tab...");
        const photoClicked = await clickTab(['사진', '시설사진', '갤러리']);
        if (photoClicked) {
            await new Promise(r => setTimeout(r, 4000));

            // Extract Images - STRICTER FILTER for Gallery
            // Try to identify the specific gallery container often used in e-Sky
            const imageUrls = await page.evaluate(() => {
                // Prioritize .gallery_list or .photo_list or .facimg_list (identified in inspection)
                const selector = '.facimg_list img, .fac_photo_list img, .gallery_list img, .photo_list img, .p_list img, .facimg_box img';
                let imgs = Array.from(document.querySelectorAll(selector));

                // Remove duplicates based on src
                const uniqueSrcs = new Set();
                const uniqueImgs = [];
                for (const img of imgs) {
                    if (!uniqueSrcs.has(img.src)) {
                        uniqueSrcs.add(img.src);
                        uniqueImgs.push(img);
                    }
                }

                return uniqueImgs.filter(img => {
                    // Check natural size to ensure it's a real photo
                    return img.naturalWidth > 100 && img.naturalHeight > 100 &&
                        !img.src.includes('logo') &&
                        !img.src.includes('icon');
                }).map(img => img.src);
            });

            console.log(`Found ${imageUrls.length} images.`);

            const photosDir = path.join(facilityDir, 'photos');

            // Clean existing photos
            if (fs.existsSync(photosDir)) {
                fs.rmSync(photosDir, { recursive: true, force: true });
            }
            fs.mkdirSync(photosDir);

            for (let i = 0; i < imageUrls.length; i++) {
                const imgUrl = imageUrls[i];
                const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
                const filename = `photo_${i + 1}${ext}`;
                const filepath = path.join(photosDir, filename);
                try {
                    await downloadImage(imgUrl, filepath);
                } catch (err) { }
            }
            console.log(`Saved ${imageUrls.length} photos.`);
        } else {
            console.warn("Could not find '사진' tab.");
        }

        console.log("Archiving Complete.");

    } catch (e) {
        console.error("Error during execution:", e);
    } finally {
        await browser.close();
    }
})();
