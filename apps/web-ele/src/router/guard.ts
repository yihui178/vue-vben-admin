import type { Router } from 'vue-router';
import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';
import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';
import { generateAccess } from './access';
// ========== 常量定义 ==========
/**
 * 白名单路由（不需要认证）
 */
const WHITE_LIST = new Set([
  LOGIN_PATH,
  '/register',
  '/404',
  '/403',
  '/500',
]);
/**
 * 需要清除的本地存储键
 */
const STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'accessCodes',
  'isLockScreen',
] as const;
// ========== 通用守卫 ==========
/**
 * 通用守卫配置（加载进度条）
 */
function setupCommonGuard(router: Router) {
  const loadedPaths = new Set<string>();
  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);
    
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    
    return true;
  });
  router.afterEach((to) => {
    loadedPaths.add(to.path);
    
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}
// ========== 权限守卫 ==========
/**
 * 权限访问守卫配置
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();
    // 1️⃣ 白名单路由直接放行
    if (WHITE_LIST.has(to.path)) {
      // 已登录用户访问登录页，重定向到首页
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return decodeURIComponent(
          (to.query?.redirect as string) ||
            userStore.userInfo?.homePath ||
            preferences.app.defaultHomePath,
        );
      }
      return true;
    }
    // 2️⃣ 基本路由直接放行
    if (coreRouteNames.includes(to.name as string)) {
      return true;
    }
    // 3️⃣ 检查 Token
    const accessToken = accessStore.accessToken;
    if (!accessToken) {
      return redirectToLogin(to);
    }
    // 4️⃣ Token 刷新由请求拦截器自动处理
    //     路由守卫不再主动刷新 Token
    // 5️⃣ 忽略权限检查的路由
    if (to.meta.ignoreAccess) {
      return true;
    }
    // 6️⃣ 检查是否已生成动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }
    // 7️⃣ 生成动态路由
    try {
      const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
      const userRoles = userInfo.roles ?? [];
      const { accessibleMenus, accessibleRoutes } = await generateAccess({
        roles: userRoles,
        router,
        routes: accessRoutes,
      });
      accessStore.setAccessMenus(accessibleMenus);
      accessStore.setAccessRoutes(accessibleRoutes);
      accessStore.setIsAccessChecked(true);
      // 计算重定向路径
      const redirectPath = (
        from.query.redirect ??
        (to.path === preferences.app.defaultHomePath
          ? userInfo.homePath || preferences.app.defaultHomePath
          : to.fullPath)
      ) as string;
      return {
        ...router.resolve(decodeURIComponent(redirectPath)),
        replace: true,
      };
    } catch (error) {
      clearAuthData(accessStore);
      return redirectToLogin(to);
    }
  });
}
// ========== 辅助函数 ==========
/**
 * 清除认证数据
 */
function clearAuthData(accessStore: any) {
  accessStore.setAccessToken(null);
  accessStore.setIsAccessChecked(false);
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}
/**
 * 重定向到登录页
 */
function redirectToLogin(to: any) {
  return {
    path: LOGIN_PATH,
    query:
      to.fullPath === preferences.app.defaultHomePath
        ? {}
        : { redirect: encodeURIComponent(to.fullPath) },
    replace: true,
  };
}
// ========== 导出 ==========
/**
 * 创建路由守卫
 */
export function createRouterGuard(router: Router) {
  setupCommonGuard(router);
  setupAccessGuard(router);
}
