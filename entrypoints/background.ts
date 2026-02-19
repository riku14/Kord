import type { MessageAction } from '../lib/types';
import { isSafeUrl } from '../lib/security';
import { runMigrations } from '../lib/migration';

export default defineBackground(() => {
  console.log('Kord background service worker started');

  // データ移行を実行（初回のみ）
  runMigrations();

  // Ctrl+K / Cmd+K コマンドのリスナー
  browser.commands.onCommand.addListener(async (command) => {
    if (command === 'open-palette') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          await browser.tabs.sendMessage(tab.id, { type: 'TOGGLE_PALETTE' });
        } catch (error) {
          console.error('Failed to send message to content script:', error);
        }
      }
    }
  });

  // Content Scriptからのメッセージリスナー
  browser.runtime.onMessage.addListener((message: MessageAction, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error handling message:', error);
        sendResponse({ error: error.message });
      });
    return true; // 非同期レスポンスを許可
  });
});

/**
 * メッセージハンドラー
 */
async function handleMessage(message: MessageAction, sender: browser.Runtime.MessageSender) {
  switch (message.type) {
    case 'GET_TABS':
      return await getTabs();

    case 'GET_BOOKMARKS':
      return await getBookmarks();

    case 'GET_HISTORY':
      return await getHistory(message.query);

    case 'SWITCH_TAB':
      return await switchTab(message.tabId, message.windowId);

    case 'CLOSE_TAB':
      return await closeTab(message.tabId);

    case 'CLOSE_OTHER_TABS':
      return await closeOtherTabs(message.tabId);

    case 'DUPLICATE_TAB':
      return await duplicateTab(message.tabId);

    case 'PIN_TAB':
      return await pinTab(message.tabId, message.pinned);

    case 'MUTE_TAB':
      return await muteTab(message.tabId, message.muted);

    case 'NEW_TAB':
      return await newTab(message.url);

    case 'GO_BACK':
      return await goBack(message.tabId);

    case 'GO_FORWARD':
      return await goForward(message.tabId);

    case 'RELOAD_TAB':
      return await reloadTab(message.tabId, message.bypassCache);

    case 'GET_RECENTLY_CLOSED':
      return await getRecentlyClosed();

    case 'RESTORE_SESSION':
      return await restoreSession(message.sessionId);

    case 'ADD_BOOKMARK':
      return await addBookmark(message.title, message.url, message.parentId);

    case 'GET_BOOKMARK_FOLDERS':
      return await getBookmarkFolders();

    case 'CREATE_BOOKMARK_FOLDER':
      return await createBookmarkFolder(message.name, message.parentId);

    case 'CLEAR_CACHE':
      return await clearCacheAndRefresh(message.tabId);

    case 'CLEAR_COOKIES':
      return await clearCookiesAndRefresh(message.tabId);

    default:
      throw new Error(`Unknown message type: ${(message as any).type}`);
  }
}

/**
 * 全タブを取得
 */
async function getTabs() {
  const tabs = await browser.tabs.query({});
  return tabs.map((tab) => ({
    id: `tab-${tab.id}`,
    tabId: tab.id,
    windowId: tab.windowId,
    title: tab.title || 'Untitled',
    url: tab.url,
    // faviconのURL検証を追加
    favicon: isSafeUrl(tab.favIconUrl) ? tab.favIconUrl : undefined,
    pinned: tab.pinned,
    active: tab.active,
  }));
}

/**
 * ブックマークを取得（フラット化）
 */
async function getBookmarks() {
  const tree = await browser.bookmarks.getTree();
  const bookmarks: any[] = [];

  function flatten(nodes: browser.bookmarks.BookmarkTreeNode[]) {
    for (const node of nodes) {
      if (node.url) {
        bookmarks.push({
          id: `bookmark-${node.id}`,
          title: node.title,
          url: node.url,
        });
      }
      if (node.children) {
        flatten(node.children);
      }
    }
  }

  flatten(tree);
  return bookmarks;
}

/**
 * 履歴を検索
 */
async function getHistory(query: string) {
  const results = await browser.history.search({
    text: query || '',
    maxResults: 50,
    startTime: 0,
  });

  return results.map((item) => ({
    id: `history-${item.id}`,
    title: item.title || 'Untitled',
    url: item.url,
    lastVisitTime: item.lastVisitTime,
  }));
}

/**
 * 指定タブのコマンドパレットを閉じる
 */
async function closePaletteInTab(tabId: number) {
  try {
    await browser.tabs.sendMessage(tabId, { type: 'CLOSE_PALETTE' });
  } catch {
    // コンテンツスクリプトが読み込まれていない場合などは無視
  }
}

/**
 * タブに切り替え
 */
async function switchTab(tabId: number, windowId: number) {
  const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
  const previousTabId = currentTab?.id;

  await browser.windows.update(windowId, { focused: true });
  await browser.tabs.update(tabId, { active: true });

  if (previousTabId && previousTabId !== tabId) {
    await closePaletteInTab(previousTabId);
  }
  return { success: true };
}

/**
 * タブを閉じる
 */
async function closeTab(tabId: number) {
  await browser.tabs.remove(tabId);
  return { success: true };
}

/**
 * 他のタブを全て閉じる
 */
async function closeOtherTabs(keepTabId: number) {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const tabsToClose = tabs.filter((tab) => tab.id !== keepTabId && !tab.pinned).map((tab) => tab.id!);
  if (tabsToClose.length > 0) {
    await browser.tabs.remove(tabsToClose);
  }
  return { success: true };
}

/**
 * タブを複製
 */
async function duplicateTab(tabId: number) {
  await browser.tabs.duplicate(tabId);

  await closePaletteInTab(tabId);
  return { success: true };
}

/**
 * タブをピン留め/解除
 */
async function pinTab(tabId: number, pinned: boolean) {
  await browser.tabs.update(tabId, { pinned });
  return { success: true };
}

/**
 * タブをミュート/ミュート解除
 */
async function muteTab(tabId: number, muted: boolean) {
  await browser.tabs.update(tabId, { muted });
  return { success: true };
}

/**
 * 新しいタブを開く
 */
async function newTab(url?: string) {
  const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
  const previousTabId = currentTab?.id;

  await browser.tabs.create({ url });

  if (previousTabId) {
    await closePaletteInTab(previousTabId);
  }
  return { success: true };
}

/**
 * キャッシュをクリアしてリロード
 */
async function clearCacheAndRefresh(tabId: number) {
  await browser.browsingData.removeCache({});
  await browser.tabs.reload(tabId, { bypassCache: true });
  return { success: true };
}

/**
 * クッキーをクリアしてリロード
 */
async function clearCookiesAndRefresh(tabId: number) {
  await browser.browsingData.removeCookies({});
  await browser.tabs.reload(tabId, { bypassCache: false });
  return { success: true };
}

/**
 * タブの前のページに戻る
 */
async function goBack(tabId: number) {
  try {
    await browser.tabs.goBack(tabId);
    return { success: true };
  } catch (error) {
    // 履歴がない場合はエラーを無視
    return { success: false, error: 'No history available' };
  }
}

/**
 * タブの次のページに進む
 */
async function goForward(tabId: number) {
  try {
    await browser.tabs.goForward(tabId);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'No forward history available' };
  }
}

/**
 * タブをリロード
 */
async function reloadTab(tabId: number, bypassCache?: boolean) {
  await browser.tabs.reload(tabId, { bypassCache: bypassCache || false });
  return { success: true };
}

/**
 * 最近閉じたタブ/ウィンドウを取得
 */
async function getRecentlyClosed() {
  const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 25 });
  return sessions.map((s) => ({
    sessionId: s.tab?.sessionId || s.window?.sessionId,
    tab: s.tab ? {
      title: s.tab.title,
      url: s.tab.url,
      favicon: s.tab.favIconUrl,
    } : null,
    window: s.window ? {
      tabs: s.window.tabs?.map((t) => ({ title: t.title, url: t.url })),
    } : null,
  }));
}

/**
 * セッションを復元
 */
async function restoreSession(sessionId: string) {
  const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
  const previousTabId = currentTab?.id;

  await browser.sessions.restore(sessionId);

  if (previousTabId) {
    await closePaletteInTab(previousTabId);
  }
  return { success: true };
}

/**
 * ブックマークを追加
 */
async function addBookmark(title: string, url: string, parentId?: string) {
  await browser.bookmarks.create({ title, url, ...(parentId ? { parentId } : {}) });
  return { success: true };
}

/**
 * ブックマークフォルダ一覧を取得（フラット化、深さ付き）
 */
async function getBookmarkFolders() {
  const tree = await browser.bookmarks.getTree();
  const folders: { id: string; title: string; depth: number }[] = [];

  function traverse(nodes: browser.bookmarks.BookmarkTreeNode[], depth: number) {
    for (const node of nodes) {
      // ルートノード（id="0"）と URL を持つノード（ブックマーク）を除外
      if (node.id !== '0' && !node.url && node.title) {
        folders.push({ id: node.id, title: node.title, depth });
      }
      if (node.children) {
        // ルートの直下（depth=0）の子をdepth=0として扱う
        traverse(node.children, node.id === '0' ? 0 : depth + 1);
      }
    }
  }

  traverse(tree, 0);
  return folders;
}

/**
 * ブックマークフォルダを作成
 */
async function createBookmarkFolder(name: string, parentId: string) {
  const folder = await browser.bookmarks.create({ title: name, parentId });
  return { success: true, folderId: folder.id };
}
