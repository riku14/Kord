import type { CommandDefinition } from './types';

export const COMMANDS: CommandDefinition[] = [
  { id: 'cmd-new-tab', title: 'New Tab', subtitle: 'Open a new tab', action: 'NEW_TAB', icon: '➕' },
  { id: 'cmd-close-tab', title: 'Close Tab', subtitle: 'Close the current tab', action: 'CLOSE_TAB', icon: '✕' },
  { id: 'cmd-close-others', title: 'Close Other Tabs', subtitle: 'Close all other tabs', action: 'CLOSE_OTHER_TABS', icon: '🗑' },
  { id: 'cmd-duplicate', title: 'Duplicate Tab', subtitle: 'Duplicate the current tab', action: 'DUPLICATE_TAB', icon: '📋' },
  { id: 'cmd-pin', title: 'Pin/Unpin Tab', subtitle: 'Toggle pin on the current tab', action: 'PIN_TAB', icon: '📌' },
  { id: 'cmd-mute', title: 'Mute/Unmute Tab', subtitle: 'Toggle mute on the current tab', action: 'MUTE_TAB', icon: '🔇' },
  { id: 'cmd-clear-cache', title: 'Clear Cache', subtitle: 'Clear browser cache', action: 'CLEAR_CACHE', icon: '🧹' },
  { id: 'cmd-downloads', title: 'Open Downloads', subtitle: 'Go to downloads page', action: 'NEW_TAB', url: 'chrome://downloads', icon: '📥' },
  { id: 'cmd-extensions', title: 'Open Extensions', subtitle: 'Go to extensions page', action: 'NEW_TAB', url: 'chrome://extensions', icon: '🧩' },
  { id: 'cmd-settings', title: 'Open Settings', subtitle: 'Go to Chrome settings', action: 'NEW_TAB', url: 'chrome://settings', icon: '⚙️' },
  { id: 'cmd-history-page', title: 'Open History Page', subtitle: 'Go to history page', action: 'NEW_TAB', url: 'chrome://history', icon: '📜' },
  { id: 'cmd-bookmarks-page', title: 'Open Bookmark Manager', subtitle: 'Go to bookmark manager', action: 'NEW_TAB', url: 'chrome://bookmarks', icon: '⭐' },
];
