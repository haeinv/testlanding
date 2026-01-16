/**
 * 피트니스 뉴스 크롤러 (Playwright 활용)
 * - 네이버 뉴스 건강/생활 카테고리에서 기사 수집
 * - 건강, 피트니스, PT, 헬스케어, 시니어 관련 기사 필터링
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NEWS_FILE = path.join(DATA_DIR, 'fitness-news.json');

// 네이버 뉴스 건강/생활 카테고리 URL
const CATEGORY_URL = 'https://news.naver.com/breakingnews/section/103/241';

// 필터링 키워드 (제목이나 내용에 포함되어야 함)
const FILTER_KEYWORDS = [
    '건강', '피트니스', 'PT', '헬스', '케어', '시니어',
    '운동', '트레이닝', '다이어트', '체중', '근육',
    '요가', '필라테스', '스트레칭', '웨이트',
    '노인', '고령', '재활', '치료', '병원',
    '영양', '식단', '비만', '당뇨', '혈압',
    '걷기', '달리기', '수영', '등산', '헬스장',
    '트레이너', '피티', '홈트', '스포츠'
];

async function crawlNaverHealthNews() {
    console.log('[크롤러] 시작:', new Date().toISOString());
    console.log('[크롤러] 카테고리:', CATEGORY_URL);

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'ko-KR'
    });

    const page = await context.newPage();
    const allNews = [];
    const seenUrls = new Set();

    try {
        // 카테고리 페이지 방문
        await page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // 더보기 버튼 클릭하여 더 많은 기사 로드 (3번)
        for (let i = 0; i < 3; i++) {
            try {
                const moreBtn = await page.$('.section_more_inner, .btn_more, [class*="more"]');
                if (moreBtn) {
                    await moreBtn.click();
                    await page.waitForTimeout(1500);
                    console.log(`[크롤러] 더보기 클릭 ${i + 1}/3`);
                }
            } catch (e) {
                break;
            }
        }

        // 기사 링크 수집
        const articleLinks = await page.evaluate(() => {
            const links = new Set();
            // 뉴스 기사 링크 찾기
            document.querySelectorAll('a').forEach(a => {
                const href = a.href || '';
                if (href.includes('/article/') && href.includes('news.naver.com')) {
                    links.add(href.split('?')[0]);
                }
            });
            return Array.from(links);
        });

        console.log(`[크롤러] 카테고리에서 ${articleLinks.length}개 링크 발견`);

        // 각 기사 방문하여 상세 정보 수집
        for (const articleUrl of articleLinks) {
            if (seenUrls.has(articleUrl) || allNews.length >= 50) continue;
            seenUrls.add(articleUrl);

            try {
                await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
                await page.waitForTimeout(1000);

                const articleData = await page.evaluate((keywords) => {
                    // 제목
                    let title = '';
                    const titleSelectors = ['#title_area span', '.media_end_head_headline', 'h2#articleTitle'];
                    for (const sel of titleSelectors) {
                        const el = document.querySelector(sel);
                        if (el?.textContent?.trim()) {
                            title = el.textContent.trim();
                            break;
                        }
                    }

                    // 본문 텍스트
                    let bodyText = '';
                    const bodyEl = document.querySelector('#newsct_article, .article_body, #articeBody');
                    if (bodyEl) {
                        bodyText = bodyEl.textContent?.replace(/\s+/g, ' ').trim() || '';
                    }

                    // 키워드 필터링 - 제목이나 본문에 키워드 포함 여부
                    const combinedText = (title + ' ' + bodyText).toLowerCase();
                    const hasKeyword = keywords.some(kw => combinedText.includes(kw.toLowerCase()));

                    if (!hasKeyword) {
                        return null;
                    }

                    // 언론사
                    let press = '';
                    const pressImg = document.querySelector('.media_end_head_top_logo img');
                    if (pressImg) press = pressImg.alt || '';

                    // 날짜
                    let date = '';
                    const dateEl = document.querySelector('.media_end_head_info_datestamp_time, ._ARTICLE_DATE_TIME');
                    if (dateEl) {
                        const dateText = dateEl.textContent?.trim() || dateEl.getAttribute('data-date-time') || '';
                        const match = dateText.match(/(\d{4})[\.\-](\d{2})[\.\-](\d{2})/);
                        if (match) date = `${match[1]}.${match[2]}.${match[3]}`;
                    }

                    // 이미지 (OG 이미지 우선)
                    let thumbnail = '';
                    const ogImg = document.querySelector('meta[property="og:image"]');
                    if (ogImg?.content) {
                        thumbnail = ogImg.content;
                    }
                    if (!thumbnail) {
                        const imgEl = document.querySelector('#img1, .end_photo_org img, #newsct_article img');
                        if (imgEl) {
                            thumbnail = imgEl.dataset.src || imgEl.src || '';
                            if (thumbnail.includes('logo') || thumbnail.includes('icon')) thumbnail = '';
                        }
                    }

                    // 요약
                    const description = bodyText.substring(0, 200);

                    // 매칭된 키워드 찾기
                    let matchedKeyword = '';
                    for (const kw of keywords) {
                        if (combinedText.includes(kw.toLowerCase())) {
                            matchedKeyword = kw;
                            break;
                        }
                    }

                    return { title, press, date, thumbnail, description, keyword: matchedKeyword };
                }, FILTER_KEYWORDS);

                if (articleData && articleData.title && articleData.title.length > 10) {
                    allNews.push({
                        title: articleData.title.substring(0, 100),
                        url: articleUrl,
                        description: articleData.description.substring(0, 150) + '...',
                        press: articleData.press || '네이버뉴스',
                        thumbnail: articleData.thumbnail,
                        date: articleData.date || new Date().toISOString().split('T')[0].replace(/-/g, '.'),
                        keyword: articleData.keyword,
                        crawledAt: new Date().toISOString()
                    });
                    console.log(`  ✓ [${allNews.length}] ${articleData.title.substring(0, 40)}... (${articleData.keyword})`);
                }
            } catch (err) {
                // 스킵
            }

            await page.waitForTimeout(500);
        }

        console.log(`[크롤러] 총 ${allNews.length}개 관련 기사 수집 완료`);

    } catch (error) {
        console.error('[크롤러] 에러:', error.message);
    } finally {
        await browser.close();
    }

    return allNews;
}

async function saveNews(news) {
    await fs.mkdir(DATA_DIR, { recursive: true });

    const data = {
        lastUpdated: new Date().toISOString(),
        totalCount: news.length,
        displayCount: 9,
        source: '네이버 뉴스 건강/생활',
        articles: news
    };

    await fs.writeFile(
        NEWS_FILE,
        JSON.stringify(data, null, 2),
        { encoding: 'utf8' }
    );

    console.log(`[저장] ${NEWS_FILE} 저장 완료`);
    return data;
}

async function main() {
    try {
        const news = await crawlNaverHealthNews();

        if (news.length >= 1) {
            await saveNews(news);
            console.log('[완료] 뉴스 크롤링 및 저장 성공');
        } else {
            console.log('[경고] 수집된 뉴스가 없습니다');
        }
    } catch (error) {
        console.error('[오류] 크롤링 실패:', error);
    }
}

main();
