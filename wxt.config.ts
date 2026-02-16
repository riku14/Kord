import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'QuickBar - Command Palette for Chrome',
    description: 'A powerful command palette for Chrome. Search tabs, bookmarks, history, and execute browser commands instantly. Inspired by Arc Browser.',
    permissions: [
      'tabs',
      'bookmarks',
      'history',
      'browsingData',
      'storage',
      'activeTab',
      'scripting',
      'sessions',
    ],
    commands: {
      'open-palette': {
        suggested_key: {
          default: 'Ctrl+K',
          mac: 'Command+K',
        },
        description: 'Open QuickBar command palette',
      },
    },
    web_accessible_resources: [
      {
        resources: ['palette.html', 'chunks/*.js', 'assets/*.css'],
        matches: ['<all_urls>'],
      },
    ],
    content_scripts: [
      {
        matches: ['<all_urls>'],
        js: ['content-scripts/content.js'],
      },
    ],
  },
});
