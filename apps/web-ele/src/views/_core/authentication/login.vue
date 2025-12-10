<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import { computed, markRaw, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '#/store';
import { resetAuthState } from '#/api/request';
defineOptions({ name: 'Login' });
const route = useRoute();
const authStore = useAuthStore();
const formRef = ref();
const captchaToken = ref('');
const isSubmitting = ref(false);
// 页面加载时重置认证状态
onMounted(() => {
  resetAuthState();
  
  // 检测是否因为过期跳转
  if (route.query.expired === 'true') {
    ElMessage.warning('登录已过期，请重新登录');
  }
});
/**
 * 滑块验证成功回调
 */
async function handleCaptchaSuccess(result?: any) {
  // 生成验证码 token（格式：随机字符串_时间戳）
  const token = result?.token || `${Math.random().toString(36).substring(2)}_${Date.now()}`;
  captchaToken.value = token;
  
  const formApi = await formRef.value?.getFormApi();
  await formApi?.setValues({ captcha: true });
  await formApi?.validate(['captcha']);
}
/**
 * 提交登录表单
 */
async function handleLogin(formData: any) {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;
    // 检查验证码
    if (!captchaToken.value) {
      ElMessage.error('请先完成滑块验证');
      return;
    }
    // 提交登录请求
    const loginData = {
      username: formData.username,
      password: formData.password,
      captcha: captchaToken.value,
    };
    await authStore.authLogin(loginData);
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || error?.message || '登录失败';
    ElMessage.error(errorMsg);
    
    // 登录失败后重置验证码
    await resetCaptcha();
  } finally {
    isSubmitting.value = false;
  }
}
/**
 * 重置验证码状态
 */
async function resetCaptcha() {
  captchaToken.value = '';
  const formApi = await formRef.value?.getFormApi();
  await formApi?.setValues({ captcha: false });
}
/**
 * 表单配置
 */
const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: markRaw(SliderCaptcha),
      componentProps: {
        onSuccess: handleCaptchaSuccess,
      },
      defaultValue: false,
      fieldName: 'captcha',
      label: '滑动验证',
      rules: z.boolean().refine((val) => val === true, {
        message: $t('authentication.verifyRequiredTip'),
      }),
    },
  ];
});
</script>
<template>
  <AuthenticationLogin
    ref="formRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading || isSubmitting"
    :show-code-login="false"
    :show-forget-password="true"
    :show-qrcode-login="false"
    :show-register="true"
    :show-remember-me="true"
    :show-third-party-login="false"
    sub-title="🏍️基于SpringBoot的管理系统"
    title="摩托车骑行俱乐部"
    @submit="handleLogin"
  />
</template>
