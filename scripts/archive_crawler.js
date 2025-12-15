
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to download image
const downloadImage = (url, dest) => {
    return new Promise((resolve, reject) => {
        if (!url) return resolve();
        if (url.startsWith('/')) url = 'https://www.15774129.go.kr' + url;

        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

(async () => {
    console.log('🚀 e-Sky Archive Crawler Starting...');

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    // 1. Fetch Master List (2000 items)
    const SEARCH_URL = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do';
    await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Connected. Fetching Master List (2000 items)...');

    const result = await page.evaluate(async () => {
        try {
            const formData = new FormData();
            formData.append('pageInqCnt', '500');
            formData.append('curPageNo', '1');
            const response = await fetch('/portal/fnlfac/fac_list.ajax', { method: 'POST', body: formData });
            return await response.json();
        } catch (e) { return { error: e.toString() }; }
    });

    if (!result.list || result.list.length === 0) {
        console.error('❌ Failed to fetch list.');
        await browser.close();
        return;
    }

    const facilities = result.list;
    console.log(`📦 Fetched ${facilities.length} facilities.`);

    // Save List to update Admin (Our Site)
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    // Transform to our format roughly
    const mappedFacilities = facilities.map((f, idx) => ({
        id: f.facilitycd,
        name: f.companyname,
        category: 'FUNERAL_HOME', // Default
        address: f.fulladdress,
        phone: f.telephone,
        priceRange: { min: 0, max: 0 },
        hasParking: f.parkyn === 'Y' || f.parkyn === 'TBC1300001',
        coordinates: { lat: parseFloat(f.latitude), lng: parseFloat(f.longitude) },
        fileUrl: f.fileurl
    }));
    fs.writeFileSync(facilitiesPath, JSON.stringify(mappedFacilities, null, 2));
    console.log(`💾 Updated 'data/facilities.json' for Admin Panel.`);

    // 2. Archive Loop
    const ARCHIVE_DIR = path.join(__dirname, '../archive');
    if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR);

    console.log('🏁 Starting Archiving Process...');

    for (let i = 0; i < facilities.length; i++) {
        const item = facilities[i];
        const num = String(i + 1).padStart(2, '0'); // 01, 02...
        const safeName = item.companyname.replace(/[/\\?%*:|"<>]/g, '-');
        const dirName = `${num}. ${safeName}`;
        const dirPath = path.join(ARCHIVE_DIR, dirName);

        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);

        console.log(`[${i + 1}/${facilities.length}] Archiving: ${dirName}`);

        // Navigate to Detail
        const detailUrl = `https://www.15774129.go.kr/portal/esky/fnlfac/fac_view.do?fcltyCd=${item.facilitycd}`;
        try {
            await page.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            // Ensure page content is loaded before capture
            await page.waitForSelector('body', { timeout: 30000 });
            // Small delay for dynamic content
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error(`   ⚠️ Navigation or load error for ${dirName}: ${e.message}`);
        }

        // A. PDF Capture (Using CDP for Headful PDF)
        const pdfPath = path.join(ARCHIVE_DIR, `${dirName}.pdf`);
        try {
            const client = await page.target().createCDPSession();
            await client.send('Page.enable');
            const { data } = await client.send('Page.printToPDF', {
                printBackground: true,
                paperWidth: 8.27, // A4
                paperHeight: 11.69,
            });
            fs.writeFileSync(pdfPath, Buffer.from(data, 'base64'));
            console.log(`   📄 PDF Saved.`);
        } catch (e) {
            console.error(`   ❌ PDF Failed (Headful limitation?): ${e.message}`);
            // Fallback to screenshot
            await page.screenshot({ path: path.join(ARCHIVE_DIR, `${dirName}.png`), fullPage: true });
            console.log(`   📸 Screenshot saved instead.`);
        }

        // B. Image Download (Main + Gallery)
        // 1. Main Image from JSON
        if (item.fileurl) {
            await downloadImage(item.fileurl, path.join(dirPath, 'main.jpg'))
                .catch(e => console.error(`   ⚠️ Main img fail: ${e.message}`));
        }

        // 2. Sub Images from Page
        // Assuming there are other images in some gallery container. 
        // Logic: Find all images in '.view_gallery' or similar. 
        // For now, let's skip searching deeper unless we know selector.

        // Wait a bit
        // await new Promise(r => setTimeout(r, 1000));
    }

    console.log('🎉 Archiving Logic Complete (Stopped after N for safety if needed).');
    // await browser.close(); // Keep open for user to see
})();
