<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Activity } from './types';
import { ACTIVITY_TYPE_OPTIONS } from './types';

interface Props {
  visible: boolean;
  form: Activity;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [];
}>();

// ✅ 在组件内部创建 formRef
const formRef = ref<FormInstance>();

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

// ==================== 表单验证规则 ====================
const rules: FormRules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    {
      min: 2,
      max: 100,
      message: '活动名称长度在2-100个字符',
      trigger: 'blur',
    },
  ],
  activityType: [
    { required: true, message: '请选择活动类型', trigger: 'change' },
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' },
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
  ],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
};

// ✅ 暴露 formRef 给父组件
defineExpose({
  formRef,
});
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑活动' : '新增活动'"
    width="700px"
    align-center
  >
    <!-- ✅ 正确的 ref 绑定方式 -->
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="活动名称" prop="activityName">
        <el-input
          v-model="form.activityName"
          placeholder="请输入活动名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="活动类型" prop="activityType">
            <el-select v-model="form.activityType" style="width: 100%">
              <el-option
                v-for="item in ACTIVITY_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              placeholder="选择开始时间"
              style="width: 100%"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
            <!-- ✅ 改为 YYYY-MM-DDTHH:mm:ss -->
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="活动地点" prop="location">
        <el-input
          v-model="form.location"
          placeholder="请输入活动地点"
          maxlength="200"
        />
      </el-form-item>

      <el-form-item label="活动描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入活动描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="最大人数">
            <el-input-number
              v-model="form.maxParticipants"
              :min="0"
              :max="1000"
              style="width: 100%"
              placeholder="0表示不限制"
            />
            <div class="text-xs text-gray-500 mt-1">0 表示不限制人数</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        <span class="text-sm text-gray-500">联系方式（选填）</span>
      </el-divider>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系人">
            <el-input
              v-model="form.contactPerson"
              placeholder="请输入联系人"
              maxlength="50"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input
              v-model="form.contactPhone"
              placeholder="请输入联系电话"
              maxlength="11"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="localVisible = false"> 取消 </el-button>
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
