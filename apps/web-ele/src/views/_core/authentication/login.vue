<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { BasicOption } from '@vben/types';

import { computed, markRaw, ref } from 'vue';

import { AuthenticationLogin, SliderCaptcha, z } from '@vben/common-ui';
import { verifyCaptchaApi } from '#/api';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const formRef = ref();
const captchaToken = ref(''); // 创建一个独立的、非表单的 ref 来存储 token

// 验证通过时回调
async function handleCaptchaSuccess(result?: any) {
  const token =
    result?.token || Math.random().toString(36).substring(2) + Date.now();
  captchaToken.value = token;
  console.log('滑块验证成功，已设置 token:', token);

  const formApi = await formRef.value?.getFormApi();

  await formApi?.setValues({ captcha: true });
  await formApi?.validate(['captcha']);

  verifyCaptcha(token);
}

// 拦截表单提交，注入正确的 captcha token
async function handleLogin(formData: any) {
  const finalData = {
    ...formData,
    // 从本地 ref 获取 token，并覆盖表单中的 captcha 布尔值
    captcha: captchaToken.value,
  };

  await authStore.authLogin(finalData);
}

// 向后端发送验证码验证请求（统一走 API 模块）
async function verifyCaptcha(captchaToken: string) {
  try {
    const resp = await verifyCaptchaApi({ captcha: captchaToken });
    // requestClient 可能已将响应 data 解包，也可能保留标准结构
    const isOk = (resp as any)?.code === 0 || typeof resp === 'string';
    if (isOk) {
      console.log('前端验证码验证通过响应', resp);
    } else {
      console.error('前端验证码验证失败：', resp);
    }
  } catch (error) {
    console.error('前端验证码验证请求失败', error);
  }
}

const MOCK_USER_OPTIONS: BasicOption[] = [
  {
    label: 'Super',
    value: 'vben',
  },
  {
    label: 'Admin',
    value: 'admin',
  },
  {
    label: 'User',
    value: 'jack',
  },
];

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // {
    //   component: 'VbenSelect',
    //   componentProps: {
    //     options: MOCK_USER_OPTIONS,
    //     placeholder: $t('authentication.selectAccount'),
    //   },
    //   fieldName: 'selectAccount',
    //   label: $t('authentication.selectAccount'),
    //   rules: z
    //     .string()
    //     .min(1, { message: $t('authentication.selectAccount') })
    //     .optional()
    //     .default('vben'),
    // },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      dependencies: {
        trigger(values, form) {
          if (values.selectAccount) {
            const findUser = MOCK_USER_OPTIONS.find(
              (item) => item.value === values.selectAccount,
            );
            if (findUser) {
              form.setValues({
                password: '123456',
                username: findUser.value,
              });
            }
          }
        },
        triggerFields: ['selectAccount'],
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
      // 可见的滑块字段，其值为布尔类型
      component: markRaw(SliderCaptcha),
      fieldName: 'captcha',
      label: '验证', // 硬编码 label 以避免 i18n 警告
      rules: z.boolean().refine((val) => val === true, {
        message: $t('authentication.verifyRequiredTip'),
      }),
      defaultValue: false,
      componentProps: {
        onSuccess: handleCaptchaSuccess,
      },
    },
  ];
});
</script>
<!-- 
showCodeLogin?: boolean;        是否显示验证码登录
showForgetPassword?: boolean;   是否显示忘记密码
showQrcodeLogin?: boolean;      是否显示二维码登录
showRegister?: boolean;         是否显示注册按钮
showRememberMe?: boolean;       是否显示记住账号
showThirdPartyLogin?: boolean;  是否显示第三方登录
-->
<template>
  <AuthenticationLogin
    ref="formRef"
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="handleLogin"
    :show-code-login="false"
    :show-forget-password="true"
    :show-qrcode-login="false"
    :show-register="true"
    :show-remember-me="true"
    :show-third-party-login="false"
    sub-title="子标题"
    title="标题"
  />
</template>
<!-- 
{
  /**
   * @zh_CN 验证码登录路径
   */
  codeLoginPath?: string;
  /**
   * @zh_CN 忘记密码路径
   */
  forgetPasswordPath?: string;

  /**
   * @zh_CN 是否处于加载处理状态
   */
  loading?: boolean;

  /**
   * @zh_CN 二维码登录路径
   */
  qrCodeLoginPath?: string;

  /**
   * @zh_CN 注册路径
   */
  registerPath?: string;

  /**
   * @zh_CN 是否显示验证码登录
   */
  showCodeLogin?: boolean;
  /**
   * @zh_CN 是否显示忘记密码
   */
  showForgetPassword?: boolean;

  /**
   * @zh_CN 是否显示二维码登录
   */
  showQrcodeLogin?: boolean;

  /**
   * @zh_CN 是否显示注册按钮
   */
  showRegister?: boolean;

  /**
   * @zh_CN 是否显示记住账号
   */
  showRememberMe?: boolean;

  /**
   * @zh_CN 是否显示第三方登录
   */
  showThirdPartyLogin?: boolean;

  /**
   * @zh_CN 登录框子标题
   */
  subTitle?: string;

  /**
   * @zh_CN 登录框标题
   */
  title?: string;

} -->
