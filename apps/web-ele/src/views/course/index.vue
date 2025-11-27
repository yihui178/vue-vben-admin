<script setup lang="ts">
import { useAccess } from '@vben/access';
import CourseForm from './CourseForm.vue';
import HighlightManager from './HighlightManager.vue';
import { useCourse } from './useCourse';
const { hasAccessByCodes } = useAccess();
const {
  // 课程列表状态
  loading,
  courseList,
  total,
  page,
  pageSize,
  keyword,
  categoryOptions,
  // 课程表单状态
  formVisible,
  formRef,
  form,
  // 亮点状态
  highlightOptions,
  highlightMap,
  highlightManageVisible,
  highlightEditVisible,
  editingHighlight,
  newHighlightName,
  // 课程方法
  fetchCourses,
  openAddDialog,
  openEditDialog,
  saveCourse,
  deleteCourse,
  // 亮点方法
  openHighlightManager,
  openEditHighlight,
  saveNewHighlight,
  saveEditedHighlight,
  deleteHighlight,
} = useCourse();
</script>
<template>
  <div class="p-4">
    <!-- 搜索与操作 -->
    <div class="flex items-center justify-between mb-4">
      <el-input
        v-model="keyword"
        placeholder="请输入课程名称或描述"
        clearable
        class="w-1/3"
        @clear="fetchCourses"
        @keyup.enter="fetchCourses"
      />
      <el-button
        v-if="hasAccessByCodes(['course:add'])"
        type="primary"
        @click="openAddDialog"
      >
        新增课程
      </el-button>
    </div>
    <!-- 课程列表 -->
    <el-table :data="courseList" v-loading="loading" border style="width: 100%">
      <el-table-column prop="courseName" label="课程名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column
        prop="online"
        label="是否线上课程"
        width="120"
        :formatter="(r: any) => (r.online ? '是' : '否')"
      />
      <el-table-column label="亮点">
        <template #default="{ row }">
          <el-tag
            v-for="id in row.highlightIds"
            :key="id"
            type="success"
            class="mr-1"
          >
            {{ highlightMap[id] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-if="hasAccessByCodes(['course:edit'])"
            size="small"
            @click="openEditDialog(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasAccessByCodes(['course:delete'])"
            type="danger"
            size="small"
            @click="deleteCourse(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => { page = p; fetchCourses(); }"
      />
    </div>
    <!-- 课程表单弹窗 -->
    <CourseForm
      v-if="formVisible"
      :visible="formVisible"
      :form="form"
      :form-ref="formRef"
      :category-options="categoryOptions"
      :highlight-options="highlightOptions"
      @update:visible="formVisible = $event"
      @save="saveCourse"
      @manage-highlights="openHighlightManager"
    />
    <!-- 亮点管理弹窗 -->
    <HighlightManager
      :visible="highlightManageVisible"
      :highlight-options="highlightOptions"
      :new-highlight-name="newHighlightName"
      :edit-visible="highlightEditVisible"
      :editing-highlight="editingHighlight"
      @update:visible="highlightManageVisible = $event"
      @update:newHighlightName="newHighlightName = $event"
      @update:editVisible="highlightEditVisible = $event"
      @add="saveNewHighlight"
      @edit="openEditHighlight"
      @save-edit="saveEditedHighlight"
      @delete="deleteHighlight"
    />
  </div>
</template>
<style scoped>
/* 如果需要额外样式可以在这里添加 */
</style>
