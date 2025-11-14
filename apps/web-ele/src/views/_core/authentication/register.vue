<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref } from 'vue';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
defineOptions({ name: 'Register' });

const loading = ref(false);
// ！！关键：配置你的后端地址（必须替换为实际地址，如http://localhost:8080）
const backendUrl = 'http://localhost:8080';

const formSchema = computed((): VbenFormSchema[] => {
  // 表单配置完全不变，沿用你的原有代码
  return [
    {
      component: 'VbenInput',
      componentProps: { placeholder: $t('authentication.usernameTip') },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      renderComponentContent() {
        return { strengthText: () => $t('authentication.passwordStrength') };
      },
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: { placeholder: $t('authentication.confirmPassword') },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: $t('authentication.passwordTip') })
            .min(1, { message: $t('authentication.passwordTip') })
            .refine((value) => value === password, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
    },
    {
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('authentication.agree'),
            h(
              'a',
              { class: 'vben-link ml-1 ', href: '' },
              `${$t('authentication.privacyPolicy')} & ${$t('authentication.terms')}`,
            ),
          ]),
      }),
      rules: z
        .boolean()
        .refine((value) => !!value, { message: $t('authentication.agreeTip') }),
    },
  ];
});

// ！！核心修改：用 fetch 发请求，无任何外部依赖
async function handleSubmit(value: Recordable<any>) {
  console.log('register submit:', value);
  loading.value = true; // 开启加载状态，防止重复点击

  try {
    // 1. 用 fetch 发起 POST 请求（浏览器原生API，无需安装包）
    const response = await fetch(`${backendUrl}/auth/register`, {
      method: 'POST', // 请求方法：POST
      headers: {
        'Content-Type': 'application/json', // 告诉后端数据是 JSON 格式
      },
      body: JSON.stringify(value), // 把前端表单数据转成 JSON 字符串
    });

    // 2. 解析后端返回的 JSON 数据
    const resData = await response.json();

    // 3. 处理结果（匹配后端 HttpResult 格式：code=0 为成功）
    if (resData.code === 0) {
      // ElMessage.success(resData.msg || '注册成功！请去登录');
      ElMessage.success('注册成功，请登录');
      // 可选：跳登录页（取消注释即可，无依赖）
      // window.location.href = '/login';
      router.push('/auth/login');
    } else {
      ElMessage.success(`注册失败：${resData.msg || '请检查输入信息'}`);
    }
  } catch (error: any) {
    // 4. 处理网络错误（如后端没启动、地址错）
    console.error('注册请求失败:', error);
    ElMessage.success(`请求失败：${error.message || '后端服务未启动或网络异常'}`);
  } finally {
    // 5. 无论成功/失败，都关闭加载状态
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
