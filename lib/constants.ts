import type { CommandDefinition } from './types';
import { t } from './i18n';

export const COMMANDS: CommandDefinition[] = [
  { id: 'cmd-new-tab', title: t('cmdNewTab'), subtitle: t('cmdNewTabDesc'), action: 'NEW_TAB', icon: 'Plus' },
  { id: 'cmd-close-tab', title: t('cmdCloseTab'), subtitle: t('cmdCloseTabDesc'), action: 'CLOSE_TAB', icon: 'X' },
  { id: 'cmd-close-others', title: t('cmdCloseOtherTabs'), subtitle: t('cmdCloseOtherTabsDesc'), action: 'CLOSE_OTHER_TABS', icon: 'XCircle' },
  { id: 'cmd-duplicate', title: t('cmdDuplicateTab'), subtitle: t('cmdDuplicateTabDesc'), action: 'DUPLICATE_TAB', icon: 'Copy' },
  { id: 'cmd-pin', title: t('cmdPinTab'), subtitle: t('cmdPinTabDesc'), action: 'PIN_TAB', icon: 'Pin' },
  { id: 'cmd-mute', title: t('cmdMuteTab'), subtitle: t('cmdMuteTabDesc'), action: 'MUTE_TAB', icon: 'Volume2' },
  { id: 'cmd-go-back', title: t('cmdGoBack'), subtitle: t('cmdGoBackDesc'), action: 'GO_BACK', shortcut: 'Alt+Left', icon: 'ArrowLeft' },
  { id: 'cmd-go-forward', title: t('cmdGoForward'), subtitle: t('cmdGoForwardDesc'), action: 'GO_FORWARD', shortcut: 'Alt+Right', icon: 'ArrowRight' },
  { id: 'cmd-reload-tab', title: t('cmdReloadTab'), subtitle: t('cmdReloadTabDesc'), action: 'RELOAD_TAB', shortcut: 'Ctrl+R', icon: 'RefreshCw' },
  { id: 'cmd-recently-closed', title: t('cmdRecentlyClosed'), subtitle: t('cmdRecentlyClosedDesc'), action: 'SHOW_RECENTLY_CLOSED', icon: 'RotateCcw' },
  { id: 'cmd-add-bookmark', title: t('cmdAddBookmark'), subtitle: t('cmdAddBookmarkDesc'), action: 'ADD_BOOKMARK', icon: 'Bookmark' },
  { id: 'cmd-clear-cache', title: t('cmdClearCache'), subtitle: t('cmdClearCacheDesc'), action: 'CLEAR_CACHE', icon: 'Trash2' },
  { id: 'cmd-downloads', title: t('cmdOpenDownloads'), subtitle: t('cmdOpenDownloadsDesc'), action: 'NEW_TAB', url: 'chrome://downloads', icon: 'Download' },
  { id: 'cmd-extensions', title: t('cmdOpenExtensions'), subtitle: t('cmdOpenExtensionsDesc'), action: 'NEW_TAB', url: 'chrome://extensions', icon: 'Puzzle' },
  { id: 'cmd-settings', title: t('cmdOpenSettings'), subtitle: t('cmdOpenSettingsDesc'), action: 'NEW_TAB', url: 'chrome://settings', icon: 'Settings' },
  { id: 'cmd-history-page', title: t('cmdOpenHistory'), subtitle: t('cmdOpenHistoryDesc'), action: 'NEW_TAB', url: 'chrome://history', icon: 'History' },
  { id: 'cmd-bookmarks-page', title: t('cmdOpenBookmarkManager'), subtitle: t('cmdOpenBookmarkManagerDesc'), action: 'NEW_TAB', url: 'chrome://bookmarks', icon: 'BookMarked' },
];
