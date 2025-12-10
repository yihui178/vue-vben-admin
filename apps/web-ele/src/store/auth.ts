import type { UserInfo } from '@vben/types';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';
import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';
import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi, type AuthApi } from '#/api';
import { $t } from '#/locales';
import { resetAuthState } from '#/api/request';
export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const loginLoading = ref(false);
  /**
   * 登录
   */
  async function authLogin(
    params: AuthApi.LoginParams,
    onSuccess?: () => Promise<void> | void,
  ) {
    try {
      loginLoading.value = true;
      
      const { accessToken, refreshToken } = await loginApi(params);
      if (!accessToken) {
        throw new Error('登录失败：未获取到 Token');
      }
      // 存储 Token
      accessStore.setAccessToken(accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      //重置认证状态
      resetAuthState();

      // 获取用户信息和权限码
      const [userInfo, accessCodes] = await Promise.all([
        getUserInfoApi(),
        getAccessCodesApi(),
      ]);
      // 添加空值检查
      if (!userInfo) {
        throw new Error('获取用户信息失败');
      }
      userStore.setUserInfo(userInfo);
      accessStore.setAccessCodes(accessCodes);
      // 导航
      if (accessStore.loginExpired) {
        accessStore.setLoginExpired(false);
      } else {
        const homePath = userInfo.homePath || preferences.app.defaultHomePath;
        await (onSuccess?.() ?? router.push(homePath));
      }
      // 显示欢迎通知
      if (userInfo.realName) {
        ElNotification({
          message: `${$t('authentication.loginSuccessDesc')}:${userInfo.realName}`,
          title: $t('authentication.loginSuccess'),
          type: 'success',
        });
      }
      
      return { userInfo }; // 此时 userInfo 已确认非空
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    } finally {
      loginLoading.value = false;
    }
  }
  /**
   * 登出
   */
  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 忽略错误
    }
    resetAllStores();
    localStorage.removeItem('refreshToken');
    accessStore.setLoginExpired(false);
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) }
        : {},
    });
  }
  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    
    // 添加空值检查
    if (!userInfo) {
      throw new Error('获取用户信息失败');
    }
    
    userStore.setUserInfo(userInfo);
    return userInfo;
  }
  function $reset() {
    loginLoading.value = false;
  }
  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
