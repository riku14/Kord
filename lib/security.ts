/**
 * Security utilities for QuickBar
 */

/**
 * 安全なURL（faviconなど）かどうかを検証
 * javascript:, data:, blob: などのXSSリスクのあるURLを拒否
 */
export function isSafeUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const safeProtocols = ['http:', 'https:', 'chrome:', 'chrome-extension:'];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    // 不正なURL
    return false;
  }
}

/**
 * Chrome拡張機能のオリジンを取得
 */
export function getExtensionOrigin(): string {
  return `chrome-extension://${browser.runtime.id}`;
}

/**
 * メッセージが信頼できるオリジンから来たか検証
 */
export function isValidMessageOrigin(origin: string): boolean {
  return origin === getExtensionOrigin();
}
