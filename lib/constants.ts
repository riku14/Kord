import type { CommandDefinition } from './types';

export const COMMANDS: CommandDefinition[] = [
  { id: 'cmd-new-tab', title: 'New Tab', subtitle: 'Open a new tab', action: 'NEW_TAB' },
  { id: 'cmd-close-tab', title: 'Close Tab', subtitle: 'Close the current tab', action: 'CLOSE_TAB' },
  { id: 'cmd-close-others', title: 'Close Other Tabs', subtitle: 'Close all other tabs', action: 'CLOSE_OTHER_TABS' },
  { id: 'cmd-duplicate', title: 'Duplicate Tab', subtitle: 'Duplicate the current tab', action: 'DUPLICATE_TAB' },
  { id: 'cmd-pin', title: 'Pin/Unpin Tab', subtitle: 'Toggle pin on the current tab', action: 'PIN_TAB' },
  { id: 'cmd-mute', title: 'Mute/Unmute Tab', subtitle: 'Toggle mute on the current tab', action: 'MUTE_TAB' },
  { id: 'cmd-go-back', title: 'Go Back', subtitle: 'Navigate to the previous page', action: 'GO_BACK', shortcut: 'Alt+Left' },
  { id: 'cmd-go-forward', title: 'Go Forward', subtitle: 'Navigate to the next page', action: 'GO_FORWARD', shortcut: 'Alt+Right' },
  { id: 'cmd-reload-tab', title: 'Reload Tab', subtitle: 'Reload the current tab', action: 'RELOAD_TAB', shortcut: 'Ctrl+R' },
  { id: 'cmd-recently-closed', title: 'Recently Closed Tabs', subtitle: 'Restore recently closed tabs', action: 'SHOW_RECENTLY_CLOSED' },
  { id: 'cmd-add-bookmark', title: 'Add Bookmark', subtitle: 'Bookmark the current tab', action: 'ADD_BOOKMARK' },
  { id: 'cmd-clear-cache', title: 'Clear Cache', subtitle: 'Clear browser cache', action: 'CLEAR_CACHE' },
  { id: 'cmd-downloads', title: 'Open Downloads', subtitle: 'Go to downloads page', action: 'NEW_TAB', url: 'chrome://downloads' },
  { id: 'cmd-extensions', title: 'Open Extensions', subtitle: 'Go to extensions page', action: 'NEW_TAB', url: 'chrome://extensions' },
  { id: 'cmd-settings', title: 'Open Settings', subtitle: 'Go to Chrome settings', action: 'NEW_TAB', url: 'chrome://settings' },
  { id: 'cmd-history-page', title: 'Open History Page', subtitle: 'Go to history page', action: 'NEW_TAB', url: 'chrome://history' },
  { id: 'cmd-bookmarks-page', title: 'Open Bookmark Manager', subtitle: 'Go to bookmark manager', action: 'NEW_TAB', url: 'chrome://bookmarks' },
];
