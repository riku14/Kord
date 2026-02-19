/**
 * QuickBar → Kord データ移行
 * background.ts の初期化時に1回だけ実行
 */

const MIGRATION_FLAG_KEY = 'kord_migration_completed';
const MIGRATIONS = [
  { oldKey: 'quickbar_frecency', newKey: 'kord_frecency' },
  { oldKey: 'quickbar_frecency_last_cleanup', newKey: 'kord_frecency_last_cleanup' },
];

export async function runMigrations(): Promise<void> {
  try {
    // 既に移行済みかチェック
    const result = await chrome.storage.local.get(MIGRATION_FLAG_KEY);
    if (result[MIGRATION_FLAG_KEY]) {
      return;
    }

    // 各キーを移行（oldKey → newKey へコピー＆削除）
    let migratedCount = 0;
    for (const { oldKey, newKey } of MIGRATIONS) {
      const oldData = await chrome.storage.local.get(oldKey);
      if (oldData[oldKey] !== undefined) {
        await chrome.storage.local.set({ [newKey]: oldData[oldKey] });
        await chrome.storage.local.remove(oldKey);
        migratedCount++;
      }
    }

    await chrome.storage.local.set({ [MIGRATION_FLAG_KEY]: true });

  } catch {
    // 移行失敗しても拡張機能は動作続行
  }
}
