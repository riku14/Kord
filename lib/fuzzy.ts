/**
 * ファジー検索のスコアリング
 * - 大文字小文字を区別しない
 * - 部分一致を優先
 * - 文字の順序一致（あいまい検索）にも対応
 * - マッチした位置のスコアを計算（先頭一致ほど高スコア）
 * - 連続マッチほど高スコア
 */

interface FuzzyMatch {
  score: number;
  matched: boolean;
  indices: number[];
}

export function fuzzyMatch(query: string, target: string): FuzzyMatch {
  if (!query) {
    return { score: 0, matched: true, indices: [] };
  }

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // 完全一致
  if (targetLower === queryLower) {
    return { score: 1000, matched: true, indices: Array.from({ length: query.length }, (_, i) => i) };
  }

  // 先頭一致
  if (targetLower.startsWith(queryLower)) {
    return { score: 800, matched: true, indices: Array.from({ length: query.length }, (_, i) => i) };
  }

  // 部分一致（より厳格な条件）
  const exactMatchIndex = targetLower.indexOf(queryLower);
  if (exactMatchIndex !== -1) {
    // 検索語が対象文字列の50%以上を占める場合のみ有効とする
    const queryRatio = query.length / target.length;
    if (queryRatio >= 0.3) {
      const score = 600 - exactMatchIndex * 10; // 先頭に近いほど高スコア（ペナルティ強化）
      return {
        score: Math.max(score, 100), // 最低スコアを100に設定
        matched: true,
        indices: Array.from({ length: query.length }, (_, i) => exactMatchIndex + i),
      };
    }
  }

  // あいまい検索（文字の順序一致）- 厳格化
  let targetIndex = 0;
  let queryIndex = 0;
  const indices: number[] = [];
  let consecutiveMatches = 0;
  let totalScore = 0;

  while (queryIndex < queryLower.length && targetIndex < targetLower.length) {
    if (queryLower[queryIndex] === targetLower[targetIndex]) {
      indices.push(targetIndex);
      consecutiveMatches++;
      // 連続マッチボーナス（減少）
      totalScore += 5 + consecutiveMatches * 2;
      // 先頭に近いほどボーナス（減少）
      totalScore += Math.max(0, 10 - targetIndex);
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
    targetIndex++;
  }

  // 全ての文字がマッチしたか
  const matched = queryIndex === queryLower.length;

  if (!matched) {
    return { score: 0, matched: false, indices: [] };
  }

  // あいまい検索の追加条件：検索語が短すぎる場合は除外
  if (query.length < 3) {
    return { score: 0, matched: false, indices: [] };
  }

  // スコアを正規化（最大200点に減少）
  const normalizedScore = Math.min(200, totalScore);

  // 低スコア（50点未満）は除外
  if (normalizedScore < 50) {
    return { score: 0, matched: false, indices: [] };
  }

  return { score: normalizedScore, matched: true, indices };
}

/**
 * URLを正規化して検索精度を向上
 * - プロトコル (https://, http://) を除去
 * - www. を除去
 * - 末尾スラッシュを除去
 */
export function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

/**
 * 複数フィールドに対してファジー検索を実行
 */
export function fuzzyMatchMultiple(
  query: string,
  fields: string[]
): { score: number; matched: boolean } {
  if (!query) {
    return { score: 0, matched: true };
  }

  let bestScore = 0;
  let anyMatched = false;

  for (const field of fields) {
    if (!field) continue;
    const result = fuzzyMatch(query, field);
    if (result.matched) {
      anyMatched = true;
      bestScore = Math.max(bestScore, result.score);
    }
  }

  return { score: bestScore, matched: anyMatched };
}

/**
 * 文字列が有効なURLかどうかを判定
 * - http/https プロトコル付き
 * - www. 付きドメイン
 * - IPアドレス（ポート付きも含む）
 * - ローカルホスト
 * - プロトコルなしのドメイン
 */
export function isValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();
  
  // 明らかにURLではないもの（スペース含む、短すぎる）
  if (trimmed.includes(' ') || trimmed.length < 4) {
    return false;
  }

  // プロトコル付きURL
  if (/^https?:\/\/.+/.test(trimmed)) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  // www. で始まる
  if (/^www\..+/.test(trimmed)) {
    try {
      new URL(`https://${trimmed}`);
      return true;
    } catch {
      return false;
    }
  }

  // IPアドレス（ポート付きも含む）
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?([/?].*)?$/.test(trimmed)) {
    return true;
  }

  // localhost
  if (/^localhost(:\d+)?([/?].*)?$/.test(trimmed)) {
    return true;
  }

  // ドメイン名パターン（TLD付き）
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}([/?].*)?$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * URLを正規化（プロトコルを自動付与）
 */
export function normalizeUrlInput(input: string): string {
  const trimmed = input.trim();
  
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }
  
  return `https://${trimmed}`;
}
