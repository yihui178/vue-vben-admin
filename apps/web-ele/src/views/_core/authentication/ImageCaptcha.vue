<script lang="ts" setup>
import { defineEmits, ref, watch } from 'vue';

const emit = defineEmits(['update:modelValue']);
const captchaInput = ref('');
const captchaUrl = ref(getCaptchaUrl());
function getCaptchaUrl() {
  return `/captcha.jpg?_=${Date.now()}`;
}
function refreshCaptcha() {
  captchaUrl.value = getCaptchaUrl();
  captchaInput.value = '';
  emit('update:modelValue', '');
}
function onInput() {
  emit('update:modelValue', captchaInput.value);
}
watch(captchaInput, (val) => {
  emit('update:modelValue', val);
});
</script>

<template>
  <div class="image-captcha">
    <div class="captcha-row">
      <input
        v-model="captchaInput"
        :placeholder="$t('authentication.captcha')"
        class="captcha-input"
        @keyup.enter="onInput"
      />
      <img
        :src="captchaUrl"
        alt="captcha"
        class="captcha-img"
        @click="refreshCaptcha"
      />
      <button type="button" class="captcha-refresh" @click="refreshCaptcha">
        {{ $t('authentication.refreshCaptcha') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.image-captcha {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  border-radius: 6px;
}

.captcha-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.captcha-input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 30px;
  padding: 19px 12px;
  margin-right: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.captcha-img {
  width: 100px;
  height: 36px;
  margin-right: 15px;
  margin-left: auto;
  cursor: pointer;
  border: 1px solid #eee;
  border-radius: 4px;
}

.captcha-refresh {
  padding: 0 4px;
  margin-right: 15px;
  margin-left: auto;
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
  background: none;
  border: none;
}
</style>
