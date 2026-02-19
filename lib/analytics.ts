/**
 * ユーザー行動分析機能（100%ローカル）
 * frecency.ts のパターンを再利用
 */

interface AnalyticsData {
  totalUsageCount: number;
  actionCounts: {
    tabSwitch: number;
    bookmarkOpen: number;
    historyOpen: number;
    commandExecute: number;
    searchGoogle: number;
  };
  lastUsedAt: number;
  installDate: number;
}

const STORAGE_KEY = 'kord_analytics';

/**
 * デフォルトの分析データを作成
 */
function createDefaultAnalytics(): AnalyticsData {
  return {
    totalUsageCount: 0,
    actionCounts: {
      tabSwitch: 0,
      bookmarkOpen: 0,
      historyOpen: 0,
      commandExecute: 0,
      searchGoogle: 0,
    },
    lastUsedAt: Date.now(),
    installDate: Date.now(),
  };
}

/**
 * 分析データを取得
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    if (!result[STORAGE_KEY]) {
      // 初回アクセス時はデフォルトデータを作成して保存
      const defaultData = createDefaultAnalytics();
      await chrome.storage.local.set({ [STORAGE_KEY]: defaultData });
      return defaultData;
    }
    return result[STORAGE_KEY];
  } catch {
    return createDefaultAnalytics();
  }
}

/**
 * アクションを記録
 */
export async function recordAction(
  actionType: keyof AnalyticsData['actionCounts']
): Promise<void> {
  try {
    const data = await getAnalyticsData();

    data.totalUsageCount++;
    data.actionCounts[actionType]++;
    data.lastUsedAt = Date.now();

    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  } catch {
    // 無視
  }
}

/**
 * 分析サマリーを取得
 */
export async function getAnalyticsSummary(): Promise<{
  totalUses: number;
  daysSinceInstall: number;
  mostUsedAction: string;
  actionCounts: AnalyticsData['actionCounts'];
}> {
  const data = await getAnalyticsData();

  const daysSinceInstall = Math.floor(
    (Date.now() - data.installDate) / (1000 * 60 * 60 * 24)
  );

  // 最も使用されたアクションを特定
  const actionEntries = Object.entries(data.actionCounts);
  const mostUsed = actionEntries.reduce((max, current) =>
    current[1] > max[1] ? current : max
  );

  return {
    totalUses: data.totalUsageCount,
    daysSinceInstall,
    mostUsedAction: mostUsed[0],
    actionCounts: data.actionCounts,
  };
}
