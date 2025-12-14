const puppeteer = require('puppeteer');

async function main() {
    console.log('🤖 Launching Local Browser Bot...');
    const browser = await puppeteer.launch({
        headless: false, // Show browser so we can see it working (and avoid bot detection)
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Go to the auto-analysis page
    const url = 'http://localhost:3000/gemini_auto.html';
    console.log(`🔗 Navigating to ${url}...`);
    await page.goto(url);

    // Inject API Key (just in case the default value isn't enough)
    // We'll trust the default value since I hardcoded it in the HTML, 
    // but clicking the button is the key.

    console.log('▶️ Clicking Start Button...');

    // Wait for button and click
    await page.waitForSelector('button');
    await page.click('button');

    console.log('⏳ Analysis running... Monitoring logs...');

    // Poll for status update in the DOM
    let finished = false;
    while (!finished) {
        const statusText = await page.$eval('#status', el => el.innerText);
        const lastLog = await page.$eval('#log', el => el.lastElementChild ? el.lastElementChild.innerText : '');

        process.stdout.write(`\r[Browser Status] ${statusText} | Last Log: ${lastLog.substring(0, 50)}...`);

        if (statusText.includes('완료') || lastLog.includes('치명적 오류')) {
            finished = true;
            console.log('\n✅ Job Finished!');
        }

        await new Promise(r => setTimeout(r, 2000));
    }

    // Keep it open for a moment to save data properly
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
    console.log('👋 Browser closed.');
}

main().catch(err => console.error(err));
