# Phase 2 実装計画：AI 機能追加 & Pro 版開始

**期間**: Month 3-5（Phase 1完了後）
**目標**: AI 機能を追加し、サブスク $5/月 で Pro 版開始。2,000 ユーザー突破、MRR $100+

---

## 📋 実装前の現状確認

### ✅ Phase 1 完了項目（引き継ぎ）
- [x] コマンドパレット基本機能（タブ/ブックマーク/履歴検索）
- [x] 17個のブラウザコマンド
- [x] 多言語対応（5言語）
- [x] ユーザー行動分析機能
- [x] レビュー促進機能
- [x] プライバシーポリシー

### ❌ Phase 2 で追加する機能
- [ ] AI ページ要約
- [ ] AI 翻訳
- [ ] AI コード解説
- [ ] AI 自由質問
- [ ] Pro / Free の分離ロジック
- [ ] サブスク課金システム（ExtensionPay）
- [ ] 3日間無料お試し
- [ ] BYOK（Bring Your Own Key）オプション

---

## 🏗️ アーキテクチャ設計

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                       Chrome Extension                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Content Script          Background Script                   │
│  ┌───────────────┐      ┌─────────────────────┐            │
│  │ ページ本文抽出 │ ───► │ Pro ステータスチェック │            │
│  │ 選択テキスト  │      │ レート制限           │            │
│  └───────────────┘      └─────────────────────┘            │
│                                │                              │
│                                ▼                              │
│                        BYOK 判定                              │
│                         │    │                                │
│                  Yes ───┘    └─── No                         │
│                  │                 │                          │
│                  ▼                 ▼                          │
│          直接 API 呼び出し   Cloud Functions                  │
│          (ユーザーのキー)      (Kord のキー)                   │
└─────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Claude API (Haiku) │
                          │  or Sonnet (重い処理) │
                          └─────────────────────┘
```

### データフロー

#### 1. AI ページ要約の場合
```
1. ユーザーが Ctrl+K → "summarize" と入力
2. Content Script でページの本文を抽出（Readability.js 使用）
3. Background Script に送信
4. Pro ステータスチェック：
   - Free ユーザー: 今日の AI 使用回数チェック（3回まで）
   - Pro ユーザー: 無制限
5. BYOK チェック：
   - BYOK ユーザー: 直接 Claude API 呼び出し
   - 通常ユーザー: Cloud Functions 経由
6. AI レスポンスをコマンドパレットに表示
```

#### 2. AI 翻訳の場合
```
1. ユーザーが Ctrl+K → "translate <text>" と入力
2. テキストを Background Script に送信
3. Pro ステータスチェック
4. BYOK or Cloud Functions 経由で Claude API 呼び出し
5. 翻訳結果をコマンドパレットに表示 + クリップボードにコピー
```

---

## 🎯 実装ステップ（5週間）

### Week 1: Cloud Functions セットアップ & ページ本文抽出

#### タスク 1-1: Firebase Functions セットアップ

**選択肢**:
- Firebase Functions（Node.js）
- Vercel Serverless Functions（Next.js API Routes）
- Cloudflare Workers（Edge）

**推奨**: Vercel Serverless Functions
- 理由: デプロイが最も簡単、無料枠が十分（月 100GB、100万リクエスト）

**手順**:
```bash
# Vercel プロジェクト作成
npx create-next-app@latest kord-api
cd kord-api

# API ルート作成
# pages/api/ai-summarize.ts
```

**`pages/api/ai-summarize.ts`**:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export default async function handler(req, res) {
  // CORS設定（Chrome拡張からのリクエストを許可）
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://YOUR_EXTENSION_ID');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, userId } = req.body;

  // レート制限（Redis or Upstash）
  // TODO: 1ユーザーあたり 1分間に 10リクエストまで

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `以下のテキストを3行で要約してください:\n\n${text}`
      }]
    });

    const summary = message.content[0].text;
    return res.status(200).json({ summary });
  } catch (error) {
    console.error('Claude API Error:', error);
    return res.status(500).json({ error: 'AI request failed' });
  }
}
```

**環境変数**:
```bash
# .env.local
CLAUDE_API_KEY=sk-ant-xxx
```

**デプロイ**:
```bash
vercel deploy
# → https://kord-api.vercel.app/api/ai-summarize
```

#### タスク 1-2: ページ本文抽出の実装

**`lib/readability.ts`** を新規作成:

```typescript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

/**
 * ページの本文を抽出（Content Script で実行）
 */
export function extractPageContent(): string {
  // DOM をクローン（元のページに影響を与えない）
  const documentClone = document.cloneNode(true) as Document;

  // Readability で本文抽出
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) {
    throw new Error('Failed to extract article content');
  }

  // HTML タグを削除してプレーンテキストに
  const plainText = article.textContent
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000); // 最大 10,000 文字（APIコスト削減）

  return plainText;
}
```

**依存関係**:
```bash
npm install @mozilla/readability jsdom
```

**Content Script に統合**:
```typescript
// entrypoints/content.ts
import { extractPageContent } from '../lib/readability';

// Background Script からのメッセージリスナー
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'EXTRACT_PAGE_CONTENT') {
    try {
      const content = extractPageContent();
      return Promise.resolve({ content });
    } catch (error) {
      return Promise.resolve({ error: error.message });
    }
  }
});
```

#### チェックリスト（Week 1）
- [ ] Vercel プロジェクト作成
- [ ] Claude API キー取得（Anthropic Console）
- [ ] `/api/ai-summarize` エンドポイント実装
- [ ] Readability.js 統合
- [ ] Content Script でページ本文抽出テスト
- [ ] API デプロイ & 疎通確認

---

### Week 2: AI コマンドの実装

#### タスク 2-1: Background Script に AI ロジック追加

**`lib/ai-commands.ts`** を新規作成:

```typescript
interface AIRequest {
  command: 'summarize' | 'translate' | 'ask' | 'explain-code';
  input: string;
  userApiKey?: string; // BYOK の場合
}

interface AIResponse {
  result: string;
  error?: string;
}

/**
 * AI コマンドを実行
 */
export async function executeAICommand(request: AIRequest): Promise<AIResponse> {
  const { command, input, userApiKey } = request;

  // BYOK の場合は直接 Claude API を呼び出し
  if (userApiKey) {
    return await callClaudeDirectly(command, input, userApiKey);
  }

  // 通常は Cloud Functions 経由
  return await callCloudFunction(command, input);
}

/**
 * Cloud Functions 経由で AI を呼び出し
 */
async function callCloudFunction(command: string, input: string): Promise<AIResponse> {
  const userId = await getUserId(); // chrome.storage から取得

  const response = await fetch('https://kord-api.vercel.app/api/ai-' + command, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, userId }),
  });

  if (!response.ok) {
    throw new Error('AI request failed');
  }

  const data = await response.json();
  return { result: data.result };
}

/**
 * BYOK: 直接 Claude API を呼び出し
 */
async function callClaudeDirectly(command: string, input: string, apiKey: string): Promise<AIResponse> {
  const prompts = {
    summarize: `以下のテキストを3行で要約してください:\n\n${input}`,
    translate: `以下のテキストを英語に翻訳してください:\n\n${input}`,
    ask: input,
    'explain-code': `以下のコードを行ごとに解説してください:\n\n${input}`,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompts[command] }],
    }),
  });

  if (!response.ok) {
    throw new Error('Claude API request failed');
  }

  const data = await response.json();
  return { result: data.content[0].text };
}

/**
 * ユーザーIDを取得（匿名ID）
 */
async function getUserId(): Promise<string> {
  const result = await chrome.storage.local.get('userId');
  if (result.userId) {
    return result.userId;
  }

  // 初回はランダムIDを生成
  const userId = crypto.randomUUID();
  await chrome.storage.local.set({ userId });
  return userId;
}
```

#### タスク 2-2: コマンドパレットに AI コマンド追加

**`lib/constants.ts`** に追加:

```typescript
export const AI_COMMANDS: CommandDefinition[] = [
  {
    id: 'ai-summarize',
    title: t('cmdAISummarize'), // "Summarize Page"
    subtitle: t('cmdAISummarizeDesc'), // "AI が今見ているページを3行で要約"
    action: 'AI_SUMMARIZE',
    icon: 'Sparkles',
    isPro: true, // Pro 限定
  },
  {
    id: 'ai-translate',
    title: t('cmdAITranslate'), // "Translate Text"
    subtitle: t('cmdAITranslateDesc'), // "AI がテキストを翻訳"
    action: 'AI_TRANSLATE',
    icon: 'Languages',
    isPro: true,
  },
  {
    id: 'ai-ask',
    title: t('cmdAIAsk'), // "Ask AI"
    subtitle: t('cmdAIAskDesc'), // "AI に自由質問"
    action: 'AI_ASK',
    icon: 'MessageSquare',
    isPro: true,
  },
];

export const COMMANDS = [...BROWSER_COMMANDS, ...AI_COMMANDS];
```

#### タスク 2-3: コマンド実行ロジック

**`entrypoints/palette/App.tsx`** に追加:

```typescript
const executeAICommand = async (command: string, input: string) => {
  // Pro ステータスチェック
  const isPro = await checkProStatus();
  const freeUsageCount = await getFreeDailyAIUsage();

  if (!isPro && freeUsageCount >= 3) {
    // Free ユーザーは1日3回まで
    setError('AI 機能は1日3回まで無料です。Pro にアップグレードして無制限で使いましょう！');
    return;
  }

  // BYOK チェック
  const { userApiKey } = await chrome.storage.local.get('userApiKey');

  // ローディング表示
  setLoading(true);

  try {
    const response = await executeAICommand({
      command,
      input,
      userApiKey,
    });

    // 結果を表示
    setAIResult(response.result);

    // Free ユーザーの使用回数を記録
    if (!isPro) {
      await incrementFreeDailyAIUsage();
    }

    // 分析記録
    await recordAction('aiCommand');
  } catch (error) {
    setError('AI リクエストが失敗しました。後でもう一度お試しください。');
  } finally {
    setLoading(false);
  }
};
```

#### チェックリスト（Week 2）
- [ ] `lib/ai-commands.ts` 実装
- [ ] AI_COMMANDS 追加
- [ ] コマンドパレットに AI コマンド表示
- [ ] AI 結果のインライン表示UI実装
- [ ] ローディングインジケーター追加
- [ ] エラーハンドリング実装

---

### Week 3: Pro / Free 分離ロジック & ExtensionPay 統合

#### タスク 3-1: ExtensionPay セットアップ

**ExtensionPay とは**:
- Chrome 拡張専用の課金プラットフォーム
- Stripe 統合済み
- サブスク・買い切り両対応
- 無料で使える（手数料 5% + Stripe 手数料）

**手順**:
1. https://extensionpay.com/ でアカウント作成
2. 拡張を登録
3. Extension ID を取得
4. Stripe アカウントを接続

**`lib/payment.ts`** を新規作成:

```typescript
import ExtPay from 'extpay';

const extpay = ExtPay('YOUR_EXTENSION_ID');

/**
 * Pro ステータスをチェック
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const user = await extpay.getUser();
    return user.paid;
  } catch (error) {
    console.error('Failed to check Pro status:', error);
    return false;
  }
}

/**
 * 3日間無料お試しの判定
 */
export async function isInFreeTrial(): Promise<boolean> {
  const { installedAt } = await chrome.storage.local.get('installedAt');
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - installedAt;

  return elapsed < threeDays;
}

/**
 * 支払いページを開く
 */
export function openPaymentPage() {
  extpay.openPaymentPage();
}

/**
 * ExtensionPay を初期化（background.ts で呼び出し）
 */
export function initializeExtensionPay() {
  extpay.startBackground();
}
```

**`entrypoints/background.ts`** に追加:

```typescript
import { initializeExtensionPay } from '../lib/payment';

export default defineBackground(() => {
  console.log('Kord background service worker started');

  // ExtensionPay 初期化
  initializeExtensionPay();

  // データ移行
  runMigrations();
});
```

**価格設定**:
```javascript
// ExtensionPay ダッシュボードで設定
{
  monthly: {
    price: 5,
    currency: 'USD',
    trialDays: 3,
  },
  yearly: {
    price: 39,
    currency: 'USD',
    trialDays: 3,
  }
}
```

#### タスク 3-2: Free ユーザーの AI 使用制限

**`lib/ai-quota.ts`** を新規作成:

```typescript
const STORAGE_KEY = 'kord_ai_usage';

interface AIUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * 今日の AI 使用回数を取得
 */
export async function getFreeDailyAIUsage(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { [STORAGE_KEY]: usage } = await chrome.storage.local.get(STORAGE_KEY);

  if (!usage || usage.date !== today) {
    return 0;
  }

  return usage.count;
}

/**
 * AI 使用回数をインクリメント
 */
export async function incrementFreeDailyAIUsage(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const count = await getFreeDailyAIUsage();

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      date: today,
      count: count + 1,
    },
  });
}

/**
 * AI 使用可能かチェック
 */
export async function canUseAI(): Promise<{ allowed: boolean; reason?: string }> {
  const isPro = await checkProStatus();
  const isInTrial = await isInFreeTrial();

  // Pro ユーザーは無制限
  if (isPro) {
    return { allowed: true };
  }

  // 無料お試し期間中は無制限
  if (isInTrial) {
    return { allowed: true };
  }

  // Free ユーザーは1日3回まで
  const usageCount = await getFreeDailyAIUsage();
  if (usageCount >= 3) {
    return {
      allowed: false,
      reason: 'AI 機能は1日3回まで無料です。Pro にアップグレードして無制限で使いましょう！',
    };
  }

  return { allowed: true };
}
```

#### チェックリスト（Week 3）
- [ ] ExtensionPay アカウント作成
- [ ] 拡張を ExtensionPay に登録
- [ ] Stripe アカウント接続
- [ ] `lib/payment.ts` 実装
- [ ] `lib/ai-quota.ts` 実装
- [ ] Pro / Free の分岐ロジック実装
- [ ] 3日間無料お試し実装
- [ ] 動作確認（Pro ステータスを手動で切り替えてテスト）

---

### Week 4: BYOK（Bring Your Own Key）オプション

#### タスク 4-1: 設定画面に API キー入力欄追加

**`entrypoints/popup/App.tsx`** に設定タブ追加:

```tsx
function SettingsTab() {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('userApiKey').then((result) => {
      if (result.userApiKey) {
        setApiKey(result.userApiKey);
      }
    });
  }, []);

  const handleSave = async () => {
    // API キーの検証
    const isValid = await validateClaudeApiKey(apiKey);
    if (!isValid) {
      alert('無効な API キーです。Claude Console で確認してください。');
      return;
    }

    // 保存
    await chrome.storage.local.set({ userApiKey: apiKey });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClear = async () => {
    await chrome.storage.local.remove('userApiKey');
    setApiKey('');
  };

  return (
    <div className="settings-tab">
      <h3>BYOK（Bring Your Own Key）</h3>
      <p>自分の Claude API キーを使用することで、AI 機能を無料で使えます。</p>

      <div className="api-key-input">
        <label>Claude API Key:</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
        />
        <button onClick={handleSave}>保存</button>
        <button onClick={handleClear}>クリア</button>
      </div>

      {isSaved && <p className="success">✅ API キーを保存しました</p>}

      <div className="byok-info">
        <h4>BYOK の仕組み</h4>
        <ul>
          <li>API キーは Chrome のローカルストレージに保存されます</li>
          <li>Kord のサーバーには送信されません</li>
          <li>AI リクエストは直接 Claude API に送信されます</li>
          <li>API 料金はあなたの Anthropic アカウントに請求されます</li>
        </ul>

        <h4>Claude API キーの取得方法</h4>
        <ol>
          <li><a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a> にログイン</li>
          <li>API Keys メニューから新しいキーを作成</li>
          <li>キーをコピーして上記に貼り付け</li>
        </ol>
      </div>
    </div>
  );
}
```

#### タスク 4-2: API キー検証ロジック

**`lib/ai-commands.ts`** に追加:

```typescript
/**
 * Claude API キーを検証
 */
export async function validateClaudeApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
```

#### チェックリスト（Week 4）
- [ ] 設定画面に BYOK セクション追加
- [ ] API キー入力欄実装
- [ ] API キー検証ロジック実装
- [ ] API キー保存/削除機能実装
- [ ] BYOK 使用時のフロー確認（Cloud Functions をスキップ）
- [ ] プライバシーポリシーに BYOK について追記

---

### Week 5: UI 改善 & Product Hunt 準備

#### タスク 5-1: AI 結果のインライン表示UI

**`entrypoints/palette/App.tsx`** に AI 結果表示エリア追加:

```tsx
{aiResult && (
  <div className="ai-result">
    <div className="ai-result-header">
      <Sparkles size={18} />
      <span>AI Result</span>
      <button onClick={() => setAiResult(null)}>✕</button>
    </div>
    <div className="ai-result-content">
      {aiResult}
    </div>
    <div className="ai-result-actions">
      <button onClick={() => navigator.clipboard.writeText(aiResult)}>
        Copy to Clipboard
      </button>
    </div>
  </div>
)}
```

**CSS スタイリング**:
```css
.ai-result {
  margin: 12px 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(124, 106, 255, 0.08), rgba(45, 212, 168, 0.04));
  border: 1px solid rgba(124, 106, 255, 0.2);
  border-radius: 10px;
  animation: fadeIn 0.3s ease-in;
}

.ai-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.ai-result-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #d1cfc8;
}

.ai-result-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### タスク 5-2: Pro アップグレードバナー

**`entrypoints/popup/App.tsx`** に Pro バナー追加:

```tsx
{!isPro && !isInTrial && (
  <div className="pro-banner">
    <h3>⚡ Kord Pro にアップグレード</h3>
    <ul>
      <li>🤖 AI 機能無制限</li>
      <li>📋 クリップボード履歴</li>
      <li>🎨 カスタムコマンド</li>
      <li>🎨 テーマカスタマイズ</li>
    </ul>
    <p className="pro-price">
      <strong>$5/月</strong> または <strong>$39/年</strong>（35% OFF）
    </p>
    <button onClick={openPaymentPage} className="pro-button">
      Pro にアップグレード
    </button>
  </div>
)}
```

#### タスク 5-3: Product Hunt 準備

**デモ動画撮影（45秒）**:
```
0:00 - Ctrl+K でコマンドパレット起動
0:05 - タブ検索のデモ
0:10 - "summarize" コマンド入力
0:15 - AI がページを要約
0:20 - "translate Hello" コマンド
0:25 - AI が翻訳結果を表示
0:30 - Pro 機能の紹介
0:40 - "Works great with Arcify" メッセージ
0:45 - END
```

**ランディングページ（kord.dev）**:
- Next.js + Tailwind CSS
- ヒーローセクション: "Arc-style Command Palette for Chrome, powered by AI"
- 機能紹介: Free vs Pro 比較表
- デモ動画埋め込み
- Chrome Web Store へのリンク
- GitHub リポジトリへのリンク

#### チェックリスト（Week 5）
- [ ] AI 結果表示UI実装
- [ ] Pro アップグレードバナー実装
- [ ] デモ動画撮影
- [ ] ランディングページ作成
- [ ] Product Hunt アカウント作成
- [ ] Product Hunt 投稿下書き作成
- [ ] Phase 1 ユーザーへの upvote 依頼メール準備

---

## 🧪 テストチェックリスト

### AI 機能テスト
- [ ] ページ要約が正常に動作する
- [ ] 翻訳が正常に動作する
- [ ] AI 自由質問が正常に動作する
- [ ] BYOK で API キーを設定すると Cloud Functions をスキップする
- [ ] 無効な API キーでエラーが表示される

### Pro / Free テスト
- [ ] Free ユーザーは1日3回まで AI が使える
- [ ] 4回目でアップグレードバナーが表示される
- [ ] 3日間無料お試し期間中は無制限
- [ ] Pro ユーザーは無制限で AI が使える
- [ ] ExtensionPay で支払い後、Pro ステータスが正しく反映される

### パフォーマンステスト
- [ ] AI リクエストが5秒以内に完了する
- [ ] ページ本文抽出が1秒以内に完了する
- [ ] ローディングインジケーターが正しく表示される
- [ ] エラー時に適切なメッセージが表示される

### セキュリティテスト
- [ ] API キーがローカルストレージに暗号化されて保存される
- [ ] Cloud Functions で CORS が正しく設定されている
- [ ] レート制限が正常に動作する
- [ ] ユーザーID が匿名化されている

---

## 💰 コスト試算

### API コスト（Claude Haiku）

| 項目 | 値 |
|-----|-----|
| Pro ユーザー数 | 30人 |
| 月平均リクエスト/ユーザー | 30回 |
| 1リクエストあたりのトークン数 | ~2,000 tokens（input + output） |
| Claude Haiku 価格 | $0.25 / 1M tokens（input）、$1.25 / 1M tokens（output） |
| 1リクエストコスト | ~$0.0015 |
| **月間 API コスト** | **$1.35** |
| MRR | $150 |
| **利益率** | **99.1%** |

### インフラコスト

| サービス | 月額 |
|---------|------|
| Vercel（Serverless Functions） | $0（無料枠: 100GB、100万リクエスト） |
| Firebase（Firestore - レート制限用） | $0（無料枠: 1GB、5万読取/日） |
| ExtensionPay | $0（手数料: 5% + Stripe 手数料） |
| **合計** | **$0** |

### 収益試算（Phase 2 終了時）

| 項目 | 値 |
|-----|-----|
| Free ユーザー | 2,000人 |
| Pro 転換率 | 2%（控えめ） |
| Pro ユーザー | 40人 |
| MRR | $200 |
| 月間コスト（API + インフラ） | $2 |
| **月間利益** | **$198** |
| **3ヶ月累計収益** | **$600** |

---

## 📊 KPI（Phase 2）

| KPI | 目標値 | 測定方法 |
|-----|--------|----------|
| 累計インストール数 | 2,000 | Chrome Web Store ダッシュボード |
| WAU | 600+ | chrome.storage でイベント記録 |
| Pro 購入数 | 30-40人 | ExtensionPay ダッシュボード |
| MRR | $150-200 | ExtensionPay ダッシュボード |
| AI 使用回数/日 | 100+ | chrome.storage でイベント記録 |
| Product Hunt upvotes | 100+ | Product Hunt |
| レビュー数 | 30+ | Chrome Web Store |
| 平均評価 | 4.5+ | Chrome Web Store |

---

## 🚀 リリース戦略

### Week 5 末のリリース手順

1. **Chrome Web Store アップデート申請**
   - v2.0.0 として申請
   - 変更ログ: "🤖 AI 機能追加！ページ要約、翻訳、自由質問が可能に。Pro 版開始（$5/月）"

2. **Product Hunt ローンチ**
   - 火曜日の PST 0:01 に投稿
   - タイトル: "Kord - Arc-style Command Palette for Chrome, powered by AI"
   - Tagline: "Search tabs, bookmarks, history instantly. Now with AI summarization, translation, and more."

3. **Phase 1 ユーザーへの通知**
   - Popup に「AI 機能が追加されました！3日間無料でお試しください」バナー表示
   - GitHub Issues で告知

4. **技術記事公開**
   - Zenn: 「Chrome 拡張でコマンドパレット内に AI を統合した話」
   - X（Twitter）: デモ動画 + Product Hunt へのリンク

5. **Reddit / Hacker News 投稿**
   - r/chrome, r/browsers に投稿
   - Show HN: "Kord v2 - Now with AI-powered summarization and translation"

---

## 次のステップ（Phase 3）

Phase 2 完了後、すぐに Phase 3 の準備を開始:
- カスタムコマンド機能の設計開始
- クリップボード履歴の実装開始
- ユーザーフィードバックを元に AI 機能の改善

**Phase 3 の詳細は `GROWTH_ROADMAP_V2.md` を参照。**

---

*最終更新: 2026-02-17*
