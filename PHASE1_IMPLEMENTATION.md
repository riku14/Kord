# Phase 1 実装ガイド

Phase 1（Month 1-2）の目標達成に必要な実装タスクを段階的に整理。

**目標:** コマンドパレットのみで公開し、最初の 500 ユーザーと星5レビュー 10件を獲得する。

---

## 📋 実装前の現状確認

### ✅ 実装済み機能
- [x] コマンドパレット基本機能（Ctrl+K / Cmd+K）
- [x] タブ検索（fuzzy search + frecency ranking）
- [x] ブックマーク検索
- [x] 履歴検索
- [x] ブラウザコマンド（`>` プレフィックス）
- [x] ダークモード/ライトモード対応
- [x] Arc Browser風のUI

### ❌ Phase 1で必要だが未実装
- [ ] プロジェクト名変更（QuickBar → Kord）
- [ ] Chrome Web Store公開準備（ASO最適化）
- [ ] 多言語対応（5言語）
- [ ] レビュー促進機能
- [ ] ユーザー行動分析機能
- [ ] プライバシーポリシー＆利用規約
- [ ] マーケティング素材（スクリーンショット、デモ動画）

---

## 🎯 実装ステップ（優先順位順）

### Step 1: プロジェクト名変更（QuickBar → Kord）
**所要時間:** 2-3時間

#### タスク
1. **ブランディング決定**
   - [ ] ロゴデザイン（128x128, 48x48, 16x16）
   - [ ] カラースキーム確定（Arcっぽいパープル系）

2. **コード内の名称変更**
   ```bash
   # 一括置換
   - QuickBar → Kord
   - quickbar → kord
   ```
   - [ ] `wxt.config.ts` の `name` と `description`
   - [ ] `README.md` の全文
   - [ ] `package.json` の `name`, `description`
   - [ ] UI内のテキスト（popup, palette）

3. **アイコン更新**
   - [ ] `/public/icon/` 配下の画像を新デザインに置き換え
   - [ ] favicon.ico 更新

**確認方法:**
```bash
npm run dev
# Ctrl+K でパレットを開き、すべてのテキストが "Kord" になっているか確認
```

---

### Step 2: Chrome Web Store 公開準備
**所要時間:** 1日

#### 2-1. ストア説明文の作成（日本語・英語）

**ストア名（全言語共通）:**
```
Kord - Command Palette & Tab Manager for Chrome
```

**英語（Primary Language）:**

**Short Description（132文字以内）:**
```
Inspired by Arc Browser. Navigate Chrome instantly with Ctrl+K. Search tabs, bookmarks, and history in one place. The fastest command palette for Chrome.
```

**Detailed Description:**
```markdown
# Kord - Arc-style Command Palette for Chrome

Kord brings Arc Browser's beloved Ctrl+K command palette to Chrome. Navigate your tabs, bookmarks, and history with lightning speed.

## ⚡ Features

• **Instant Tab Switching** - Find any open tab in milliseconds with fuzzy search
• **Unified Search** - Search tabs, bookmarks, history, and commands in one place
• **Smart Ranking** - Results ranked by frequency and recency (frecency algorithm)
• **Browser Commands** - Execute actions with keyboard (close tabs, clear cache, etc.)
• **Beautiful UI** - Dark/light mode with Arc-inspired design
• **Zero Learning Curve** - Just press Ctrl+K (Cmd+K on Mac) and start typing

## 🎯 Perfect For

• Developers who miss Arc Browser's command palette
• Power users with 50+ tabs open
• Anyone who prefers keyboard over mouse
• Teams switching from Arc to Chrome

## ⌨️ Keyboard Shortcuts

• `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) - Open Kord
• `↑↓` - Navigate results
• `Enter` - Execute selected result
• `Esc` - Close palette

## 🔒 Privacy First

Kord works 100% locally. No data is sent to external servers. All your tabs, bookmarks, and history stay on your device.

## 🆓 Free Forever

Kord's core features will always be free. We're building the command palette Chrome deserves.

## 💬 Support

Found a bug or have a feature request? Visit our GitHub repository or leave a review!

Made with ❤️ by an Arc Browser fan who missed Ctrl+K too much.
```

**日本語:**

**Short Description:**
```
Arc Browserからインスピレーション。Ctrl+Kで瞬時にタブ、ブックマーク、履歴を検索。Chrome用の最速コマンドパレット。
```

**Detailed Description:**
```markdown
# Kord - Chrome用コマンドパレット

Arc Browserの人気機能「Ctrl+K」をChromeで再現。タブ、ブックマーク、履歴を爆速で検索できます。

## ⚡ 主な機能

• **瞬時のタブ切り替え** - 曖昧検索で数ミリ秒で目的のタブを発見
• **統合検索** - タブ、ブックマーク、履歴、コマンドを一箇所で検索
• **スマートランキング** - 使用頻度と最近度でソート（Frecencyアルゴリズム）
• **ブラウザコマンド** - キーボードだけでタブ操作、キャッシュクリアなど実行
• **美しいUI** - Arc風デザイン、ダーク/ライトモード対応
• **学習不要** - Ctrl+K（Mac: Cmd+K）を押して入力するだけ

## 🎯 こんな人におすすめ

• Arc Browserのコマンドパレットが恋しい開発者
• 常時50個以上のタブを開いているパワーユーザー
• マウスよりキーボード操作が好きな人
• ArcからChromeに移行したチーム

## ⌨️ キーボードショートカット

• `Ctrl+K`（Windows/Linux）または `Cmd+K`（Mac）- Kordを開く
• `↑↓` - 結果を移動
• `Enter` - 選択した項目を実行
• `Esc` - パレットを閉じる

## 🔒 プライバシー重視

Kordは100%ローカルで動作。外部サーバーにデータを送信しません。タブ、ブックマーク、履歴はすべてあなたのデバイス内に保存されます。

## 🆓 永久無料

Kordのコア機能は永久に無料です。Chromeにふさわしいコマンドパレットを作っています。

## 💬 サポート

バグ報告や機能要望はGitHubリポジトリへ、またはレビューをお願いします！

Arc BrowserのCtrl+Kが恋しすぎた開発者が ❤️ を込めて開発。
```

#### タスク
- [ ] 上記の説明文を `STORE_LISTINGS.md` に保存
- [ ] 他3言語（中国語、韓国語、ポルトガル語）をClaude/ChatGPTで翻訳
- [ ] Chrome Web Store Developer Dashboard でリスティング作成

---

#### 2-2. スクリーンショット作成（5枚）

**要件:**
- サイズ: 1280x800 または 640x400
- フォーマット: PNG or JPEG
- **1枚目が最重要**（検索結果に表示される）

**撮影シナリオ:**

1. **Screenshot 1: メイン使用シーン**
   - GitHub + Slack + Google Docs など実際のタブが10個以上開いている状態
   - Ctrl+K でコマンドパレットを開いた状態
   - 検索窓に「gith」と入力してGitHubタブがハイライトされている

2. **Screenshot 2: ブックマーク検索**
   - パレットでブックマークを検索している様子
   - アイコン付きでブックマークが並んでいる状態

3. **Screenshot 3: ブラウザコマンド**
   - `>` プレフィックスでコマンド一覧を表示
   - "Close Tab", "Clear Cache" などが見える

4. **Screenshot 4: ダークモード**
   - ダークテーマでパレットを開いている様子
   - 美しいUIを強調

5. **Screenshot 5: ライトモード**
   - ライトテーマでパレットを開いている様子

#### タスク
- [ ] 実際の作業環境でスクリーンショット撮影
- [ ] Figma/Photoshop で綺麗にトリミング
- [ ] `/marketing/screenshots/` に保存
- [ ] ストアにアップロード

---

#### 2-3. プロモーション用タイル画像

**Small Tile（440x280）:**
- Kord のロゴ + "Arc-style Command Palette for Chrome"

**Large Tile（920x680）:**
- スクリーンショット + キャッチコピー

#### タスク
- [ ] Canva または Figma でデザイン
- [ ] `/marketing/tiles/` に保存

---

### Step 3: 多言語対応（i18n）
**所要時間:** 1日

#### 3-1. WXT i18n セットアップ

```bash
npm install @wxt-dev/i18n
```

#### 3-2. 翻訳ファイル作成

**ディレクトリ構造:**
```
public/
└── _locales/
    ├── en/
    │   └── messages.json
    ├── ja/
    │   └── messages.json
    ├── zh/
    │   └── messages.json
    ├── ko/
    │   └── messages.json
    └── pt/
        └── messages.json
```

**`public/_locales/en/messages.json`:**
```json
{
  "extensionName": {
    "message": "Kord - Command Palette for Chrome"
  },
  "extensionDescription": {
    "message": "Arc-style command palette. Search tabs, bookmarks, history instantly."
  },
  "searchPlaceholder": {
    "message": "Search tabs, bookmarks, history..."
  },
  "noResults": {
    "message": "No results found"
  },
  "tabSection": {
    "message": "Tabs"
  },
  "bookmarkSection": {
    "message": "Bookmarks"
  },
  "historySection": {
    "message": "History"
  },
  "commandSection": {
    "message": "Commands"
  }
}
```

#### 3-3. コード内で使用

```typescript
// palette/App.tsx
import { useTranslation } from '@wxt-dev/i18n';

function App() {
  const { t } = useTranslation();

  return (
    <input
      placeholder={t('searchPlaceholder')}
    />
  );
}
```

#### タスク
- [ ] i18n ライブラリセットアップ
- [ ] 英語の messages.json 作成
- [ ] Claude で他4言語に翻訳
- [ ] UI内のハードコードされたテキストを `t()` に置き換え
- [ ] 各言語で動作確認

---

### Step 4: レビュー促進機能
**所要時間:** 3-4時間

#### 4-1. インストール日時の記録

```typescript
// background.ts
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      installedAt: Date.now(),
      reviewPromptShown: false,
    });
  }
});
```

#### 4-2. 使用3日後にレビュー促進バナーを表示

```typescript
// lib/reviewPrompt.ts
export async function shouldShowReviewPrompt(): Promise<boolean> {
  const { installedAt, reviewPromptShown } = await chrome.storage.local.get([
    'installedAt',
    'reviewPromptShown',
  ]);

  if (reviewPromptShown) return false;

  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - installedAt;

  return elapsed >= threeDays;
}

export async function markReviewPromptShown() {
  await chrome.storage.local.set({ reviewPromptShown: true });
}
```

#### 4-3. Popup にバナー追加

```tsx
// popup/App.tsx
function App() {
  const [showReviewBanner, setShowReviewBanner] = useState(false);

  useEffect(() => {
    shouldShowReviewPrompt().then(setShowReviewBanner);
  }, []);

  const handleReviewClick = () => {
    chrome.tabs.create({
      url: 'https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID/reviews',
    });
    markReviewPromptShown();
    setShowReviewBanner(false);
  };

  const handleDismiss = () => {
    markReviewPromptShown();
    setShowReviewBanner(false);
  };

  return (
    <div>
      {showReviewBanner && (
        <div className="review-banner">
          <p>Enjoying Kord? 🎉</p>
          <p>Please consider leaving a review on the Chrome Web Store!</p>
          <button onClick={handleReviewClick}>Leave a Review</button>
          <button onClick={handleDismiss}>Maybe Later</button>
        </div>
      )}
      {/* 既存のコンテンツ */}
    </div>
  );
}
```

#### タスク
- [ ] インストール日時記録機能実装
- [ ] レビュープロンプトロジック実装
- [ ] Popup にバナーUI追加
- [ ] CSS スタイリング（控えめなデザイン）
- [ ] 動作確認（chrome.storage の日付を手動で変更してテスト）

---

### Step 5: ユーザー行動分析機能
**所要時間:** 4-5時間

#### 5-1. イベント記録

```typescript
// lib/analytics.ts
export type AnalyticsEvent =
  | 'palette_opened'
  | 'tab_switched'
  | 'bookmark_opened'
  | 'history_opened'
  | 'command_executed';

export async function trackEvent(event: AnalyticsEvent) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const data = await chrome.storage.local.get(['analytics']);
  const analytics = data.analytics || {};

  if (!analytics[today]) {
    analytics[today] = {};
  }

  analytics[today][event] = (analytics[today][event] || 0) + 1;

  await chrome.storage.local.set({ analytics });
}

export async function getAnalytics() {
  const { analytics } = await chrome.storage.local.get(['analytics']);
  return analytics || {};
}
```

#### 5-2. イベントトラッキングの追加

```typescript
// palette/App.tsx
const handleOpen = () => {
  trackEvent('palette_opened');
  // ...
};

const handleSelectTab = () => {
  trackEvent('tab_switched');
  // タブ切り替え処理
};
```

#### 5-3. Popup に統計表示

```tsx
// popup/App.tsx
function AnalyticsView() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getAnalytics().then((data) => {
      // 過去7日分を集計
      const last7Days = Object.keys(data)
        .sort()
        .slice(-7);

      const total = last7Days.reduce((acc, day) => {
        const dayData = data[day];
        acc.paletteOpened += dayData.palette_opened || 0;
        acc.tabSwitched += dayData.tab_switched || 0;
        return acc;
      }, { paletteOpened: 0, tabSwitched: 0 });

      setStats(total);
    });
  }, []);

  if (!stats) return null;

  return (
    <div className="analytics">
      <h3>Your Stats (Last 7 Days)</h3>
      <p>Palette opened: {stats.paletteOpened} times</p>
      <p>Tabs switched: {stats.tabSwitched} times</p>
    </div>
  );
}
```

#### タスク
- [ ] analytics.ts 実装
- [ ] 各アクションにイベントトラッキング追加
- [ ] Popup に統計表示UI追加
- [ ] プライバシー配慮（全てローカル保存、サーバー送信なし）
- [ ] 動作確認

---

### Step 6: プライバシーポリシー & 利用規約
**所要時間:** 2-3時間

#### 6-1. プライバシーポリシー作成

**`PRIVACY_POLICY.md`:**
```markdown
# Privacy Policy for Kord

Last updated: [Date]

## Data Collection

Kord does NOT collect, store, or transmit any personal data to external servers.

## Local Data Storage

Kord stores the following data locally on your device using Chrome's storage API:
- Installation date (for review prompts)
- Usage statistics (palette open count, command usage)
- User preferences (theme, shortcuts)

This data never leaves your device.

## Permissions

Kord requests the following permissions:
- `tabs`: To search and switch between open tabs
- `bookmarks`: To search bookmarks
- `history`: To search browsing history
- `storage`: To save preferences locally
- `browsingData`: To execute "Clear Cache" command
- `activeTab`: To interact with the current tab
- `sessions`: To restore recently closed tabs

## Third-Party Services

Kord does not use any third-party analytics or tracking services.

## Changes

We may update this policy. Changes will be posted on this page.

## Contact

For questions, contact: [your-email@example.com]
```

#### 6-2. ストアリスティングに追加

Chrome Web Store Developer Dashboard で：
- Privacy practices セクションに上記内容を記載
- "Does not collect user data" を選択

#### タスク
- [ ] PRIVACY_POLICY.md 作成
- [ ] 自分のメールアドレス記載
- [ ] GitHub Pages または個人サイトにホスティング
- [ ] ストアダッシュボードにURLを登録

---

### Step 7: ビルド & テスト
**所要時間:** 半日

#### 7-1. プロダクションビルド

```bash
npm run build
```

#### 7-2. テストチェックリスト

**基本機能:**
- [ ] Ctrl+K / Cmd+K でパレットが開く
- [ ] Esc でパレットが閉じる
- [ ] タブ検索が動作する
- [ ] ブックマーク検索が動作する
- [ ] 履歴検索が動作する
- [ ] ブラウザコマンド（`>` プレフィックス）が動作する
- [ ] 矢印キーでナビゲーションできる
- [ ] Enter で選択した項目が実行される

**Phase 1 新機能:**
- [ ] 多言語対応が正しく動作する（日本語・英語切り替え）
- [ ] レビュープロンプトが3日後に表示される
- [ ] レビュープロンプトは1回のみ表示される
- [ ] ユーザー統計が Popup に表示される
- [ ] ダークモード/ライトモードが正しく切り替わる

**パフォーマンス:**
- [ ] パレットを開くのに1秒以内
- [ ] 100個以上のタブで動作が重くならない
- [ ] メモリリークがない

**ブラウザ互換性:**
- [ ] Chrome 最新版で動作
- [ ] Windows で動作
- [ ] Mac で動作
- [ ] Linux で動作

---

### Step 8: Chrome Web Store 申請
**所要時間:** 1-2時間（審査は1-3日）

#### 8-1. 申請前チェックリスト

- [ ] プロダクションビルドが正常に動作
- [ ] すべてのスクリーンショットをアップロード
- [ ] プロモーション用タイル画像をアップロード
- [ ] 5言語のストアリスティング作成
- [ ] プライバシーポリシーURLを登録
- [ ] 価格設定: Free
- [ ] カテゴリ: Productivity
- [ ] 適切なタグ追加: "tab manager", "command palette", "productivity"

#### 8-2. ZIP ファイル作成

```bash
cd .output/chrome-mv3
zip -r kord-v1.0.0.zip *
```

#### 8-3. アップロード

1. Chrome Web Store Developer Dashboard にログイン
2. "New Item" をクリック
3. ZIP ファイルをアップロード
4. すべてのフィールドを埋める
5. "Submit for Review" をクリック

#### 8-4. 審査待ち中にやること

- [ ] ランディングページ作成開始（kord.dev）
- [ ] Reddit / X 投稿の下書き作成
- [ ] Zenn 技術記事の執筆開始
- [ ] GitHub リポジトリを public に変更

---

## 📅 タイムライン

| Week | タスク | 所要時間 |
|------|--------|----------|
| Week 1 | Step 1-3（名称変更、ストア準備、多言語） | 3日 |
| Week 2 | Step 4-5（レビュー機能、分析機能） | 2日 |
| Week 2-3 | Step 6-7（プライバシー、テスト） | 2日 |
| Week 3 | Step 8（ストア申請） | 1日 |
| Week 4 | 審査承認後、マーケティング開始 | - |

**合計:** 約2-3週間で Phase 1 完了

---

## 🎯 成功の定義

Phase 1 が成功したと言える条件：

- [x] Chrome Web Store で公開済み
- [ ] 500+ インストール
- [ ] 200+ WAU（週間アクティブユーザー）
- [ ] 10+ レビュー（平均4.5星以上）
- [ ] アンインストール率 40% 以下
- [ ] Reddit / Hacker News / Zenn で少なくとも1つのバズ

---

## 次のステップ

Phase 1 完了後、すぐに Phase 2 の準備を開始：
- Phase 1 で得たユーザーフィードバックを分析
- サイドバー機能の設計開始
- ExtensionPay の調査開始

**Phase 2 の詳細は `GROWTH_ROADMAP.md` を参照。**
