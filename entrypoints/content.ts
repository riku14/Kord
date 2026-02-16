export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('QuickBar content script loaded');

    let paletteRoot: HTMLDivElement | null = null;
    let isVisible = false;

    // Background Scriptからのメッセージリスナー
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'TOGGLE_PALETTE') {
        togglePalette();
      }
    });

    /**
     * パレットの表示/非表示を切り替え
     */
    function togglePalette() {
      if (isVisible) {
        hidePalette();
      } else {
        showPalette();
      }
    }

    /**
     * パレットを表示
     */
    function showPalette() {
      if (paletteRoot) {
        paletteRoot.style.display = 'flex';
        isVisible = true;
        return;
      }

      // ルート要素を作成
      paletteRoot = document.createElement('div');
      paletteRoot.id = 'quickbar-root';
      paletteRoot.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2147483647;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        padding-top: 20vh;
      `;

      // Shadow DOMをアタッチ
      const shadowRoot = paletteRoot.attachShadow({ mode: 'open' });

      // iframeを作成（完全にCSSを隔離）
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        width: 680px;
        max-height: 520px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        background: white;
        backdrop-filter: blur(10px);
        overflow: hidden;
      `;

      // パレットのHTMLページを読み込み
      iframe.src = browser.runtime.getURL('/palette.html');

      shadowRoot.appendChild(iframe);

      // オーバーレイクリックで閉じる
      paletteRoot.addEventListener('click', (e) => {
        if (e.target === paletteRoot) {
          hidePalette();
        }
      });

      // Escキーで閉じる
      document.addEventListener('keydown', handleEscKey);

      // iframeからのメッセージを受信
      window.addEventListener('message', handlePaletteMessage);

      document.body.appendChild(paletteRoot);
      isVisible = true;
    }

    /**
     * パレットを非表示
     */
    function hidePalette() {
      if (paletteRoot) {
        paletteRoot.style.display = 'none';
        isVisible = false;
      }
    }

    /**
     * Escキーハンドラー
     */
    function handleEscKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isVisible) {
        hidePalette();
      }
    }

    /**
     * パレットからのメッセージハンドラー
     */
    function handlePaletteMessage(e: MessageEvent) {
      if (e.data?.type === 'CLOSE_PALETTE') {
        hidePalette();
      }
    }
  },
});
