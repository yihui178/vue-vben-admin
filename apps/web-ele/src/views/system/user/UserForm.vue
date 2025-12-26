<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { User } from './types';
import { ROLE_OPTIONS } from './types';
interface Props {
  visible: boolean;
  form: User;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [];
}>();
const internalFormRef = ref<FormInstance>();
const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});
// 监听对话框打开
watch(() => props.visible, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      internalFormRef.value?.clearValidate();
    }, 100);
  }
});
// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 30, message: '用户名长度在2-30个字符', trigger: 'blur' }
  ],
  password: [
    { 
      validator: (_rule: any, value: any, callback: any) => {
        if (!props.form.id) {
          if (!value) {
            callback(new Error('请输入密码'));
          } else if (value.length < 6 || value.length > 20) {
            callback(new Error('密码长度在6-20个字符'));
          } else {
            callback();
          }
        } else {
          if (value && (value.length < 6 || value.length > 20)) {
            callback(new Error('密码长度在6-20个字符'));
          } else {
            callback();
          }
        }
      },
      trigger: 'blur'
    }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年龄范围1-120', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
};
// 保存按钮点击事件
const handleSave = async () => {
  if (!internalFormRef.value) return;
  
  try {
    await internalFormRef.value.validate();
    emit('save');
  } catch (error) {
    // 验证失败，不做处理
  }
};
</script>
<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑用户' : '新增用户'"
    width="600px"
    align-center
    :close-on-click-modal="false"
  >
    <el-form 
      ref="internalFormRef"
      :model="form" 
      :rules="rules" 
      label-width="100px"
    >
      <el-form-item label="用户名" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入用户名（2-30个字符）"
          maxlength="30"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          :placeholder="form.id ? '不修改密码请留空' : '请输入密码（6-20个字符）'"
          maxlength="20"
          show-password
          clearable
        />
        <div v-if="form.id" class="text-xs text-gray-500 mt-1">
          留空则不修改密码
        </div>
      </el-form-item>
      <el-form-item label="年龄" prop="age">
        <el-input-number
          v-model="form.age"
          :min="1"
          :max="120"
          :step="1"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input 
          v-model="form.email" 
          placeholder="请输入邮箱"
          clearable
        />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select 
          v-model="form.role" 
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="item in ROLE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="localVisible = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleSave">
        <span class="i-mdi:check mr-1" />
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
<style scoped>
:deep(.el-form-item__content) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
