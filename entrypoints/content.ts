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
        height: 47vh;
        min-height: 200px;
        border: none;
        border-radius: 16px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05);
        background: white;
        backdrop-filter: blur(10px);
        overflow: hidden;
      `;

      // iframe内のコンテンツサイズに合わせて高さを自動調整
      iframe.addEventListener('load', () => {
        const adjustHeight = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              // body全体の高さを取得
              const body = iframeDoc.body;
              const html = iframeDoc.documentElement;

              // scrollHeightで実際のコンテンツ高さを取得
              const contentHeight = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight
              );

              // 最大高さは画面の約47%（5件表示程度）
              const maxHeight = window.innerHeight * 0.47;
              const finalHeight = Math.min(contentHeight, maxHeight);

              console.log('Content height:', contentHeight, 'Final height:', finalHeight);
              iframe.style.height = `${finalHeight}px`;
            }
          } catch (e) {
            console.error('Failed to adjust iframe height:', e);
          }
        };

        // 初回調整（DOMが完全にレンダリングされるまで待つ）
        setTimeout(adjustHeight, 100);
        setTimeout(adjustHeight, 300);
        setTimeout(adjustHeight, 500);

        // コンテンツの変更を監視して高さを調整
        const observer = new MutationObserver(() => {
          setTimeout(adjustHeight, 50);
        });
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          observer.observe(iframeDoc.body, {
            childList: true,
            subtree: true,
            attributes: true,
          });
        }
      });

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
