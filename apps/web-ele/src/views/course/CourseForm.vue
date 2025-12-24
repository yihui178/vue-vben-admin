<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface Props {
  visible: boolean;
  form: any;
  categoryOptions: any[];
  highlightOptions: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [];
  'manage-highlights': [];
}>();

const formRef = ref<FormInstance>();

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const rules: FormRules = {
  courseName: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 20, message: '课程名称长度在2-20个字符', trigger: 'blur' },
  ],
  category: [
    { required: true, message: '请选择课程分类', trigger: 'change' },
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' },
  ],
  online: [
    { required: true, message: '请选择授课方式', trigger: 'change' },
  ],
};

defineExpose({ formRef });
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑课程' : '新增课程'"
    width="900px"
    top="5vh"
    align-center
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <!-- ==================== 基础信息 ==================== -->
      <div class="form-section">
        <div class="section-title">
          <span class="i-mdi:information mr-2" />
          基础信息
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="courseName">
              <el-input
                v-model="form.courseName"
                placeholder="请输入课程名称"
                maxlength="20"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="课程分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入课程描述"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </div>

      <el-divider />

      <!-- ==================== 课程设置 ==================== -->
      <div class="form-section">
        <div class="section-title">
          <span class="i-mdi:cog mr-2" />
          课程设置
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="授课方式" prop="online">
              <el-radio-group v-model="form.online">
                <el-radio :label="false">
                  <span class="i-mdi:school mr-1" />
                  线下实操
                </el-radio>
                <el-radio :label="true">
                  <span class="i-mdi:laptop mr-1" />
                  线上课程
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="课程时长">
              <el-input
                v-model="form.duration"
                placeholder="例如：2小时"
              >
                <template #prefix>
                  <span class="i-mdi:timer-outline" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上课时间">
              <el-input
                v-model="form.scheduleTime"
                placeholder="例如：每周三 19:00-21:00"
              >
                <template #prefix>
                  <span class="i-mdi:clock-outline" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="讲师/教练">
              <el-input
                v-model="form.instructor"
                placeholder="请输入讲师姓名"
              >
                <template #prefix>
                  <span class="i-mdi:account-tie" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="上课地点">
          <el-input
            v-model="form.location"
            placeholder="请输入上课地点"
          >
            <template #prefix>
              <span class="i-mdi:map-marker" />
            </template>
          </el-input>
        </el-form-item>
      </div>

      <el-divider />

      <!-- ==================== 报名设置 ==================== -->
      <div class="form-section">
        <div class="section-title">
          <span class="i-mdi:account-group mr-2" />
          报名设置（用于自动创建培训活动）
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大报名人数">
              <el-input-number
                v-model="form.maxStudents"
                :min="0"
                :max="999"
                style="width: 100%"
                placeholder="0表示不限制"
              />
              <div class="text-xs text-gray-500 mt-1">
                <span class="i-mdi:information-outline mr-1" />
                设置为 0 表示不限制报名人数
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input
                v-model="form.contactPhone"
                placeholder="请输入联系电话"
                maxlength="11"
              >
                <template #prefix>
                  <span class="i-mdi:phone" />
                </template>
              </el-input>
              <div class="text-xs text-gray-500 mt-1">
                <span class="i-mdi:information-outline mr-1" />
                用于学员咨询和联系
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <!-- ==================== 课程亮点 ==================== -->
      <div class="form-section">
        <div class="section-title">
          <span class="i-mdi:star mr-2" />
          课程亮点
        </div>

        <el-form-item label="选择亮点">
          <el-select
            v-model="form.highlightIds"
            multiple
            placeholder="请选择课程亮点（可多选）"
            style="width: 100%"
          >
            <el-option
              v-for="item in highlightOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="flex items-center gap-2">
                <span class="i-mdi:check-circle text-success" />
                <span>{{ item.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" link @click="emit('manage-highlights')">
            <span class="i-mdi:cog mr-1" />
            管理亮点选项
          </el-button>
          <span class="text-xs text-gray-500 ml-2">
            点击可新增、编辑或删除亮点选项
          </span>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="localVisible = false">取消</el-button>
      <el-button type="primary" @click="emit('save')">
        <span class="i-mdi:check mr-1" />
        保存课程
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

.form-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
