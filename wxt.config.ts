import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Kord - Command Palette & Tab Manager for Chrome',
    description: 'Lightning-fast command palette for Chrome. Search tabs, bookmarks, history instantly with Arc Browser-inspired design and frecency ranking.',
    default_locale: 'en',
    homepage_url: 'https://github.com/riku14/Kord',
    permissions: [
      'tabs',
      'bookmarks',
      'history',
      'browsingData',
      'storage',
      'activeTab',
      'sessions',
    ],
    commands: {
      'open-palette': {
        suggested_key: {
          default: 'Ctrl+K',
          mac: 'Command+K',
        },
        description: 'Open Kord command palette',
      },
    },
    web_accessible_resources: [
      {
        resources: ['palette.html', 'chunks/*.js', 'assets/*.css'],
        matches: ['<all_urls>'],
      },
    ],
    // content_scripts削除（WXTが自動生成）
  },
});
