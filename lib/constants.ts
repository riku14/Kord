import type { CommandDefinition } from './types';

export function getCommands(): CommandDefinition[] {
  return [
    { id: 'cmd-new-tab', title: 'New Tab', subtitle: 'Open a new tab', action: 'NEW_TAB', icon: 'Plus' },
    { id: 'cmd-close-tab', title: 'Close Tab', subtitle: 'Close the current tab', action: 'CLOSE_TAB', icon: 'X' },
    { id: 'cmd-close-others', title: 'Close Other Tabs', subtitle: 'Close all other tabs (except pinned)', action: 'CLOSE_OTHER_TABS', icon: 'XCircle' },
    { id: 'cmd-duplicate', title: 'Duplicate Tab', subtitle: 'Duplicate the current tab', action: 'DUPLICATE_TAB', icon: 'Copy' },
    { id: 'cmd-pin', title: 'Pin/Unpin Tab', subtitle: 'Toggle pin on the current tab', action: 'PIN_TAB', icon: 'Pin' },
    { id: 'cmd-mute', title: 'Mute/Unmute Tab', subtitle: 'Toggle mute on the current tab', action: 'MUTE_TAB', icon: 'Volume2' },
    { id: 'cmd-go-back', title: 'Go Back', subtitle: 'Navigate to the previous page', action: 'GO_BACK', shortcut: 'Alt+Left', icon: 'ArrowLeft' },
    { id: 'cmd-go-forward', title: 'Go Forward', subtitle: 'Navigate to the next page', action: 'GO_FORWARD', shortcut: 'Alt+Right', icon: 'ArrowRight' },
    { id: 'cmd-reload-tab', title: 'Reload Tab', subtitle: 'Reload the current tab', action: 'RELOAD_TAB', shortcut: 'Ctrl+R', icon: 'RefreshCw' },
    { id: 'cmd-recently-closed', title: 'Recently Closed Tabs', subtitle: 'Restore recently closed tabs', action: 'SHOW_RECENTLY_CLOSED', icon: 'RotateCcw' },
    { id: 'cmd-add-bookmark', title: 'Add Bookmark', subtitle: 'Bookmark the current tab', action: 'ADD_BOOKMARK', icon: 'Bookmark' },
    { id: 'cmd-clear-cache', title: 'Clear Cache and Refresh', subtitle: 'Clear browser cache and reload the page', action: 'CLEAR_CACHE', icon: 'Trash2' },
    { id: 'cmd-clear-cookies', title: 'Clear Cookies and Refresh', subtitle: 'Clear browser cookies and reload the page', action: 'CLEAR_COOKIES', icon: 'Trash2' },
    { id: 'cmd-downloads', title: 'Open Downloads', subtitle: 'Go to downloads page', action: 'NEW_TAB', url: 'chrome://downloads', icon: 'Download' },
    { id: 'cmd-extensions', title: 'Open Extensions', subtitle: 'Go to extensions page', action: 'NEW_TAB', url: 'chrome://extensions', icon: 'Puzzle' },
    { id: 'cmd-settings', title: 'Open Settings', subtitle: 'Go to Chrome settings', action: 'NEW_TAB', url: 'chrome://settings', icon: 'Settings' },
    { id: 'cmd-history-page', title: 'Open History Page', subtitle: 'Go to history page', action: 'NEW_TAB', url: 'chrome://history', icon: 'History' },
    { id: 'cmd-bookmarks-page', title: 'Open Bookmark Manager', subtitle: 'Go to bookmark manager', action: 'NEW_TAB', url: 'chrome://bookmarks', icon: 'BookMarked' },
  ];
}
