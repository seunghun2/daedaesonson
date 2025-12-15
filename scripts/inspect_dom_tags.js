const puppeteer = require('puppeteer');

async function main() {
    console.log("🔍 Inspecting DOM for Tags (ID 1)...");
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://www.goifuneral.co.kr/facilities/1/', { waitUntil: 'networkidle0' });

    // Dump all text and classes around H1
    const data = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        if (!h1) return "No H1 found";

        const parent = h1.parentElement;
        const grantParent = parent.parentElement;

        // Helper to dump element info
        const dump = (el) => ({
            tagName: el.tagName,
            className: el.className,
            text: el.innerText.replace(/\n/g, ' '),
            children: Array.from(el.children).map(c => ({
                tagName: c.tagName,
                className: c.className,
                text: c.innerText
            }))
        });

        return {
            h1_text: h1.innerText,
            siblings: Array.from(parent.children).map(dump), // Siblings of Title container
            grantParentChildren: Array.from(grantParent.children).map(dump)
        };
    });

    console.log(JSON.stringify(data, null, 2));
    await browser.close();
}

main();
