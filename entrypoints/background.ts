import type { MessageAction } from '../lib/types';

export default defineBackground(() => {
  console.log('QuickBar background service worker started');

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
      return await addBookmark(message.title, message.url);

    case 'CLEAR_CACHE':
      return await clearCache();

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
    favicon: tab.favIconUrl,
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
 * タブに切り替え
 */
async function switchTab(tabId: number, windowId: number) {
  await browser.windows.update(windowId, { focused: true });
  await browser.tabs.update(tabId, { active: true });
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
  await browser.tabs.create({ url });
  return { success: true };
}

/**
 * キャッシュをクリア
 */
async function clearCache() {
  await browser.browsingData.removeCache({});
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
  await browser.sessions.restore(sessionId);
  return { success: true };
}

/**
 * ブックマークを追加
 */
async function addBookmark(title: string, url: string) {
  await browser.bookmarks.create({ title, url });
  return { success: true };
}
