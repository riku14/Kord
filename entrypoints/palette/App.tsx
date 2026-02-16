import React, { useState, useEffect, useRef } from 'react';
import { fuzzyMatchMultiple } from '../../lib/fuzzy';
import { recordUsage, getFrecencyData, calculateFrecencyScore } from '../../lib/frecency';
import { COMMANDS } from '../../lib/constants';
import type { SearchResult, ResultType } from '../../lib/types';
import { getExtensionOrigin, isSafeUrl } from '../../lib/security';

// SVGアイコンコンポーネント
const SearchIcon = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CommandIcon = ({ size = 20, color = 'white' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const TabIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

const BookmarkIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const HistoryIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SessionIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const [mode, setMode] = useState<'search' | 'command'>('search');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 初期化: オートフォーカス（複数回試行）
  useEffect(() => {
    const focusInput = () => {
      inputRef.current?.focus();
    };

    // 即座にフォーカス
    focusInput();

    // タイマーで複数回試行
    const timer1 = setTimeout(focusInput, 50);
    const timer2 = setTimeout(focusInput, 150);
    const timer3 = setTimeout(focusInput, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // パレット表示/非表示メッセージを受信
  useEffect(() => {
    const handlePaletteMessages = (e: MessageEvent) => {
      if (e.data?.type === 'PALETTE_SHOWN') {
        // フォーカスを設定
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      } else if (e.data?.type === 'PALETTE_HIDDEN') {
        // 状態をリセット
        setQuery('');
        setSelectedIndex(0);
        setMode('search');
        setError(null);
      }
    };

    window.addEventListener('message', handlePaletteMessages);
    return () => window.removeEventListener('message', handlePaletteMessages);
  }, []);

  // IME入力状態を監視
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);

    input.addEventListener('compositionstart', handleCompositionStart);
    input.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      input.removeEventListener('compositionstart', handleCompositionStart);
      input.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, []);

  // ESCキー専用ハンドラ（iframe内で確実に捕捉・閉じる。依存なしで常時有効）
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        try {
          const origin = getExtensionOrigin();
          // 複数の方法で送信を試みる
          window.parent.postMessage({ type: 'CLOSE_PALETTE' }, origin);
          window.parent.postMessage({ type: 'CLOSE_PALETTE' }, '*');
          if (window.top && window.top !== window) {
            window.top.postMessage({ type: 'CLOSE_PALETTE' }, '*');
          }
        } catch (err) {
          console.error('Failed to close palette:', err);
        }
      }
    };
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, []);

  // グローバルキーボードナビゲーション（矢印・Tab・Enter）
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab') {
        // IME入力中はスキップ
        if (isComposing) return;
        e.preventDefault();
        setMode((prev) => prev === 'search' ? 'command' : 'search');
        setSelectedIndex(0);
      } else if (e.key === 'Enter' && results.length > 0) {
        // IME入力中は無視
        if (isComposing) return;
        e.preventDefault();
        if (results[selectedIndex]) {
          executeResult(results[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, [results, selectedIndex, isComposing, mode]);

  // 選択されたアイテムを画面内にスクロール
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results.length]);

  // スクロール伝播を防止
  useEffect(() => {
    const resultsElement = resultsRef.current;
    if (!resultsElement) return;

    const preventScroll = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = resultsElement;
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;

      // 上端で上にスクロールしようとしている、または下端で下にスクロールしようとしている場合
      if ((isScrollingUp && scrollTop === 0) || (isScrollingDown && scrollTop + clientHeight >= scrollHeight)) {
        e.preventDefault();
      }
    };

    resultsElement.addEventListener('wheel', preventScroll, { passive: false });
    return () => resultsElement.removeEventListener('wheel', preventScroll);
  }, []);

  // 検索クエリが変更されたら結果を更新
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300); // 100ms → 300msに変更

    return () => clearTimeout(searchTimeout);
  }, [query, mode]);

  /**
   * 統合検索を実行
   */
  const performSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    let allResults: SearchResult[] = [];

    // コマンドモードの場合
    if (mode === 'command') {
      if (!trimmedQuery) {
        // 空のクエリ: 全コマンドを表示
        allResults = COMMANDS.map((cmd) => ({
          id: cmd.id,
          type: 'command' as ResultType,
          title: cmd.title,
          subtitle: cmd.subtitle,
          action: cmd.action,
          url: cmd.url,
          score: 0,
        }));
      } else {
        // 検索クエリあり: コマンドのみ検索
        allResults = searchCommands(trimmedQuery).sort((a, b) => b.score - a.score);
      }
      setResults(allResults.slice(0, 12));
      setSelectedIndex(0);
      return;
    }

    // 検索モードの場合（既存のロジック）
    if (!trimmedQuery) {
      // 空のクエリ: 開いているタブをFrecencyスコア順に表示
      const tabs = await getTabs();
      const frecencyData = await getFrecencyData();
      const tabResults: SearchResult[] = tabs.map((tab: any) => ({
        id: tab.id,
        type: 'tab' as ResultType,
        title: tab.title,
        subtitle: tab.url,
        url: tab.url,
        favicon: tab.favicon,
        score: calculateFrecencyScore(frecencyData[tab.id]),
        tabId: tab.tabId,
        windowId: tab.windowId,
      }));
      allResults = tabResults.sort((a, b) => b.score - a.score);
    } else {
      // 検索クエリあり: タブと履歴のみ検索（Arc風）
      const [tabs, history] = await Promise.all([
        getTabs(),
        getHistory(trimmedQuery),
      ]);

      const frecencyData = await getFrecencyData();

      const tabResults: SearchResult[] = tabs
        .map((tab: any) => {
          const fuzzyScore = fuzzyMatchMultiple(trimmedQuery, [tab.title, tab.url || '']).score;
          const frecencyScore = calculateFrecencyScore(frecencyData[tab.id]);
          return {
            id: tab.id,
            type: 'tab' as ResultType,
            title: tab.title,
            subtitle: tab.url,
            url: tab.url,
            favicon: tab.favicon,
            score: fuzzyScore + frecencyScore,
            tabId: tab.tabId,
            windowId: tab.windowId,
          };
        })
        .filter((r) => r.score > 0);

      const historyResults: SearchResult[] = history
        .map((h: any) => {
          const fuzzyScore = fuzzyMatchMultiple(trimmedQuery, [h.title, h.url || '']).score;
          return {
            id: h.id,
            type: 'history' as ResultType,
            title: h.title,
            subtitle: h.url,
            url: h.url,
            score: fuzzyScore,
          };
        })
        .filter((r) => r.score > 0);

      allResults = [...tabResults, ...historyResults].sort(
        (a, b) => b.score - a.score
      );

      // Google検索候補を最下部に追加
      const googleSearchResult: SearchResult = {
        id: 'google-search',
        type: 'search' as ResultType,
        title: `Google で "${trimmedQuery}" を検索`,
        subtitle: `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`,
        score: -1, // 常に最下部に表示
      };
      allResults.push(googleSearchResult);
    }

    setResults(allResults.slice(0, 11)); // Google検索候補を含めて最大11件
    setSelectedIndex(0);
  };

  const searchCommands = (query: string): SearchResult[] => {
    return COMMANDS.map((cmd) => {
      const fuzzyScore = fuzzyMatchMultiple(query, [cmd.title, cmd.subtitle]).score;
      return {
        id: cmd.id,
        type: 'command' as ResultType,
        title: cmd.title,
        subtitle: cmd.subtitle,
        action: cmd.action,
        url: cmd.url,
        score: fuzzyScore,
      };
    }).filter((r) => r.score > 0);
  };

  const getTabs = async () => {
    return browser.runtime.sendMessage({ type: 'GET_TABS' });
  };

  const getBookmarks = async () => {
    return browser.runtime.sendMessage({ type: 'GET_BOOKMARKS' });
  };

  const getHistory = async (query: string) => {
    return browser.runtime.sendMessage({ type: 'GET_HISTORY', query });
  };

  const executeResult = async (result: SearchResult) => {
    try {
      await recordUsage(result.id);

      switch (result.type) {
        case 'tab':
          if (result.tabId && result.windowId) {
            await browser.runtime.sendMessage({
              type: 'SWITCH_TAB',
              tabId: result.tabId,
              windowId: result.windowId,
            });
          }
          break;

        case 'bookmark':
        case 'history':
        case 'search':
          if (result.url) {
            await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
          }
          break;

        case 'session':
          if (result.sessionId) {
            await browser.runtime.sendMessage({
              type: 'RESTORE_SESSION',
              sessionId: result.sessionId
            });
          }
          break;

        case 'command':
          await executeCommand(result);
          break;
      }

      closePalette();
    } catch (error) {
      console.error('Failed to execute result:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      // 3秒後にエラーメッセージをクリア
      setTimeout(() => setError(null), 3000);
    }
  };

  const executeCommand = async (result: SearchResult) => {
    try {
      const action = result.action;
      if (!action) return;

      switch (action) {
        case 'NEW_TAB':
          await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
          break;

        case 'CLOSE_TAB':
          const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (currentTab?.id) {
            await browser.runtime.sendMessage({ type: 'CLOSE_TAB', tabId: currentTab.id });
          }
          break;

        case 'CLOSE_OTHER_TABS':
          const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (activeTab?.id) {
            await browser.runtime.sendMessage({ type: 'CLOSE_OTHER_TABS', tabId: activeTab.id });
          }
          break;

        case 'DUPLICATE_TAB':
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            await browser.runtime.sendMessage({ type: 'DUPLICATE_TAB', tabId: tab.id });
          }
          break;

        case 'PIN_TAB':
          const [pinTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (pinTab?.id) {
            await browser.runtime.sendMessage({
              type: 'PIN_TAB',
              tabId: pinTab.id,
              pinned: !pinTab.pinned,
            });
          }
          break;

        case 'MUTE_TAB':
          const [muteTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (muteTab?.id) {
            await browser.runtime.sendMessage({
              type: 'MUTE_TAB',
              tabId: muteTab.id,
              muted: !muteTab.mutedInfo?.muted,
            });
          }
          break;

        case 'GO_BACK':
          const [backTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (backTab?.id) {
            await browser.runtime.sendMessage({ type: 'GO_BACK', tabId: backTab.id });
          }
          break;

        case 'GO_FORWARD':
          const [forwardTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (forwardTab?.id) {
            await browser.runtime.sendMessage({ type: 'GO_FORWARD', tabId: forwardTab.id });
          }
          break;

        case 'RELOAD_TAB':
          const [reloadTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (reloadTab?.id) {
            await browser.runtime.sendMessage({ type: 'RELOAD_TAB', tabId: reloadTab.id });
          }
          break;

        case 'SHOW_RECENTLY_CLOSED':
          const sessions = await browser.runtime.sendMessage({ type: 'GET_RECENTLY_CLOSED' });
          const sessionResults: SearchResult[] = sessions.map((s: any) => ({
            id: s.sessionId,
            type: 'session' as ResultType,
            title: s.tab?.title || s.window?.tabs?.[0]?.title || 'Untitled',
            subtitle: s.tab?.url || `${s.window?.tabs?.length || 0} tabs`,
            sessionId: s.sessionId,
            score: 0,
          }));
          setResults(sessionResults.slice(0, 12));
          break;

        case 'ADD_BOOKMARK':
          const [bookmarkTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (bookmarkTab?.url && bookmarkTab?.title) {
            await browser.runtime.sendMessage({
              type: 'ADD_BOOKMARK',
              title: bookmarkTab.title,
              url: bookmarkTab.url
            });
          }
          break;

        case 'CLEAR_CACHE':
          await browser.runtime.sendMessage({ type: 'CLEAR_CACHE' });
          break;
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
      setError(error instanceof Error ? error.message : 'Command execution failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  const closePalette = () => {
    try {
      // 拡張機能のオリジンを明示的に指定
      window.parent.postMessage(
        { type: 'CLOSE_PALETTE' },
        getExtensionOrigin()
      );
    } catch (error) {
      console.error('Failed to close palette:', error);
    }
  };

  const getTypeIcon = (type: ResultType): React.ReactNode => {
    const iconColor = 'var(--qb-muted)';
    switch (type) {
      case 'tab':
        return <TabIcon size={20} color={iconColor} />;
      case 'bookmark':
        return <BookmarkIcon size={20} color={iconColor} />;
      case 'history':
        return <HistoryIcon size={20} color={iconColor} />;
      case 'command':
        return <CommandIcon size={20} color={iconColor} />;
      case 'search':
        return <SearchIcon size={20} color={iconColor} />;
      case 'session':
        return <SessionIcon size={20} color={iconColor} />;
    }
  };

  const getBadgeClass = (type: ResultType): string => {
    switch (type) {
      case 'tab':
        return 'badge-tab';
      case 'bookmark':
        return 'badge-bookmark';
      case 'history':
        return 'badge-history';
      case 'command':
        return 'badge-command';
      case 'search':
        return 'badge-search';
      case 'session':
        return 'badge-session';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* エラー通知 */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {error}
        </div>
      )}

      {/* 検索バー */}
      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-icon">
            {mode === 'search' ? <SearchIcon size={18} /> : <CommandIcon size={18} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'search' ? 'Search tabs, history...' : 'Search commands...'}
            className="search-input"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="search-hint">ESC</kbd>
        </div>
      </div>

      {/* 結果リスト */}
      <div ref={resultsRef} className="results-container">
        {results.length === 0 && query && (
          <div className="empty-state">
            <div className="empty-icon">
              <SearchIcon size={32} />
            </div>
            <p className="empty-title">No results found</p>
          </div>
        )}

        {results.length === 0 && !query && (
          <div className="empty-state">
            <div className="empty-icon">
              {mode === 'search' ? <SearchIcon size={32} /> : <CommandIcon size={32} />}
            </div>
            <p className="empty-title">{mode === 'search' ? 'Search Mode' : 'Command Mode'}</p>
            <p className="empty-subtitle">
              {mode === 'search'
                ? 'Start typing to search tabs, bookmarks, and history'
                : 'Start typing to search commands'}
            </p>
            <p className="empty-hint">
              Press <kbd>Tab</kbd> to switch to {mode === 'search' ? 'Command Mode' : 'Search Mode'}
            </p>
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={result.id}
            onClick={() => executeResult(result)}
            className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
          >
            <div className="result-icon">
              {result.favicon && result.type !== 'command' && isSafeUrl(result.favicon) ? (
                <img
                  src={result.favicon}
                  alt=""
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                getTypeIcon(result.type)
              )}
            </div>

            <div className="result-content">
              <div className="result-title">{result.title}</div>
              {result.subtitle && <div className="result-subtitle">{result.subtitle}</div>}
            </div>

            <div className={`result-badge ${getBadgeClass(result.type)}`}>
              {result.type.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
