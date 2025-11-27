<script setup lang="ts">
import { computed } from 'vue';
import type { CourseForm, HighlightItem } from './useCourse';
interface Props {
  visible: boolean;
  form: CourseForm;
  formRef: any;
  categoryOptions: string[];
  highlightOptions: HighlightItem[];
}
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [];
  'manage-highlights': [];
}>();
const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});
</script>
<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑课程' : '新增课程'"
    width="720px"
    class="course-dialog"
    align-center
  >
    <el-form
      :ref="formRef"
      :model="form"
      label-position="top"
      class="course-form"
    >
      <!-- 第一行：课程名称 + 分类 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="课程名称" required>
            <el-input v-model="form.courseName" maxlength="20" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="课程分类" required>
            <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="c in categoryOptions"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 第二行：是否线上课程 -->
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="是否线上课程" required>
            <el-switch v-model="form.online" />
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 描述 -->
      <el-form-item label="课程描述" required>
        <el-input
          type="textarea"
          v-model="form.description"
          :rows="3"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <!-- 课程亮点 + 管理入口 -->
      <el-form-item label="课程亮点">
        <div class="flex items-center w-full gap-3">
          <el-select
            v-model="form.highlightIds"
            multiple
            placeholder="请选择亮点"
            class="flex-1"
          >
            <el-option
              v-for="item in highlightOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-button type="primary" text @click="emit('manage-highlights')">
            管理亮点
          </el-button>
        </div>
        <div class="form-tip">
          可以在「管理亮点」中新增 / 编辑 / 删除亮点。
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="localVisible = false">取消</el-button>
        <el-button type="primary" @click="emit('save')">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<style scoped>
.course-dialog :deep(.el-dialog__body) {
  padding: 18px 24px 8px;
}
.course-form {
  margin-top: 4px;
}
.course-form .el-form-item {
  margin-bottom: 14px;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
