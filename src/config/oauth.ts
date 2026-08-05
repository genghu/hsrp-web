export interface WechatOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface QQOAuthConfig {
  appId: string;
  appKey: string;
  redirectUri: string;
}

export function getWechatConfig(): WechatOAuthConfig | null {
  const { WECHAT_APP_ID, WECHAT_APP_SECRET, WECHAT_REDIRECT_URI } = process.env;
  if (!WECHAT_APP_ID || !WECHAT_APP_SECRET || !WECHAT_REDIRECT_URI) return null;
  return { appId: WECHAT_APP_ID, appSecret: WECHAT_APP_SECRET, redirectUri: WECHAT_REDIRECT_URI };
}

export function getQQConfig(): QQOAuthConfig | null {
  const { QQ_APP_ID, QQ_APP_KEY, QQ_REDIRECT_URI } = process.env;
  if (!QQ_APP_ID || !QQ_APP_KEY || !QQ_REDIRECT_URI) return null;
  return { appId: QQ_APP_ID, appKey: QQ_APP_KEY, redirectUri: QQ_REDIRECT_URI };
}

export function isWechatConfigured(): boolean {
  return getWechatConfig() !== null;
}

export function isQQConfigured(): boolean {
  return getQQConfig() !== null;
}
