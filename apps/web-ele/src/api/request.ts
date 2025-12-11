import type { RequestClientOptions } from '@vben/request';
import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';
import { ElMessage, ElNotification } from 'element-plus';
import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// ========== 常量定义 ==========
const PUBLIC_APIS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refreshToken',
  '/auth/verifyCaptcha',
]);

const STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'accessCodes',
  'isLockScreen',
] as const;

// ========== 全局状态 ==========
let isReAuthenticating = false;
let authFailed = false;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// ========== 工具函数 ==========
function isPublicAPI(url?: string): boolean {
  if (!url) return false;
  return Array.from(PUBLIC_APIS).some((api) => url.includes(api));
}

function formatToken(token: null | string): string | null {
  return token ? `Bearer ${token}` : null;
}

function clearAuthData() {
  const accessStore = useAccessStore();
  accessStore.setAccessToken(null);
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

async function doReAuthenticate() {
  if (isReAuthenticating) return;
  isReAuthenticating = true;
  authFailed = true;
  clearAuthData();
  
  ElNotification({
    title: '登录已过期',
    message: '即将跳转到登录页',
    type: 'warning',
    duration: 2000,
  });

  setTimeout(async () => {
    try {
      const routerModule = await import('#/router');
      const router = (routerModule as any).default || (routerModule as any).router || routerModule;
      
      await router.replace({
        path: '/auth/login',
        query: {
          redirect: encodeURIComponent(window.location.pathname),
          expired: 'true'
        }
      });
    } catch (error) {
      console.error('路由跳转失败:', error);
      window.location.href = '/auth/login';
    } finally {
      isReAuthenticating = false;
    }
  }, 2000);
}

function extractAccessToken(response: any): string | null {
  if (typeof response === 'string') {
    return response;
  }
  if (response?.accessToken) {
    return response.accessToken;
  }
  if (response?.data) {
    const { data } = response;
    if (typeof data === 'string') {
      return data;
    }
    if (data.accessToken) {
      return data.accessToken;
    }
    if (data.data?.accessToken) {
      return data.data.accessToken;
    }
  }
  return null;
}

// ========== Token 刷新逻辑 ==========
async function doRefreshToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('Refresh Token 不存在');
      }

      const response = await refreshTokenApi(refreshToken);
      const newAccessToken = extractAccessToken(response);

      if (!newAccessToken || typeof newAccessToken !== 'string') {
        throw new Error('刷新失败：Token 为空');
      }

      const accessStore = useAccessStore();
      localStorage.setItem('accessToken', newAccessToken);
      accessStore.setAccessToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ========== 创建请求客户端 ==========
function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // ========== 请求拦截器 ==========
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      if (isPublicAPI(config.url)) {
        return config;
      }

      if (authFailed) {
        return new Promise(() => {});
      }
      
      const accessStore = useAccessStore();
      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // ========== Blob 响应拦截器（必须在第一个）==========
  client.addResponseInterceptor({
    fulfilled: (response) => {
      //如果请求配置了 responseType: 'blob'，直接返回完整响应
      if (response.config?.responseType === 'blob') {return response;}
      // 如果响应数据是 Blob，也直接返回完整响应
      if (response.data instanceof Blob) {return response;}
      // 其他情况继续传递
      return response;
    },
  });

  // ========== 默认响应拦截器 ==========
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // ========== Token 过期处理（401 自动刷新）==========
  client.addResponseInterceptor({
    fulfilled: (response) => response,
    rejected: async (error) => {
      const status = error?.response?.status;
      const config = error?.config;

      if (isPublicAPI(config?.url)) {
        return Promise.reject(error);
      }

      if (status === 401 && config && !config._retry) {
        config._retry = true;

        if (isReAuthenticating || authFailed) {
          return new Promise(() => {});
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          await doReAuthenticate();
          return new Promise(() => {});
        }

        try {
          const newAccessToken = await doRefreshToken();
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${newAccessToken}`;

          const method = (config.method || 'get').toLowerCase();
          const url = config.url || '';

          switch (method) {
            case 'get':
              return client.get(url, config);
            case 'post':
              return client.post(url, config.data, config);
            case 'put':
              return client.put(url, config.data, config);
            case 'delete':
              return client.delete(url, config);
            default:
              return client.get(url, config);
          }
        } catch (refreshError) {
          await doReAuthenticate();
          return new Promise(() => {});
        }
      }

      return Promise.reject(error);
    },
  });

  // ========== 错误消息处理 ==========
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const statusCode = error?.response?.status;
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? msg;

      if (statusCode === 401) {
        return;
      }

      if (isPublicAPI(error?.config?.url)) {
        return;
      }

      // 🔥 如果响应数据是 Blob，不显示错误消息
      if (responseData instanceof Blob) {
        console.log('⚠️ Blob 响应被误判为错误，跳过错误提示');
        return;
      }

      ElMessage.error(errorMessage);
    }),
  );

  return client;
}

// ========== 导出实例 ==========
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
  timeout: 10000,
});

export const baseRequestClient = new RequestClient({
  baseURL: apiURL,
  timeout: 10000,
});

// 导出重置函数（登录成功后调用）
export function resetAuthState() {
  authFailed = false;
  isReAuthenticating = false;
  isRefreshing = false;
  refreshPromise = null;
}
