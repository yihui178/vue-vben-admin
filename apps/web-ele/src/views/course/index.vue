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
  // 🔥 新增方法
  enrollCourse,
  viewCourseDetail,
} = useCourse();
</script>
<template>
  <div class="p-4">
    <!-- 🔥 添加页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2">培训课程</h2>
      <p class="text-sm text-gray-500">
        {{ hasAccessByCodes(['course:add']) ? '管理俱乐部所有培训课程' : '浏览并报名参加培训课程' }}
      </p>
    </div>
    <!-- 搜索与操作 -->
    <div class="flex items-center justify-between mb-4">
      <el-input
        v-model="keyword"
        placeholder="搜索课程名称或描述"
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
      <el-table-column prop="courseName" label="课程名称" width="200"/>
      <el-table-column prop="category" label="分类" width="110" align="center" />
      <el-table-column prop="description" label="课程描述" show-overflow-tooltip />
      
      <el-table-column prop="online" label="授课方式" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'primary'" size="small">
            {{ row.online ? '线上' : '线下' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="课程亮点" width="280">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="id in row.highlightIds"
              :key="id"
              type="success"
              size="small"
              effect="plain"
            >
              {{ highlightMap[id] }}
            </el-tag>
            <span v-if="!row.highlightIds?.length" class="text-gray-400 text-sm">
              暂无亮点
            </span>
          </div>
        </template>
      </el-table-column>
      <!-- 🔥 修改操作列：根据角色显示不同按钮 -->
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <!-- 管理员按钮（有编辑/删除权限） -->
          <template v-if="hasAccessByCodes(['course:edit', 'course:delete'])">
            <el-button
              v-if="hasAccessByCodes(['course:edit'])"
              type="primary"
              link
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasAccessByCodes(['course:delete'])"
              type="danger"
              link
              size="small"
              @click="deleteCourse(row)"
            >
              删除
            </el-button>
          </template>
          
          <!-- 🔥 普通用户按钮（只有查看权限） -->
          <template v-else>
            <el-button
              type="primary"
              size="small"
              @click="enrollCourse(row)"
            >
              我要报名
            </el-button>
            <el-button
              type="info"
              size="small"
              link
              @click="viewCourseDetail(row)"
            >
              查看详情
            </el-button>
          </template>
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
/* 自定义样式 */
</style>
