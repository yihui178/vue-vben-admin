<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Member } from './types';
import { requestClient } from '#/api/request';
import { ElMessage } from 'element-plus';

interface Props {
  visible: boolean;
  form: Member;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [];
}>();

const formRef = ref<FormInstance>();

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const userList = ref<Array<{ id: number; name: string; email: string }>>([]);
const loadingUsers = ref(false);

// 获取所有用户
const fetchUsers = async () => {
  loadingUsers.value = true;
  try {
    const res = await requestClient.get('/user/list-for-member');
    
    // 处理不同的响应格式
    let data = res;
    if (res?.data) {
      data = res.data;
      
      // 如果还有嵌套的 data
      if (data?.data) {
        data = data.data;
      }
    }
    
    // 确保是数组
    userList.value = Array.isArray(data) ? data : [];
    
    if (userList.value.length === 0) {
      ElMessage.warning('没有可添加的用户，所有用户都已是会员');
    } else {
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loadingUsers.value = false;
  }
};

// 监听对话框打开
watch(
  () => props.visible,
  (newVal, oldVal) => {
    
    if (newVal && !props.form.id) {
      fetchUsers();
    } else {
    }
  },
  { immediate: true } // 添加 immediate 选项，组件挂载时立即执行
);

// 选择用户后，自动填充姓名
const handleUserChange = (userId: number) => {
  const selectedUser = userList.value.find(u => u.id === userId);
  
  if (selectedUser) {
    props.form.memberName = selectedUser.name;
  }
};

const rules: FormRules = {
  userId: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  memberName: [
    { required: true, message: '请输入会员姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在2-50个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  joinDate: [
    { required: true, message: '请选择加入日期', trigger: 'change' }
  ]
};

defineExpose({
  formRef,
});
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑会员' : '新增会员'"
    width="800px"
    align-center
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <!-- 新增时选择用户 -->
      <el-form-item 
        v-if="!form.id" 
        label="选择用户" 
        prop="userId"
      >
        <el-select
          v-model="form.userId"
          placeholder="请选择要添加为会员的用户"
          filterable
          style="width: 100%"
          :loading="loadingUsers"
          @change="handleUserChange"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="`${user.name} (${user.email})`"
            :value="user.id"
          />
        </el-select>
        <div class="text-xs text-gray-500 mt-1">
          当前可选用户: {{ userList.length }} 个
          <span v-if="loadingUsers">(加载中...)</span>
        </div>
      </el-form-item>

      <!-- 编辑时显示用户ID（只读） -->
      <el-form-item v-else label="用户ID">
        <el-input :model-value="form.userId" disabled />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="会员姓名" prop="memberName">
            <el-input
              v-model="form.memberName"
              placeholder="请输入会员姓名"
              maxlength="50"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="身份证号">
            <el-input
              v-model="form.idCard"
              placeholder="请输入身份证号"
              maxlength="18"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="加入日期" prop="joinDate">
            <el-date-picker
              v-model="form.joinDate"
              type="date"
              placeholder="选择加入日期"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span class="text-sm text-gray-500">车辆信息（选填）</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="摩托车品牌">
            <el-input
              v-model="form.motorcycleBrand"
              placeholder="请输入摩托车品牌"
              maxlength="50"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="摩托车型号">
            <el-input
              v-model="form.motorcycleModel"
              placeholder="请输入摩托车型号"
              maxlength="50"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="车牌号">
            <el-input
              v-model="form.plateNumber"
              placeholder="请输入车牌号"
              maxlength="20"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="联系地址">
        <el-input
          v-model="form.address"
          placeholder="请输入联系地址"
          maxlength="200"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="localVisible = false">取消</el-button>
      <el-button type="primary" @click="emit('save')">
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
