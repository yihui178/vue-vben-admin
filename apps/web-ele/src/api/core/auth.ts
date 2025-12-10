import { baseRequestClient, requestClient } from '#/api/request';
export namespace AuthApi {
  /** 登录参数 */
  export interface LoginParams {
    username: string;
    password: string;
    captcha: string;
  }
  /** 登录返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken: string;
  }
  /** 刷新 Token 返回值 */
  export interface RefreshTokenResult {
    accessToken: string;
  }
  /** 验证码参数 */
  export interface VerifyCaptchaParams {
    captcha: string;
  }
}
/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}
/**
 * 刷新 Token
 */
export async function refreshTokenApi(refreshToken: string) {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/auth/refreshToken',
    { refreshToken }
  );
}
/**
 * 登出
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}
/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
/**
 * 获取用户信息（✅ 只在这里定义一次）
 */
export async function getUserInfoApi() {
  return requestClient.get('/user/info');
}
/**
 * 验证码校验
 */
export async function verifyCaptchaApi(data: AuthApi.VerifyCaptchaParams) {
  return requestClient.post('/auth/verifyCaptcha', data);
}
