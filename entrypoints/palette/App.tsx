import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Zap,
  LayoutGrid,
  Bookmark,
  History,
  RotateCcw,
  Plus,
  X,
  XCircle,
  Copy,
  Pin,
  Volume2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  Download,
  Puzzle,
  Settings,
  BookMarked,
  ChevronRight,
  Folder,
  FolderPlus,
  type LucideIcon
} from 'lucide-react';
import { fuzzyMatchMultiple } from '../../lib/fuzzy';
import { recordUsage, getFrecencyData, calculateFrecencyScore } from '../../lib/frecency';
import { getCommands } from '../../lib/constants';
import type { SearchResult, ResultType } from '../../lib/types';
import { getExtensionOrigin, isSafeUrl } from '../../lib/security';
import { recordAction } from '../../lib/analytics';

// アイコンマッピング
const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  X,
  XCircle,
  Copy,
  Pin,
  Volume2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Bookmark,
  Trash2,
  Download,
  Puzzle,
  Settings,
  History,
  BookMarked,
  Folder,
  FolderPlus,
};

const BOOKMARK_CACHE_TTL = 60 * 1000; // 60秒キャッシュ

function App() {

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  const [mode, setMode] = useState<'search' | 'command' | 'folder-select'>('search');
  const [error, setError] = useState<string | null>(null);
  const [pendingBookmark, setPendingBookmark] = useState<{ title: string; url: string } | null>(null);
  const [folderCreateParent, setFolderCreateParent] = useState<{ id: string; title: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const folderCreateParentRef = useRef<{ id: string; title: string } | null>(null);
  const pendingBookmarkRef = useRef<{ title: string; url: string } | null>(null);
  const queryRef = useRef(query);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookmarkCacheRef = useRef<{
    data: Array<{ id: string; title: string; url: string }> | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });

  // queryRef を常に最新の query に同期
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // 初期化: オートフォーカス + 初期検索（mount 時の1回のみ）
  useEffect(() => {
    const focusInput = () => {
      inputRef.current?.focus();
    };

    // 即座にフォーカス＆初期検索
    focusInput();
    performSearch('', 'search'); // eslint-disable-line react-hooks/exhaustive-deps

    // タイマーで複数回試行
    const timer1 = setTimeout(focusInput, 50);
    const timer2 = setTimeout(focusInput, 150);
    const timer3 = setTimeout(focusInput, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // パレット表示/非表示メッセージを受信
  useEffect(() => {
    const handlePaletteMessages = (e: MessageEvent): void => {
      if (e.data?.type === 'PALETTE_SHOWN') {
        // フォーカスを設定
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
        // 状態をリセットして初期検索を実行
        setQuery('');
        setSelectedIndex(0);
        setMode('search');
        performSearch('', 'search');
      } else if (e.data?.type === 'PALETTE_HIDDEN') {
        // 状態をリセット
        setQuery('');
        setSelectedIndex(0);
        setMode('search');
        setError(null);
        setPendingBookmark(null);
        pendingBookmarkRef.current = null;
        setFolderCreateParent(null);
        folderCreateParentRef.current = null;
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
        // 新規フォルダ作成モード中はフォルダ選択に戻る（パレットは閉じない）
        if (folderCreateParentRef.current) {
          setFolderCreateParent(null);
          folderCreateParentRef.current = null;
          setQuery('');
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }

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
        } catch {
          // 無視
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
        if (mode === 'folder-select') {
          // フォルダ選択をキャンセルしてコマンドモードへ戻る
          setPendingBookmark(null);
          pendingBookmarkRef.current = null;
          setFolderCreateParent(null);
          folderCreateParentRef.current = null;
          setMode('command');
          setQuery('');
          performSearch('', 'command');
        } else {
          const newMode = mode === 'search' ? 'command' : 'search';
          setMode(newMode);
          performSearch(queryRef.current, newMode);
        }
        setSelectedIndex(0);
      } else if (e.key === 'Enter') {
        // IME入力中は無視
        if (isComposing) return;
        e.preventDefault();

        // 新規フォルダ作成モード: フォルダを作成してブックマーク保存
        if (folderCreateParentRef.current) {
          const folderName = queryRef.current.trim();
          if (!folderName) return;
          (async () => {
            try {
              const { folderId } = await browser.runtime.sendMessage({
                type: 'CREATE_BOOKMARK_FOLDER',
                name: folderName,
                parentId: folderCreateParentRef.current!.id,
              });
              if (pendingBookmarkRef.current) {
                await browser.runtime.sendMessage({
                  type: 'ADD_BOOKMARK',
                  title: pendingBookmarkRef.current.title,
                  url: pendingBookmarkRef.current.url,
                  parentId: folderId,
                });
              }
              setPendingBookmark(null);
              pendingBookmarkRef.current = null;
              setFolderCreateParent(null);
              folderCreateParentRef.current = null;
              setMode('search');
              closePalette();
            } catch {
              // 無視
            }
          })();
          return;
        }

        if (results.length > 0 && results[selectedIndex]) {
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

  /**
   * 統合検索を実行（タブ・履歴・ブックマーク を常に対象）
   */
  const performSearch = async (
    searchQuery: string,
    currentMode: 'search' | 'command' | 'folder-select',
  ) => {
    const trimmedQuery = searchQuery.trim();
    let allResults: SearchResult[] = [];

    // フォルダ選択モード
    if (currentMode === 'folder-select') {
      if (folderCreateParentRef.current) return; // フォルダ名入力中は検索しない
      const allFolders: { id: string; title: string; depth: number }[] = await browser.runtime.sendMessage({ type: 'GET_BOOKMARK_FOLDERS' });
      const newFolderItem: SearchResult = {
        id: 'new-folder',
        type: 'command',
        title: 'New Folder',
        subtitle: 'Create a new bookmark folder',
        action: 'NEW_BOOKMARK_FOLDER',
        icon: 'FolderPlus',
        score: 0,
      };
      const folderResults: SearchResult[] = allFolders
        .filter(f => !trimmedQuery || f.title.toLowerCase().includes(trimmedQuery.toLowerCase()))
        .map(f => ({
          id: `folder-${f.id}`,
          folderId: f.id,
          type: 'bookmark-folder' as ResultType,
          title: f.title,
          depth: f.depth,
          score: 0,
        }));
      setResults([newFolderItem, ...folderResults.slice(0, 11)]);
      setSelectedIndex(0);
      return;
    }

    // コマンドモードの場合
    if (currentMode === 'command') {
      if (!trimmedQuery) {
        allResults = getCommands().map((cmd) => ({
          id: cmd.id,
          type: 'command' as ResultType,
          title: cmd.title,
          subtitle: cmd.subtitle,
          action: cmd.action,
          url: cmd.url,
          icon: cmd.icon,
          score: 0,
        }));
      } else {
        allResults = searchCommands(trimmedQuery).sort((a, b) => b.score - a.score);
      }
      setResults(allResults.slice(0, 12));
      setSelectedIndex(0);
      return;
    }

    // 現在のアクティブタブを除外するため ID を取得
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTabId = activeTab?.id;

    // 検索モード: クエリなし → タブ一覧をFrecency順
    if (!trimmedQuery) {
      const tabs = await getTabs();
      const frecencyData = await getFrecencyData();
      const tabResults: SearchResult[] = tabs
        .filter((tab: any) => tab.tabId !== activeTabId)
        .map((tab: any) => ({
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
      // クエリあり: タブ・履歴・ブックマークを並列取得してスコア順に統合
      const [tabs, history, bookmarks, suggestions] = await Promise.all([
        getTabs(),
        getHistory(trimmedQuery),
        getBookmarksCached(),
        getGoogleSuggestions(trimmedQuery),
      ]);

      const frecencyData = await getFrecencyData();

      const tabResults: SearchResult[] = tabs
        .filter((tab: any) => tab.tabId !== activeTabId)
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
        .filter((r: SearchResult) => r.score > 0.3);

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
        .filter((r: SearchResult) => r.score > 0.3);

      const bookmarkResults: SearchResult[] = bookmarks
        .map((b: any) => {
          const fuzzyScore = fuzzyMatchMultiple(trimmedQuery, [b.title, b.url || '']).score;
          return {
            id: b.id,
            type: 'bookmark' as ResultType,
            title: b.title,
            subtitle: b.url,
            url: b.url,
            score: fuzzyScore,
          };
        })
        .filter((r: SearchResult) => r.score > 0.3);

      allResults = [...tabResults, ...historyResults, ...bookmarkResults].sort(
        (a, b) => b.score - a.score
      );

      // Google検索候補を最下部に追加
      const searchResults: SearchResult[] = suggestions.map((suggestion: string, index: number) => ({
        id: `google-search-${index}`,
        type: 'search' as ResultType,
        title: suggestion,
        subtitle: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
        score: -1 - index,
      }));
      allResults.push(...searchResults);
    }

    const finalResults = allResults.slice(0, 11);
    console.log('[QuickBar] performSearch results:', finalResults.map(r => ({
      type: r.type,
      title: r.title,
      url: r.url,
      score: r.score,
    })));
    setResults(finalResults);
    setSelectedIndex(0);
  };

  const searchCommands = (query: string): SearchResult[] => {
    return getCommands().map((cmd) => {
      const fuzzyScore = fuzzyMatchMultiple(query, [cmd.title, cmd.subtitle]).score;
      return {
        id: cmd.id,
        type: 'command' as ResultType,
        title: cmd.title,
        subtitle: cmd.subtitle,
        action: cmd.action,
        url: cmd.url,
        icon: cmd.icon,
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

  const getBookmarksCached = async () => {
    const now = Date.now();
    if (bookmarkCacheRef.current.data && now - bookmarkCacheRef.current.timestamp < BOOKMARK_CACHE_TTL) {
      return bookmarkCacheRef.current.data;
    }
    const data = await getBookmarks();
    bookmarkCacheRef.current = { data, timestamp: now };
    return data;
  };

  const getHistory = async (query: string) => {
    return browser.runtime.sendMessage({ type: 'GET_HISTORY', query });
  };

  const getGoogleSuggestions = async (query: string): Promise<string[]> => {
    try {
      // Google Suggest APIを使用して検索候補を取得
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      // data[1]に候補の配列が含まれる
      const suggestions = data[1]?.slice(0, 4) || []; // 最大4件の候補を取得
      // 入力されたクエリを先頭に追加
      return [query, ...suggestions.filter((s: string) => s !== query)];
    } catch {
      return [query];
    }
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
            await recordAction('tabSwitch');
          }
          break;

        case 'bookmark':
          if (result.url) {
            await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
            await recordAction('bookmarkOpen');
          }
          break;

        case 'history':
          if (result.url) {
            await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
            await recordAction('historyOpen');
          }
          break;

        case 'search':
          if (result.url) {
            await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
            await recordAction('searchGoogle');
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

        case 'bookmark-folder':
          if (pendingBookmark && result.folderId) {
            await browser.runtime.sendMessage({
              type: 'ADD_BOOKMARK',
              title: pendingBookmark.title,
              url: pendingBookmark.url,
              parentId: result.folderId,
            });
            setPendingBookmark(null);
            pendingBookmarkRef.current = null;
            setMode('search');
          }
          break;

        case 'command': {
          const shouldClose = await executeCommand(result);
          await recordAction('commandExecute');
          if (shouldClose === false) return;
          break;
        }
      }

      closePalette();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      // 3秒後にエラーメッセージをクリア
      setTimeout(() => setError(null), 3000);
    }
  };

  const executeCommand = async (result: SearchResult): Promise<false | void> => {
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
            icon: 'RotateCcw',
            score: 0,
          }));
          setResults(sessionResults.slice(0, 12));
          break;

        case 'ADD_BOOKMARK': {
          const [bookmarkTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (bookmarkTab?.url && bookmarkTab?.title) {
            setPendingBookmark({ title: bookmarkTab.title, url: bookmarkTab.url });
            pendingBookmarkRef.current = { title: bookmarkTab.title, url: bookmarkTab.url };
            setMode('folder-select');
            setQuery('');
            setFolderCreateParent(null);
            folderCreateParentRef.current = null;
            performSearch('', 'folder-select');
          }
          return false;
        }

        case 'NEW_BOOKMARK_FOLDER': {
          setFolderCreateParent({ id: '2', title: 'Other Bookmarks' });
          folderCreateParentRef.current = { id: '2', title: 'Other Bookmarks' };
          setQuery('');
          return false;
        }

        case 'CLEAR_CACHE': {
          const [cacheTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (cacheTab?.id) {
            await browser.runtime.sendMessage({ type: 'CLEAR_CACHE', tabId: cacheTab.id });
          }
          break;
        }

        case 'CLEAR_COOKIES': {
          const [cookieTab] = await browser.tabs.query({ active: true, currentWindow: true });
          if (cookieTab?.id) {
            await browser.runtime.sendMessage({ type: 'CLEAR_COOKIES', tabId: cookieTab.id });
          }
          break;
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Command execution failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  const closePalette = () => {
    try {
      // 状態をリセット
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setMode('search');
      setError(null);
      setPendingBookmark(null);
      pendingBookmarkRef.current = null;
      setFolderCreateParent(null);
      folderCreateParentRef.current = null;

      const origin = getExtensionOrigin();
      window.parent.postMessage({ type: 'CLOSE_PALETTE' }, origin);
      window.parent.postMessage({ type: 'CLOSE_PALETTE' }, '*');
      if (window.top && window.top !== window) {
        window.top.postMessage({ type: 'CLOSE_PALETTE' }, '*');
      }
    } catch {
      // 無視
    }
  };

  const getTypeIcon = (type: ResultType, iconName?: string): React.ReactNode => {
    const iconSize = 20;
    const iconStrokeWidth = 2;

    // コマンドタイプの場合、カスタムアイコンを使用
    if (type === 'command' && iconName && ICON_MAP[iconName]) {
      const IconComponent = ICON_MAP[iconName];
      return <IconComponent size={iconSize} strokeWidth={iconStrokeWidth} />;
    }

    // デフォルトアイコン
    switch (type) {
      case 'tab':
        return <LayoutGrid size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'bookmark':
        return <Bookmark size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'history':
        return <History size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'command':
        return <Zap size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'search':
        return <Search size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'session':
        return <RotateCcw size={iconSize} strokeWidth={iconStrokeWidth} />;
      case 'bookmark-folder':
        return <Folder size={iconSize} strokeWidth={iconStrokeWidth} />;
    }
  };

  const getActionText = (type: ResultType): string => {
    switch (type) {
      case 'tab':
        return 'Switch to Tab';
      case 'bookmark':
        return 'Open';
      case 'history':
        return 'Open in New Tab';
      case 'command':
        return '';
      case 'search':
        return 'Search Google';
      case 'session':
        return 'Restore Session';
      case 'bookmark-folder':
        return '';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* エラー通知 */}
      {error && (
        <div className="error-notification">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
        </div>
      )}

      {/* 検索バー */}
      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-icon">
            {mode === 'folder-select' ? (
              <Folder size={18} strokeWidth={2.5} color="white" />
            ) : mode === 'search' ? (
              <Search size={18} strokeWidth={2.5} color="white" />
            ) : (
              <Zap size={18} strokeWidth={2.5} color="white" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              const newQuery = e.target.value;
              setQuery(newQuery);
              if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
              searchTimerRef.current = setTimeout(() => {
                performSearch(newQuery, mode);
              }, 300);
            }}
            placeholder={
              mode === 'folder-select'
                ? (folderCreateParent ? 'Enter folder name...' : 'Search folders...')
                : mode === 'search' ? 'Search tabs, bookmarks, history...' : 'Search commands...'
            }
            className="search-input"
            autoComplete="off"
            spellCheck="false"
          />
          <kbd className="search-hint">ESC</kbd>
        </div>
        {folderCreateParent && (
          <div className="folder-create-banner">
            <FolderPlus size={14} />
            <span>Creating folder in: {folderCreateParent.title}</span>
          </div>
        )}
      </div>

      {/* 結果リスト */}
      <div ref={resultsRef} className="results-container">
        {results.length === 0 && query && (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={32} strokeWidth={2} color="white" />
            </div>
            <p className="empty-title">No results found</p>
          </div>
        )}

        {results.length === 0 && !query && (
          <div className="empty-state">
            <div className="empty-icon">
              {mode === 'search' ? (
                <Search size={32} strokeWidth={2} color="white" />
              ) : (
                <Zap size={32} strokeWidth={2} color="white" />
              )}
            </div>
            <p className="empty-title">{mode === 'search' ? 'Search Mode' : 'Command Mode'}</p>
            <p className="empty-subtitle">
              {mode === 'search'
                ? 'Start typing to search tabs, bookmarks, and history'
                : 'Start typing to search commands'}
            </p>
            <p className="empty-hint">
              {mode === 'search'
                ? 'Press Tab to switch to Command Mode'
                : 'Press Tab to switch to Search Mode'}
            </p>
          </div>
        )}

        {results.map((result, index) => (
          <div
            key={result.id}
            onClick={() => executeResult(result)}
            className={`result-item ${index === selectedIndex ? 'selected' : ''}`}
            style={result.type === 'bookmark-folder' && result.depth ? { paddingLeft: `calc(14px + ${result.depth} * 16px)` } : undefined}
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
                getTypeIcon(result.type, result.icon)
              )}
            </div>

            <div className="result-content">
              <div className="result-title">{result.title}</div>
              {result.subtitle && <div className="result-subtitle">{result.subtitle}</div>}
            </div>

            {result.type === 'command' && result.shortcut ? (
              <kbd className="result-shortcut">{result.shortcut}</kbd>
            ) : (
              <div className="result-action">
                <span className="result-action-text">{getActionText(result.type)}</span>
                <ChevronRight size={16} strokeWidth={2} className="result-action-icon" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
