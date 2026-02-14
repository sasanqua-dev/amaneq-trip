/**
 * アプリ内ブラウザの検出ユーティリティ
 *
 * LINE、Instagram、Facebook、Twitter/X などのアプリ内ブラウザでは
 * Google OAuth がブロックされるため、検出して外部ブラウザへ誘導する。
 */

export type InAppBrowserInfo = {
  isInAppBrowser: boolean;
  appName: string | null;
};

const IN_APP_BROWSER_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /\bLine\//i, name: "LINE" },
  { pattern: /\bFBAN\b|FBAV\//i, name: "Facebook" },
  { pattern: /\bInstagram/i, name: "Instagram" },
  { pattern: /\bTwitter\b/i, name: "Twitter" },
  { pattern: /\bThreads\b/i, name: "Threads" },
  { pattern: /\bTikTok\b/i, name: "TikTok" },
  { pattern: /\bWeChat\b|MicroMessenger/i, name: "WeChat" },
  { pattern: /\bDiscord\b/i, name: "Discord" },
  { pattern: /\bSlack\b/i, name: "Slack" },
];

export function detectInAppBrowser(userAgent: string): InAppBrowserInfo {
  for (const { pattern, name } of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isInAppBrowser: true, appName: name };
    }
  }
  return { isInAppBrowser: false, appName: null };
}
