/**
 * Kord - Chrome Web Store スクリーンショット撮影スクリプト
 * 1280x800px で5枚撮影 (Chrome Web Store 要件)
 *
 * 使い方: node take-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.join(__dirname, '.output/chrome-mv3');
const outputDir = path.join(__dirname, 'store-screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const VIEWPORT = { width: 1280, height: 800 };

async function waitAndScreenshot(page, filePath, waitMs = 800) {
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`✅ 保存: ${path.basename(filePath)}`);
}

(async () => {
  console.log('🚀 Chrome 起動中...');

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-maximized',
    ],
    viewport: VIEWPORT,
  });

  // Service Worker が起動するまで待機
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const extensionId = background.url().split('/')[2];
  console.log(`🔑 Extension ID: ${extensionId}`);

  const paletteUrl = `chrome-extension://${extensionId}/palette.html`;
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;

  // ─────────────────────────────────────────
  // スクリーンショット 1: パレット - 空の検索モード
  // ─────────────────────────────────────────
  console.log('\n📸 1/5: パレット（空の検索モード）');
  const page1 = await context.newPage();
  await page1.setViewportSize(VIEWPORT);
  await page1.goto(paletteUrl);
  await page1.waitForLoadState('networkidle');
  await waitAndScreenshot(page1, path.join(outputDir, '01_search_empty.png'), 1200);

  // ─────────────────────────────────────────
  // スクリーンショット 2: パレット - 検索テキスト入力中（タブ・履歴結果）
  // ─────────────────────────────────────────
  console.log('\n📸 2/5: パレット（検索結果表示）');
  const page2 = await context.newPage();
  await page2.setViewportSize(VIEWPORT);
  await page2.goto(paletteUrl);
  await page2.waitForLoadState('networkidle');
  await page2.waitForTimeout(800);
  // 検索ワードを入力
  await page2.keyboard.type('git', { delay: 80 });
  await waitAndScreenshot(page2, path.join(outputDir, '02_search_results.png'), 1000);

  // ─────────────────────────────────────────
  // スクリーンショット 3: パレット - コマンドモード（Tabキーで切替）
  // ─────────────────────────────────────────
  console.log('\n📸 3/5: パレット（コマンドモード）');
  const page3 = await context.newPage();
  await page3.setViewportSize(VIEWPORT);
  await page3.goto(paletteUrl);
  await page3.waitForLoadState('networkidle');
  await page3.waitForTimeout(800);
  // Tabキーでコマンドモードに切替
  await page3.keyboard.press('Tab');
  await waitAndScreenshot(page3, path.join(outputDir, '03_command_mode.png'), 1000);

  // ─────────────────────────────────────────
  // スクリーンショット 4: パレット - コマンド検索（"close" と入力）
  // ─────────────────────────────────────────
  console.log('\n📸 4/5: パレット（コマンド検索: "close"）');
  const page4 = await context.newPage();
  await page4.setViewportSize(VIEWPORT);
  await page4.goto(paletteUrl);
  await page4.waitForLoadState('networkidle');
  await page4.waitForTimeout(800);
  await page4.keyboard.press('Tab');
  await page4.waitForTimeout(400);
  await page4.keyboard.type('close', { delay: 80 });
  await waitAndScreenshot(page4, path.join(outputDir, '04_command_search.png'), 1000);

  // ─────────────────────────────────────────
  // スクリーンショット 5: ポップアップ（拡張機能アイコンクリック時）
  // ─────────────────────────────────────────
  console.log('\n📸 5/5: ポップアップ');
  const page5 = await context.newPage();
  await page5.setViewportSize(VIEWPORT);
  await page5.goto(popupUrl);
  await page5.waitForLoadState('networkidle');

  // ポップアップを中央に見せるための背景スタイルを設定
  await page5.evaluate(() => {
    document.body.style.background = 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.style.margin = '0';
  });

  await waitAndScreenshot(page5, path.join(outputDir, '05_popup.png'), 1000);

  // ─────────────────────────────────────────
  // 完了
  // ─────────────────────────────────────────
  console.log(`\n🎉 完了！ 5枚のスクリーンショットを保存しました`);
  console.log(`📁 保存先: ${outputDir}`);
  console.log('\n確認のため10秒間ブラウザを開いたままにします...');
  await context.pages()[0]?.waitForTimeout(10000);

  await context.close();
})();
