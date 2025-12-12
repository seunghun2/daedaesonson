
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 Launching Scout...');
    const browser = await puppeteer.launch({
        headless: false, // 눈으로 확인하기 위해 false
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac 시스템 크롬 강제 지정
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 1. 메인 페이지 접속
    const url = 'https://www.15774129.go.kr/portal/esky/main/main.do';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 2. 스크린샷 저장
    await page.screenshot({ path: 'esky_main.png' });
    console.log('📸 Screenshot saved: esky_main.png');

    // 3. 링크(a 태그) 텍스트 수집 (메뉴 탐색용)
    const links = await page.$$eval('a', as => as.map(a => ({
        text: a.innerText.trim(),
        href: a.href,
        onclick: a.getAttribute('onclick')
    })));

    // "시설" 또는 "검색"이 포함된 링크만 필터링
    const searchLinks = links.filter(l => l.text.includes('시설') || l.text.includes('검색') || l.href.includes('search'));

    console.log('🔎 Found potential search links:');
    console.log(JSON.stringify(searchLinks, null, 2));

    await browser.close();
})();
