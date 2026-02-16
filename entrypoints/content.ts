import { isValidMessageOrigin } from '../lib/security';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Kord content script loaded');

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

        // iframeにフォーカス要求メッセージを送信
        const shadowRoot = paletteRoot.shadowRoot;
        if (shadowRoot) {
          const iframe = shadowRoot.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              { type: 'PALETTE_SHOWN' },
              browser.runtime.getURL('/')
            );
          }
        }
        return;
      }

      // ルート要素を作成
      paletteRoot = document.createElement('div');
      paletteRoot.id = 'kord-root';
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
              const body = iframeDoc.body;
              const html = iframeDoc.documentElement;

              const contentHeight = Math.max(
                body.scrollHeight,
                body.offsetHeight,
                html.clientHeight,
                html.scrollHeight,
                html.offsetHeight
              );

              // 最大高さは画面の約47%
              const maxHeight = window.innerHeight * 0.47;
              const finalHeight = Math.min(contentHeight, maxHeight);

              iframe.style.height = `${finalHeight}px`;
            }
          } catch (e) {
            console.error('Failed to adjust iframe height:', e);
          }
        };

        // 初回調整（DOMレンダリング待機）
        setTimeout(adjustHeight, 100);

        // ResizeObserverでコンテンツサイズ変更を監視
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc && 'ResizeObserver' in window) {
          const resizeObserver = new ResizeObserver(() => {
            adjustHeight();
          });

          // body要素のサイズ変更を監視
          resizeObserver.observe(iframeDoc.body);
        } else {
          // ResizeObserver非対応ブラウザ用フォールバック
          const observer = new MutationObserver(() => {
            setTimeout(adjustHeight, 50);
          });

          observer.observe(iframeDoc!.body, {
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

      // Escキーで閉じる（キャプチャフェーズで確実に捕捉）
      document.addEventListener('keydown', handleEscKey, true);

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

        // iframeに非表示メッセージを送信（状態リセット用）
        const shadowRoot = paletteRoot.shadowRoot;
        if (shadowRoot) {
          const iframe = shadowRoot.querySelector('iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              { type: 'PALETTE_HIDDEN' },
              browser.runtime.getURL('/')
            );
          }
        }
      }
    }

    /**
     * Escキーハンドラー（確実に閉じる）
     */
    function handleEscKey(e: KeyboardEvent) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isVisible) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        hidePalette();
      }
    }

    /**
     * パレットからのメッセージハンドラー
     */
    function handlePaletteMessage(e: MessageEvent) {
      // Origin検証を追加
      if (!isValidMessageOrigin(e.origin)) {
        console.warn('Kord: Rejected message from untrusted origin:', e.origin);
        return;
      }

      if (e.data?.type === 'CLOSE_PALETTE') {
        e.stopPropagation();
        hidePalette();
      }
    }
  },
});
