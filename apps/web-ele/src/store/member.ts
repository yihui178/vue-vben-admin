import { defineStore } from 'pinia';
import { ref } from 'vue';
import { requestClient } from '#/api/request';

export const useUserStore = defineStore('user', () => {
  const isMember = ref<boolean | null>(null);
  const loading = ref(false);
  
  /**
   * ✅ 检查会员状态（带缓存）
   */
  const checkMemberStatus = async (forceRefresh = false) => {
    if (isMember.value !== null && !forceRefresh) {
      console.log('🎯 使用前端缓存:', isMember.value);
      return isMember.value;
    }
    
    try {
      loading.value = true;
      console.log('📡 请求后端接口: /user/is-member');
      
      const res = await requestClient.get('/user/is-member');
      isMember.value = res === true || res?.data === true;
      
      console.log('✅ 会员状态已更新:', isMember.value);
      return isMember.value;
    } catch (error) {
      console.error('❌ 检查会员状态失败:', error);
      isMember.value = false;
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  /**
   * ✅ 清除缓存（登出时调用）
   */
  const clearCache = () => {
    console.log('🧹 清除会员状态缓存');
    isMember.value = null;
    loading.value = false;
  };
  
  /**
   * ✅ 重置状态（登录成功后调用）
   */
  const reset = () => {
    console.log('🔄 重置会员状态');
    isMember.value = null;
    loading.value = false;
  };
  
  /**
   * ✅ Pinia 的 $reset 方法（必须实现，否则 resetAllStores 会报错）
   */
  function $reset() {
    console.log('🔄 执行 Store $reset');
    isMember.value = null;
    loading.value = false;
  }
  
  return {
    isMember,
    loading,
    checkMemberStatus,
    clearCache,
    reset,
    $reset,  // ← 必须导出
  };
});
