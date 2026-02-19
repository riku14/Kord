export type ResultType = 'tab' | 'bookmark' | 'history' | 'command' | 'search' | 'session' | 'bookmark-folder';

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
  icon?: string;
  // セッション用
  sessionId?: string;
  // ブックマークフォルダ用
  folderId?: string;
  depth?: number;
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
  | { type: 'GO_BACK'; tabId: number }
  | { type: 'GO_FORWARD'; tabId: number }
  | { type: 'RELOAD_TAB'; tabId: number; bypassCache?: boolean }
  | { type: 'GET_RECENTLY_CLOSED' }
  | { type: 'RESTORE_SESSION'; sessionId: string }
  | { type: 'ADD_BOOKMARK'; title: string; url: string; parentId?: string }
  | { type: 'GET_BOOKMARK_FOLDERS' }
  | { type: 'CREATE_BOOKMARK_FOLDER'; name: string; parentId: string }
  | { type: 'CLEAR_CACHE'; tabId: number }
  | { type: 'CLEAR_COOKIES'; tabId: number };
