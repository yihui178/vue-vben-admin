import type { UserInfo } from '@vben/types';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { 
  resetAllStores, 
  useAccessStore, 
  useUserStore as useVbenUserStore  // ← 重命名框架的 Store
} from '@vben/stores';
import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';
import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi, type AuthApi } from '#/api';
import { $t } from '#/locales';
import { resetAuthState } from '#/api/request';
import { useUserStore as useCustomUserStore } from './member';  // ← 导入您自己的 Store

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const vbenUserStore = useVbenUserStore();  // ← 框架的 Store
  const customUserStore = useCustomUserStore();  // ← 您自己的 Store
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

      // ✅ 重置认证状态
      resetAuthState();

      // ✅ 重置会员状态（使用自定义 Store）
      customUserStore.reset();
      console.log('✅ 已重置会员状态');

      // 获取用户信息和权限码
      const [userInfo, accessCodes] = await Promise.all([
        getUserInfoApi(),
        getAccessCodesApi(),
      ]);

      if (!userInfo) {
        throw new Error('获取用户信息失败');
      }

      // ✅ 使用框架的 Store 设置用户信息
      vbenUserStore.setUserInfo(userInfo);
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
      
      return { userInfo };
    } catch (error) {
      console.error('❌ 登录失败:', error);
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
      console.log('✅ 后端登出成功');
    } catch (error) {
      console.error('⚠️ 后端登出失败:', error);
    }

    // ✅ 清除会员状态缓存（使用自定义 Store）
    customUserStore.clearCache();
    console.log('✅ 会员状态缓存已清除');

    // ✅ 重置所有 Store（包括框架的）
    try {
      resetAllStores();
      console.log('✅ 所有 Store 已重置');
    } catch (error) {
      console.error('⚠️ 重置 Store 失败:', error);
    }
    
    // 清除 Token
    localStorage.removeItem('refreshToken');
    
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? { redirect: encodeURIComponent(router.currentRoute.value.fullPath) }
        : {},
    });
    
    console.log('✅ 登出完成');
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    
    if (!userInfo) {
      throw new Error('获取用户信息失败');
    }
    
    vbenUserStore.setUserInfo(userInfo);
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
