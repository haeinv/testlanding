const { chromium } = require('playwright');
const fs = require('fs').promises;

async function debug() {
    const browser = await chromium.launch({ headless: false }); // 브라우저 표시
    const page = await browser.newPage();

    await page.goto('https://search.naver.com/search.naver?where=news&query=피트니스&sort=1');
    await page.waitForTimeout(3000);

    // 페이지 HTML 저장
    const html = await page.content();
    await fs.writeFile('/Users/shinhaein/Desktop/landing/data/debug.html', html);

    // 스크린샷 저장
    await page.screenshot({ path: '/Users/shinhaein/Desktop/landing/data/screenshot.png', fullPage: true });

    // 뉴스 요소 확인
    const newsElements = await page.evaluate(() => {
        const results = [];

        // 모든 li 요소 확인
        document.querySelectorAll('li').forEach((li, index) => {
            const classes = li.className;
            const hasNewsLink = li.querySelector('a[href*="news"]');
            if (hasNewsLink) {
                results.push({
                    index,
                    classes,
                    innerHTML: li.innerHTML.substring(0, 500)
                });
            }
        });

        return results;
    });

    console.log('뉴스 관련 li 요소:', JSON.stringify(newsElements, null, 2));

    await browser.close();
}

debug().catch(console.error);
