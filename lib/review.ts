/**
 * レビュープロンプト管理
 * frecency.ts の shouldCleanup() パターンを再利用
 */

interface ReviewState {
  hasReviewed: boolean;
  hasDismissed: boolean;
  promptShownCount: number;
  firstUsedAt: number;
  lastPromptShownAt: number;
}

const STORAGE_KEY = 'kord_review_state';
const MIN_DAYS_BEFORE_PROMPT = 3;
const MIN_USAGE_COUNT = 20;

/**
 * デフォルトのレビュー状態を作成
 */
function createDefaultReviewState(): ReviewState {
  return {
    hasReviewed: false,
    hasDismissed: false,
    promptShownCount: 0,
    firstUsedAt: Date.now(),
    lastPromptShownAt: 0,
  };
}

/**
 * レビュー状態を取得
 */
async function getReviewState(): Promise<ReviewState> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (!result[STORAGE_KEY]) {
      const defaultState = createDefaultReviewState();
      await chrome.storage.local.set({ [STORAGE_KEY]: defaultState });
      return defaultState;
    }
    return result[STORAGE_KEY];
  } catch (error) {
    console.error('Failed to get review state:', error);
    return createDefaultReviewState();
  }
}

/**
 * レビュー状態を保存
 */
async function saveReviewState(state: ReviewState): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
  } catch (error) {
    console.error('Failed to save review state:', error);
  }
}

/**
 * レビュープロンプトを表示すべきか判定
 */
export async function shouldShowReviewPrompt(totalUsageCount: number): Promise<boolean> {
  const state = await getReviewState();

  // 既にレビュー済みまたは却下済みの場合は表示しない
  if (state.hasReviewed || state.hasDismissed) {
    return false;
  }

  // 初回使用から3日以上経過しているか
  const daysSinceFirstUse =
    (Date.now() - state.firstUsedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceFirstUse < MIN_DAYS_BEFORE_PROMPT) {
    return false;
  }

  // 合計使用回数が20回以上か
  if (totalUsageCount < MIN_USAGE_COUNT) {
    return false;
  }

  return true;
}

/**
 * レビュー済みとしてマーク
 */
export async function markAsReviewed(): Promise<void> {
  const state = await getReviewState();
  state.hasReviewed = true;
  state.lastPromptShownAt = Date.now();
  await saveReviewState(state);
}

/**
 * レビュープロンプトを却下
 */
export async function dismissReviewPrompt(): Promise<void> {
  const state = await getReviewState();
  state.hasDismissed = true;
  state.promptShownCount++;
  state.lastPromptShownAt = Date.now();
  await saveReviewState(state);
}

/**
 * レビューページを開く
 */
export function openReviewPage(): void {
  // Chrome Web Store のレビューページURL（公開後に更新）
  const reviewUrl = 'https://chromewebstore.google.com/detail/kord/YOUR_EXTENSION_ID/reviews';
  chrome.tabs.create({ url: reviewUrl });
}
