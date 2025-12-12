const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const RAW_LIST_PATH = path.join(__dirname, '../data/funeral_list_final.json');
const OUTPUT_DIR = path.join(__dirname, '../archive2');
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
    if (!fs.existsSync(RAW_LIST_PATH)) {
        console.error(`Error: ${RAW_LIST_PATH} not found. Run fetch_funeral_list.js first.`);
        process.exit(1);
    }

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
        const { rno, companyname: TARGET_FACILITY_NAME, facilitycd } = item;
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
            if (facilitycd) {
                // Direct Navigation
                const detailUrl = `https://15774129.go.kr/portal/esky/fnlfac/fac_view.do?facilitycd=${facilitycd}&facilitygroupcd=TBC0700001&menuId=M0001000100000000`;
                console.log(`Direct navigation to: ${detailUrl}`);
                await page.goto(detailUrl, { waitUntil: 'networkidle2' });
            } else {
                // Search Fallback
                console.log(`Navigating to list page for search...`);
                await page.goto(LIST_URL, { waitUntil: 'networkidle2' });
                await page.waitForSelector('#search_company');

                // Click Funeral Tab first
                const foundTab = await page.evaluateHandle(() => {
                    const links = Array.from(document.querySelectorAll('a.facgroupcd'));
                    return links.find(a => a.innerText.includes('장례식장'));
                });
                if (foundTab && foundTab.asElement()) {
                    await foundTab.asElement().click();
                    await new Promise(r => setTimeout(r, 2000));
                }

                // Search
                await page.evaluate((term) => {
                    const input = document.querySelector('#search_company');
                    if (input) input.value = term;
                }, TARGET_FACILITY_NAME);
                await page.click('#btn_search');
                await new Promise(r => setTimeout(r, 3000));

                // Find match
                const matchFound = await page.evaluate((targetName) => {
                    const items = Array.from(document.querySelectorAll('#loc li'));
                    for (let i = 0; i < items.length; i++) {
                        const li = items[i];
                        if (li.innerText.includes(targetName) || li.innerText.includes(targetName.replace(/\s+/g, ''))) {
                            let a = li.querySelector('.fac_tit a') || li.querySelector('a');
                            if (a) { a.click(); return true; }
                        }
                    }
                    return false;
                }, TARGET_FACILITY_NAME);

                if (matchFound) {
                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                } else {
                    console.error(`FAILED to find ${TARGET_FACILITY_NAME}`);
                    continue;
                }
            }

            console.log("On Detail Page.");

            // 1. Archive Price PDF
            // Note: Funeral Homes might have "가격" tab or similar.
            // Some detail pages start with price?
            // Let's assume standard tabs: '시설현황', '가격', '사진'

            console.log("Processing '가격' tab...");
            // Adjust tab names if needed
            const priceClicked = await clickTab(page, ['가격', '시설/용품가격', '이용요금']);
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
                console.warn(`'가격' tab not found.`);
            }

            // 2. Archive Photos
            console.log("Processing '사진' tab...");
            const photoClicked = await clickTab(page, ['사진', '시설사진', '갤러리']);
            if (photoClicked) {
                await new Promise(r => setTimeout(r, 4000));
                const imageUrls = await page.evaluate(() => {
                    const selector = ('.facimg_list img, .fac_photo_list img, .gallery_list img, .photo_list img, .p_list img, .facimg_box img');
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
                        return img.naturalWidth > 50 && img.naturalHeight > 50 &&
                            !img.src.includes('logo') &&
                            !img.src.includes('icon');
                    }).map(img => img.src);
                });

                console.log(`Found ${imageUrls.length} images.`);
                const photosDir = path.join(facilityDir, 'photos');
                if (fs.existsSync(photosDir)) fs.rmSync(photosDir, { recursive: true, force: true });
                fs.mkdirSync(photosDir);

                for (let i = 0; i < imageUrls.length; i++) {
                    try {
                        const imgUrl = imageUrls[i];
                        const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
                        await downloadImage(imgUrl, path.join(photosDir, `photo_${i + 1}${ext}`));
                    } catch (e) { }
                }
                console.log(`Saved photos.`);
            }

        } catch (e) {
            console.error(`Error processing ${TARGET_FACILITY_NAME}:`, e);
        }
        await new Promise(r => setTimeout(r, 500));
    }

    await browser.close();
    console.log("\nFuneral Home Archiving Complete.");
})();
