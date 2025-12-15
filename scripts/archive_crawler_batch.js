const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const RAW_LIST_PATH = path.join(__dirname, '../data/raw_list.json');
const OUTPUT_DIR = path.join(__dirname, '../archive');
// 1920x1080 size typically shows full PC layout
const VIEWPORT = { width: 1920, height: 1080 };
const LIST_URL = "https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000";

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

// Helper: Click Tab by Text
const clickTab = async (page, textVariants) => {
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

(async () => {
    // Load List
    const rawList = JSON.parse(fs.readFileSync(RAW_LIST_PATH, 'utf-8'));
    console.log(`Loaded ${rawList.length} facilities to archive.`);

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: VIEWPORT,
        args: ['--start-maximized', '--window-size=1920,1080'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    for (const item of rawList) {
        const { rno, companyname: TARGET_FACILITY_NAME } = item;
        // Construct Folder Name: e.g., "1.고려대구로병원장례식장"
        const folderName = `${rno}.${TARGET_FACILITY_NAME}`;
        const facilityDir = path.join(OUTPUT_DIR, folderName);

        console.log(`\n==================================================`);
        console.log(`Processing #${rno}: ${TARGET_FACILITY_NAME}`);
        console.log(`Directory: ${folderName}`);
        console.log(`==================================================`);

        if (!fs.existsSync(facilityDir)) {
            fs.mkdirSync(facilityDir, { recursive: true });
        }

        try {
            console.log(`Navigating to list page...`);
            await page.goto(LIST_URL, { waitUntil: 'networkidle2' });

            // Wait for search input
            await page.waitForSelector('#search_company');

            // Search Strategy
            // 1. Determine Search Term (remove common prefixes if necessary, but user said EXACT name... 
            //    however, for SEARCHING, usually exact full name works, or removing (재) might be safer?
            //    The user said "낙산추모공원아니잖아... (재) 이거야! 꼭 이름 정확하게해야해".
            //    This implies for the FOLDER name it must be exact.
            //    For searching, using the full name is usually best unless it fails.
            //    I'll try full name first.
            const SEARCH_NAME = TARGET_FACILITY_NAME;

            const tabsToCheck = ['장례식장', '화장시설', '묘지', '봉안시설', '자연장지'];
            // Optimization: If it's a hospital funeral hall, '장례식장' is most likely. 
            // We can prioritize based on name?
            // But loop is robust.

            let found = false;

            for (const tabName of tabsToCheck) {
                console.log(`Checking Tab: ${tabName}`);

                // Click Category Tab
                const foundTab = await page.evaluateHandle((text) => {
                    const links = Array.from(document.querySelectorAll('a.facgroupcd'));
                    return links.find(a => a.innerText.includes(text));
                }, tabName);

                if (foundTab && foundTab.asElement()) {
                    await foundTab.asElement().click();
                    await new Promise(r => setTimeout(r, 2000));

                    // Fill Search Input
                    await page.evaluate((term) => {
                        const input = document.querySelector('#search_company');
                        if (input) {
                            input.value = '';
                            input.value = term;
                        }
                    }, SEARCH_NAME);

                    // Click Search
                    await page.click('#btn_search');
                    // Wait for results
                    await new Promise(r => setTimeout(r, 3000));

                    // Check for "No results"
                    const isNoResult = await page.evaluate(() => document.body.innerText.includes('검색된 시설이 없습니다'));

                    if (!isNoResult) {
                        // Find match in results
                        const matchFound = await page.evaluate((targetName) => {
                            const items = Array.from(document.querySelectorAll('#loc li'));
                            for (let i = 0; i < items.length; i++) {
                                const li = items[i];
                                // We check if the text includes our target name. 
                                // Since we searched for the full name, the result should should contain it.
                                if (li.innerText.includes(targetName) || li.innerText.includes(targetName.replace(/\s+/g, ''))) {
                                    // Click the link
                                    let a = li.querySelector('.fac_tit a');
                                    if (!a) a = li.querySelector('a');
                                    if (a) {
                                        a.click();
                                        return true;
                                    }
                                }
                            }
                            return false;
                        }, SEARCH_NAME);

                        if (matchFound) {
                            console.log(`>>> MATCH FOUND in ${tabName} <<<`);
                            found = true;
                            await page.waitForNavigation({ waitUntil: 'networkidle0' });
                            break;
                        }
                    } else {
                        console.log(`No results in ${tabName}`);
                    }
                }
            }

            if (!found) {
                console.error(`FAILED to find ${TARGET_FACILITY_NAME}`);
                continue; // Skip to next facility
            }

            console.log("On Detail Page.");

            // 1. Archive Price PDF
            // The user wanted "price_info.pdf" under the folder.
            console.log("Processing '가격' tab...");
            const priceClicked = await clickTab(page, ['가격', '시설/용품가격']);
            if (priceClicked) {
                await new Promise(r => setTimeout(r, 4000));

                // Expand accordions
                await page.evaluate(() => {
                    document.querySelectorAll('.btn_view, .btn_toggle, .accordion button').forEach(b => b.click());
                });
                await new Promise(r => setTimeout(r, 1000));

                const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
                const pdfPath = path.join(facilityDir, 'price_info.pdf');
                await page.pdf({
                    path: pdfPath,
                    printBackground: true,
                    width: '1920px',
                    height: `${Math.ceil(bodyHeight + 100)}px`
                });
                console.log(`Saved PDF: ${pdfPath}`);
            } else {
                console.warn(`'가격' tab not found for ${TARGET_FACILITY_NAME}`);
            }

            // 2. Archive Photos
            console.log("Processing '사진' tab...");
            const photoClicked = await clickTab(page, ['사진', '시설사진', '갤러리']);
            if (photoClicked) {
                await new Promise(r => setTimeout(r, 4000));

                const imageUrls = await page.evaluate(() => {
                    // Optimized Selector from previous investigation
                    const selector = '.facimg_list img, .fac_photo_list img, .gallery_list img, .photo_list img, .p_list img, .facimg_box img';
                    let imgs = Array.from(document.querySelectorAll(selector));

                    const uniqueSrcs = new Set();
                    const uniqueImgs = [];
                    for (const img of imgs) {
                        if (!uniqueSrcs.has(img.src)) {
                            uniqueSrcs.add(img.src);
                            uniqueImgs.push(img);
                        }
                    }

                    return uniqueImgs.filter(img => {
                        // Relaxed size filter slightly just in case, but keep logo filter
                        return img.naturalWidth > 50 && img.naturalHeight > 50 &&
                            !img.src.includes('logo') &&
                            !img.src.includes('icon');
                    }).map(img => img.src);
                });

                console.log(`Found ${imageUrls.length} images.`);
                const photosDir = path.join(facilityDir, 'photos');
                if (fs.existsSync(photosDir)) {
                    // Optionally clean? Or just overwrite. User didn't specify. 
                    // Safe to clear to avoid dupes if re-running.
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
                    } catch (err) {
                        console.error(`Failed to download ${imgUrl}: ${err.message}`);
                    }
                }
                console.log(`Saved photos.`);
            } else {
                console.warn(`'사진' tab not found for ${TARGET_FACILITY_NAME}`);
            }

        } catch (e) {
            console.error(`Error processing ${TARGET_FACILITY_NAME}:`, e);
        }

        // Optional: Wait a bit between facilities
        await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();
    console.log("\nBatch Archiving Complete.");
})();
