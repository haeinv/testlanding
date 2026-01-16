/**
 * 뉴스 자동 업데이트 스크립트
 * - 1시간마다 뉴스를 크롤링하여 JSON 업데이트
 * - cron 또는 pm2로 실행 권장
 */

const { spawn } = require('child_process');
const path = require('path');

const CRAWL_SCRIPT = path.join(__dirname, 'crawl-news.js');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1시간 (밀리초)

function runCrawler() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 뉴스 크롤링 시작...`);

    const crawler = spawn('node', [CRAWL_SCRIPT], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    crawler.on('close', (code) => {
        const endTime = new Date().toISOString();
        if (code === 0) {
            console.log(`[${endTime}] 크롤링 완료`);
        } else {
            console.error(`[${endTime}] 크롤링 실패 (exit code: ${code})`);
        }
    });

    crawler.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] 크롤러 실행 오류:`, error.message);
    });
}

// 즉시 한 번 실행
runCrawler();

// 1시간마다 실행
console.log(`[자동 업데이트] ${UPDATE_INTERVAL / 60000}분마다 뉴스를 업데이트합니다.`);
setInterval(runCrawler, UPDATE_INTERVAL);

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
    console.log('\n[자동 업데이트] 종료됨');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[자동 업데이트] 종료됨');
    process.exit(0);
});
