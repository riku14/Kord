import React, { useState, useEffect, useRef } from 'react';
import { fuzzyMatchMultiple } from '../../lib/fuzzy';
import { recordUsage, getFrecencyData, calculateFrecencyScore } from '../../lib/frecency';
import { COMMANDS } from '../../lib/constants';
import type { SearchResult, ResultType } from '../../lib/types';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 初期化: オートフォーカス
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // グローバルキーボードナビゲーション
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        if (results[selectedIndex]) {
          executeResult(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [results, selectedIndex]);

  // 選択されたアイテムを画面内にスクロール
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results.length]);

  // 検索クエリが変更されたら結果を更新
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 100);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  /**
   * 統合検索を実行
   */
  const performSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    let allResults: SearchResult[] = [];

    if (!trimmedQuery) {
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
    } else if (trimmedQuery.startsWith('>')) {
      const commandQuery = trimmedQuery.slice(1).trim();
      allResults = searchCommands(commandQuery);
    } else {
      const [tabs, bookmarks, history] = await Promise.all([
        getTabs(),
        getBookmarks(),
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

      const bookmarkResults: SearchResult[] = bookmarks
        .map((bm: any) => {
          const fuzzyScore = fuzzyMatchMultiple(trimmedQuery, [bm.title, bm.url || '']).score;
          return {
            id: bm.id,
            type: 'bookmark' as ResultType,
            title: bm.title,
            subtitle: bm.url,
            url: bm.url,
            score: fuzzyScore,
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

      const commandResults = searchCommands(trimmedQuery);

      allResults = [...tabResults, ...bookmarkResults, ...historyResults, ...commandResults].sort(
        (a, b) => b.score - a.score
      );
    }

    setResults(allResults.slice(0, 10));
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
        favicon: cmd.icon,
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
        if (result.url) {
          await browser.runtime.sendMessage({ type: 'NEW_TAB', url: result.url });
        }
        break;

      case 'command':
        await executeCommand(result);
        break;
    }

    closePalette();
  };

  const executeCommand = async (result: SearchResult) => {
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

      case 'CLEAR_CACHE':
        await browser.runtime.sendMessage({ type: 'CLEAR_CACHE' });
        break;
    }
  };

  const closePalette = () => {
    window.parent.postMessage({ type: 'CLOSE_PALETTE' }, '*');
  };

  const getTypeIcon = (type: ResultType): string => {
    switch (type) {
      case 'tab':
        return '🔲';
      case 'bookmark':
        return '⭐';
      case 'history':
        return '🕐';
      case 'command':
        return '⚡';
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
    }
  };

  return (
    <div>
      {/* 検索バー */}
      <div className="search-container">
        <div className="search-wrapper">
          <div className="search-icon">⚡</div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
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
            <div className="empty-icon">🔍</div>
            <p className="empty-title">No results found</p>
          </div>
        )}

        {results.length === 0 && !query && (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <p className="empty-title">Welcome to QuickBar</p>
            <p className="empty-subtitle">
              Start typing to search tabs, bookmarks, and history
            </p>
            <p className="empty-hint">
              Type <kbd>&gt;</kbd> for commands
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
              {result.favicon ? (
                result.type === 'command' ? (
                  <span style={{ fontSize: '20px' }}>{result.favicon}</span>
                ) : (
                  <img
                    src={result.favicon}
                    alt=""
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = getTypeIcon(result.type);
                        parent.style.fontSize = '20px';
                      }
                    }}
                  />
                )
              ) : (
                <span>{getTypeIcon(result.type)}</span>
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

      {/* フッター */}
      {results.length > 0 && (
        <div className="footer">
          <div className="footer-item">
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="footer-item">
            <kbd>↵</kbd>
            <span>Select</span>
          </div>
          <div className="footer-item">
            <kbd>ESC</kbd>
            <span>Close</span>
          </div>
          <div className="footer-count">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
