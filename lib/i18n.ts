/**
 * i18n ヘルパー関数
 * WXT標準の browser.i18n API のラッパー
 */

export function t(key: string, substitutions?: string | string[]): string {
  const getMessage = browser.i18n.getMessage as (
    messageName: string,
    substitutions?: string | string[]
  ) => string;
  return getMessage(key, substitutions) || key;
}

export function getCurrentLocale(): string {
  return browser.i18n.getUILanguage();
}

export function getShortcutDisplay(): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd+K' : 'Ctrl+K';
}
