export type ResultType = 'tab' | 'bookmark' | 'history' | 'command';

export interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  url?: string;
  favicon?: string;
  score: number;
  // タブ用
  tabId?: number;
  windowId?: number;
  // コマンド用
  action?: string;
  shortcut?: string;
}

export interface CommandDefinition {
  id: string;
  title: string;
  subtitle: string;
  action: string;
  url?: string;
  shortcut?: string;
  icon?: string;
}

export type MessageAction =
  | { type: 'TOGGLE_PALETTE' }
  | { type: 'GET_TABS' }
  | { type: 'GET_BOOKMARKS' }
  | { type: 'GET_HISTORY'; query: string }
  | { type: 'SWITCH_TAB'; tabId: number; windowId: number }
  | { type: 'CLOSE_TAB'; tabId: number }
  | { type: 'CLOSE_OTHER_TABS'; tabId: number }
  | { type: 'DUPLICATE_TAB'; tabId: number }
  | { type: 'PIN_TAB'; tabId: number; pinned: boolean }
  | { type: 'MUTE_TAB'; tabId: number; muted: boolean }
  | { type: 'NEW_TAB'; url?: string }
  | { type: 'CLEAR_CACHE' };
