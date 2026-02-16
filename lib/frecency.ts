/**
 * Frecency: Frequency（頻度） + Recency（最近性）のスコアリング
 * chrome.storage.localに使用履歴を保存し、スコアを計算する
 */

interface UsageRecord {
  id: string;
  count: number;
  lastUsed: number; // timestamp
}

interface FrecencyData {
  [id: string]: UsageRecord;
}

const STORAGE_KEY = 'kord_frecency';
const MAX_AGE_DAYS = 90;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24時間
const CLEANUP_TIMESTAMP_KEY = 'kord_frecency_last_cleanup';

/**
 * 古いデータをクリーンアップ
 */
async function cleanupOldRecords(data: FrecencyData): Promise<FrecencyData> {
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const cleaned: FrecencyData = {};
  let removedCount = 0;

  for (const [id, record] of Object.entries(data)) {
    const age = now - record.lastUsed;
    if (age < maxAge) {
      cleaned[id] = record;
    } else {
      removedCount++;
    }
  }

  if (removedCount > 0) {
    console.log(`Kord: Cleaned up ${removedCount} old frecency records`);
  }

  return cleaned;
}

/**
 * クリーンアップが必要か判定
 */
async function shouldCleanup(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get(CLEANUP_TIMESTAMP_KEY);
    const lastCleanup = result[CLEANUP_TIMESTAMP_KEY] || 0;
    return Date.now() - lastCleanup > CLEANUP_INTERVAL_MS;
  } catch {
    return true; // エラー時は安全のためクリーンアップ実行
  }
}

/**
 * クリーンアップタイムスタンプを更新
 */
async function updateCleanupTimestamp(): Promise<void> {
  try {
    await chrome.storage.local.set({ [CLEANUP_TIMESTAMP_KEY]: Date.now() });
  } catch (error) {
    console.error('Failed to update cleanup timestamp:', error);
  }
}

/**
 * 使用履歴を記録
 */
export async function recordUsage(id: string): Promise<void> {
  try {
    let data = await getFrecencyData();
    const now = Date.now();

    if (data[id]) {
      data[id].count++;
      data[id].lastUsed = now;
    } else {
      data[id] = {
        id,
        count: 1,
        lastUsed: now,
      };
    }

    // 定期的にクリーンアップ実行
    if (await shouldCleanup()) {
      data = await cleanupOldRecords(data);
      await updateCleanupTimestamp();
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: data });
  } catch (error) {
    console.error('Failed to record usage:', error);
  }
}

/**
 * Frecencyデータを取得
 */
export async function getFrecencyData(): Promise<FrecencyData> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch (error) {
    console.error('Failed to get frecency data:', error);
    return {};
  }
}

/**
 * Frecencyスコアを計算
 * スコア = 使用回数 * 最近性の重み
 * 最近性の重み:
 * - 1日以内: 4倍
 * - 3日以内: 2倍
 * - 1週間以内: 1.5倍
 * - 1ヶ月以内: 1倍
 * - それ以上: 0.5倍
 */
export function calculateFrecencyScore(record: UsageRecord | undefined): number {
  if (!record) return 0;

  const now = Date.now();
  const ageInDays = (now - record.lastUsed) / (1000 * 60 * 60 * 24);

  let recencyWeight = 0.5;
  if (ageInDays < 1) {
    recencyWeight = 4;
  } else if (ageInDays < 3) {
    recencyWeight = 2;
  } else if (ageInDays < 7) {
    recencyWeight = 1.5;
  } else if (ageInDays < 30) {
    recencyWeight = 1;
  }

  return record.count * recencyWeight;
}

/**
 * IDに対するFrecencyスコアを取得
 */
export async function getFrecencyScore(id: string): Promise<number> {
  const data = await getFrecencyData();
  return calculateFrecencyScore(data[id]);
}

/**
 * 複数のアイテムをFrecencyスコアでソート
 */
export async function sortByFrecency<T extends { id: string }>(
  items: T[]
): Promise<T[]> {
  const data = await getFrecencyData();

  return items.sort((a, b) => {
    const scoreA = calculateFrecencyScore(data[a.id]);
    const scoreB = calculateFrecencyScore(data[b.id]);
    return scoreB - scoreA;
  });
}
