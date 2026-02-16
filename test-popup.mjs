import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  // 拡張機能のパス
  const extensionPath = path.join(__dirname, '.output/chrome-mv3');

  // Chromiumを拡張機能付きで起動
  const browserContext = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browserContext.newPage();

  // 拡張機能のIDを取得
  const targets = browserContext.serviceWorkers();
  if (targets.length > 0) {
    const extensionId = targets[0].url().split('/')[2];
    console.log('Extension ID:', extensionId);

    // ポップアップを開く
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await page.goto(popupUrl);

    // 詳細なサイズ情報を取得
    const sizeInfo = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const root = document.getElementById('root');

      return {
        html: {
          scrollWidth: html.scrollWidth,
          scrollHeight: html.scrollHeight,
          offsetWidth: html.offsetWidth,
          offsetHeight: html.offsetHeight,
          clientWidth: html.clientWidth,
          clientHeight: html.clientHeight,
          computedStyle: {
            height: window.getComputedStyle(html).height,
            width: window.getComputedStyle(html).width,
            minHeight: window.getComputedStyle(html).minHeight,
            minWidth: window.getComputedStyle(html).minWidth,
          }
        },
        body: {
          scrollWidth: body.scrollWidth,
          scrollHeight: body.scrollHeight,
          offsetWidth: body.offsetWidth,
          offsetHeight: body.offsetHeight,
          clientWidth: body.clientWidth,
          clientHeight: body.clientHeight,
          computedStyle: {
            height: window.getComputedStyle(body).height,
            width: window.getComputedStyle(body).width,
            minHeight: window.getComputedStyle(body).minHeight,
            minWidth: window.getComputedStyle(body).minWidth,
          }
        },
        root: root ? {
          scrollWidth: root.scrollWidth,
          scrollHeight: root.scrollHeight,
          offsetWidth: root.offsetWidth,
          offsetHeight: root.offsetHeight,
          clientWidth: root.clientWidth,
          clientHeight: root.clientHeight,
          computedStyle: {
            height: window.getComputedStyle(root).height,
            width: window.getComputedStyle(root).width,
          }
        } : null,
      };
    });

    console.log('Size info:', JSON.stringify(sizeInfo, null, 2));

    // コンテンツの実際の高さを取得（rootの高さ）
    const actualHeight = sizeInfo.root.offsetHeight;
    const actualWidth = sizeInfo.root.offsetWidth;

    // ビューポートをコンテンツサイズに設定
    await page.setViewportSize({
      width: actualWidth,
      height: actualHeight
    });

    // スクリーンショットを撮影
    await page.screenshot({ path: 'popup-screenshot.png', fullPage: false });
    console.log(`Screenshot saved (${actualWidth}x${actualHeight})`);

    // 5秒待機して確認
    await page.waitForTimeout(5000);
  } else {
    console.error('Extension service worker not found');
  }

  await browserContext.close();
})();
