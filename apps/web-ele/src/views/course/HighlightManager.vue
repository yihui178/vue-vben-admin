<script setup lang="ts">
import { computed } from 'vue';
import type { HighlightItem } from './useCourse';
interface Props {
  visible: boolean;
  highlightOptions: HighlightItem[];
  newHighlightName: string;
  editVisible: boolean;
  editingHighlight: HighlightItem;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'update:newHighlightName': [value: string];
  'update:editVisible': [value: boolean];
  'add': [];
  'edit': [item: HighlightItem];
  'save-edit': [];
  'delete': [id: number];
}>();
const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});
const localNewName = computed({
  get: () => props.newHighlightName,
  set: (val: string) => emit('update:newHighlightName', val),
});
const localEditVisible = computed({
  get: () => props.editVisible,
  set: (val: boolean) => emit('update:editVisible', val),
});
</script>
<template>
  <div>
    <!-- 亮点管理主弹窗 -->
    <el-dialog
      v-model="localVisible"
      title="管理课程亮点"
      width="640px"
      class="highlight-dialog"
      align-center
    >
      <div class="highlight-header">
        <div class="title">亮点维护</div>
        <div class="desc">在这里可以新增、编辑或删除课程亮点。</div>
      </div>
      <!-- 新增亮点 -->
      <div class="highlight-add">
        <el-input
          v-model="localNewName"
          placeholder="请输入新的亮点名称（最多20个字符）"
          maxlength="20"
          show-word-limit
          clearable
          @keyup.enter="emit('add')"
        />
        <el-button type="primary" @click="emit('add')">新增</el-button>
      </div>
      <!-- 亮点列表 -->
      <el-table
        :data="highlightOptions"
        border
        size="small"
        style="width: 100%; margin-top: 12px"
        max-height="400"
      >
        <el-table-column label="亮点名称" prop="name" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="emit('edit', row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="emit('delete', row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="localVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    <!-- 编辑亮点弹窗 -->
    <el-dialog
      v-model="localEditVisible"
      title="编辑亮点"
      width="400px"
      align-center
    >
      <el-input
        v-model="editingHighlight.name"
        placeholder="请输入亮点名称（最多20个字符）"
        maxlength="20"
        show-word-limit
      />
      <template #footer>
        <el-button @click="localEditVisible = false">取消</el-button>
        <el-button type="primary" @click="emit('save-edit')">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.highlight-dialog :deep(.el-dialog__body) {
  padding: 18px 24px 10px;
}
.highlight-header .title {
  font-size: 15px;
  font-weight: 600;
}
.highlight-header .desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.highlight-add {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
