import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Kord',
    description: 'Lightning-fast command palette for Chrome. Search tabs, bookmarks, history instantly. Arc-inspired design with frecency ranking.',
    default_locale: 'en',
    homepage_url: 'https://github.com/riku14/Kord',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_icon: {
        16: 'icon/16.png',
        24: 'icon/32.png',
        32: 'icon/32.png',
      },
      default_title: 'Open Kord',
    },
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
