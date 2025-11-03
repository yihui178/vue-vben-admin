import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    captcha?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 校验验证码参数 */
  export interface VerifyCaptchaParams {
    captcha: string;
  }

  /** 校验验证码返回值（后端标准响应可能包含 code/message/data） */
  export interface VerifyCaptchaResult {
    code?: number;
    data?: string;
    message?: string;
  }
}

/**
 * 登录
 */

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

/**
 * 校验验证码（统一到 API 层）
 */
export async function verifyCaptchaApi(data: AuthApi.VerifyCaptchaParams) {
  // 保持与其它接口一致，使用 requestClient 及相对路径
  return requestClient.post<AuthApi.VerifyCaptchaResult>(
    '/auth/verifyCaptcha',
    data,
  );
}
