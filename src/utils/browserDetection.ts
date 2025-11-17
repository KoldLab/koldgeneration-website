/**
 * Detects if the current browser is an in-app browser (WebView)
 * In-app browsers from messaging apps often block popups, so we need to use redirects instead
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const standalone = (window.navigator as any).standalone;

  // Check for common in-app browser patterns
  const inAppPatterns = [
    'wv', // Android WebView
    'webview', // Generic WebView
    'messenger', // Facebook Messenger
    'fban', // Facebook App
    'fbav', // Facebook App
    'line', // LINE app
    'whatsapp', // WhatsApp
    'instagram', // Instagram
    'snapchat', // Snapchat
    'twitter', // Twitter
    'linkedin', // LinkedIn
    'wechat', // WeChat
    'qq', // QQ
    'mqqbrowser', // QQ Browser
    'micromessenger', // WeChat
    'baiduboxapp', // Baidu Box App
    'baidubrowser', // Baidu Browser
    'ucbrowser', // UC Browser
    'sogou', // Sogou Browser
    'qihoobrowser', // 360 Browser
  ];

  // Check if user agent matches any in-app browser pattern
  const isInApp = inAppPatterns.some((pattern) => userAgent.includes(pattern));

  // Check for iOS standalone mode (PWA opened from home screen)
  // This is NOT an in-app browser, so we exclude it
  const isStandalone = standalone === true;

  // Additional check: if window.opener is null and we're in a mobile-like environment,
  // it might be an in-app browser
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent
  );

  // If it's mobile and matches in-app patterns, or if it's a WebView
  return (isInApp && isMobile) || (!isStandalone && isInApp);
}

