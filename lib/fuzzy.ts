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

  // 部分一致
  const exactMatchIndex = targetLower.indexOf(queryLower);
  if (exactMatchIndex !== -1) {
    const score = 600 - exactMatchIndex * 2; // 先頭に近いほど高スコア
    return {
      score,
      matched: true,
      indices: Array.from({ length: query.length }, (_, i) => exactMatchIndex + i),
    };
  }

  // あいまい検索（文字の順序一致）
  let targetIndex = 0;
  let queryIndex = 0;
  const indices: number[] = [];
  let consecutiveMatches = 0;
  let totalScore = 0;

  while (queryIndex < queryLower.length && targetIndex < targetLower.length) {
    if (queryLower[queryIndex] === targetLower[targetIndex]) {
      indices.push(targetIndex);
      consecutiveMatches++;
      // 連続マッチボーナス
      totalScore += 10 + consecutiveMatches * 5;
      // 先頭に近いほどボーナス
      totalScore += Math.max(0, 20 - targetIndex);
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

  // スコアを正規化（最大400点）
  const normalizedScore = Math.min(400, totalScore);

  return { score: normalizedScore, matched: true, indices };
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
