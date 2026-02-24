<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAccess } from '@vben/access';
import { ElMessage } from 'element-plus';
import { requestClient } from '#/api/request';
import CourseForm from './CourseForm.vue';
import HighlightManager from './HighlightManager.vue';
import { useCourse } from './useCourse';
import { useUserStore } from '#/store/member';

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const isAdmin = computed(() => hasAccessByCodes(['course:add']));
const userStore = useUserStore();
const isMember = computed(() => userStore.isMember || isAdmin.value);


const {
  loading,
  courseList,
  total,
  page,
  pageSize,
  keyword,
  categoryOptions,
  formVisible,
  formRef,
  form,
  highlightOptions,
  highlightMap,
  highlightManageVisible,
  highlightEditVisible,
  editingHighlight,
  newHighlightName,
  fetchCourses,
  openAddDialog,
  openEditDialog,
  saveCourse,
  deleteCourse,
  openHighlightManager,
  openEditHighlight,
  saveNewHighlight,
  saveEditedHighlight,
  deleteHighlight,
} = useCourse();

// ✅ 修改后：只跳转到活动页面，不传递课程信息
const goToEnroll = () => {
  router.push({
    path: '/demos/activity'
  });
  ElMessage.info('已跳转到活动报名页面，请选择对应的培训活动进行报名');
};

const detailVisible = ref(false);
const selectedCourse = ref<any>(null);

const viewDetail = (course: any) => {
  selectedCourse.value = course;
  detailVisible.value = true;
};


</script>

<template>
  <div class="p-4">
    <!-- 页面标题 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2">培训课程</h2>
      <p class="text-sm text-gray-500">
        {{ isAdmin ? '管理俱乐部培训课程' : '查看课程详情，点击前往报名跳转到活动页面' }}
      </p>
      
      <!-- 非会员提示 -->
      <el-alert
        v-if="!isMember && !isAdmin"
        class="mt-2"
        type="warning"
        :closable="false"
      >
        只有会员才能报名，请联系管理员创建会员档案
      </el-alert>
    </div>

    <!-- 搜索与操作 -->
    <div class="flex items-center justify-between mb-4">
      <el-input
        v-model="keyword"
        placeholder="搜索课程名称、描述..."
        clearable
        class="w-1/3"
        @clear="fetchCourses"
        @keyup.enter="fetchCourses"
      >
        <template #prefix>
          <span class="i-mdi:magnify" />
        </template>
      </el-input>
      
      <el-button
        v-if="isAdmin"
        type="primary"
        @click="openAddDialog"
      >
        <span class="i-mdi:plus mr-1" />
        新增课程
      </el-button>
    </div>

    <!-- 课程表格 -->
    <el-table 
      :data="courseList" 
      v-loading="loading" 
      border 
      stripe
      style="width: 100%"
    >
      <el-table-column 
        type="index" 
        label="序号" 
        width="60" 
        align="center" 
      />
      
      <el-table-column 
        prop="courseName" 
        label="课程名称" 
        width="180"
        fixed="left"
      />
      
      <el-table-column 
        prop="category" 
        label="分类" 
        width="110" 
        align="center"
      >
        <template #default="{ row }">
          <el-tag size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="description" 
        label="课程内容" 
        min-width="200" 
        show-overflow-tooltip
      />
      
      <el-table-column 
        prop="scheduleTime" 
        label="上课时间" 
        width="160"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="flex items-center gap-1">
            <span class="i-mdi:clock-outline text-primary" />
            <span>{{ row.scheduleTime || '待定' }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="location" 
        label="上课地点" 
        width="140"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="flex items-center gap-1">
            <span class="i-mdi:map-marker text-primary" />
            <span>{{ row.location || '待定' }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="instructor" 
        label="讲师" 
        width="100"
      >
        <template #default="{ row }">
          <span>{{ row.instructor || '专业教练' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="duration" 
        label="时长" 
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <span>{{ row.duration || '2小时' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="online" 
        label="授课方式" 
        width="100" 
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'warning'" size="small">
            {{ row.online ? '线上' : '线下' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column 
        label="课程亮点" 
        width="220"
      >
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag
              v-for="id in row.highlightIds?.slice(0, 3)"
              :key="id"
              type="success"
              size="small"
              effect="plain"
            >
              {{ highlightMap[id] }}
            </el-tag>
            <el-tag 
              v-if="row.highlightIds?.length > 3"
              size="small"
              type="info"
            >
              +{{ row.highlightIds.length - 3 }}
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column 
        label="操作" 
        width="200" 
        align="center" 
        fixed="right"
      >
        <template #default="{ row }">
          <!-- 管理员 -->
          <template v-if="isAdmin">
            <el-button
              type="primary"
              size="small"
              text
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="deleteCourse(row)"
            >
              删除
            </el-button>
            <el-button
              type="info"
              size="small"
              text
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
          
          <!-- 会员 -->
          <template v-else-if="isMember">
            <el-button
              type="info"
              size="small"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="goToEnroll"
            >
              <span class="i-mdi:account-plus mr-1" />
              前往报名
            </el-button>
          </template>
          
          <!-- 普通用户 -->
          <template v-else>
            <el-tag type="info" size="small">仅供浏览</el-tag>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-center">
      <el-pagination
        background
        layout="prev, pager, next, total, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => { page = p; fetchCourses(); }"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailVisible" 
      :title="selectedCourse?.courseName" 
      width="700px"
    >
      <div v-if="selectedCourse">
        
        <!-- 课程标签 -->
        <div class="mb-4 flex gap-2">
          <el-tag type="primary">{{ selectedCourse.category }}</el-tag>
          <el-tag :type="selectedCourse.online ? 'success' : 'warning'">
            {{ selectedCourse.online ? '线上课程' : '线下实操' }}
          </el-tag>
        </div>

        <!-- 课程描述 -->
        <div class="mb-4">
          <h4 class="font-semibold mb-2 text-base">课程简介</h4>
          <p class="text-gray-700 leading-relaxed">{{ selectedCourse.description }}</p>
        </div>
        
        <el-divider />
        
        <!-- 课程详细信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="课程分类">
            {{ selectedCourse.category }}
          </el-descriptions-item>
          
          <el-descriptions-item label="授课方式">
            {{ selectedCourse.online ? '线上授课' : '线下实操' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="上课时间">
            {{ selectedCourse.scheduleTime || '待定' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="课程时长">
            {{ selectedCourse.duration || '2小时/次' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="上课地点">
            {{ selectedCourse.location || '待定' }}
          </el-descriptions-item>
          
          <el-descriptions-item label="讲师/教练">
            {{ selectedCourse.instructor || '专业教练' }}
          </el-descriptions-item>

          <el-descriptions-item label="报名人数限制">
            <el-tag :type="selectedCourse.maxStudents === 0 ? 'success' : 'warning'">
              {{ selectedCourse.maxStudents === 0 ? '不限人数' : `限${selectedCourse.maxStudents}人` }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="联系电话">
            <strong class="text-primary">{{ selectedCourse.contactPhone || '暂无' }}</strong>
          </el-descriptions-item>
          
          <el-descriptions-item label="课程亮点" :span="2">
            <div class="flex gap-2 flex-wrap">
              <el-tag
                v-for="id in selectedCourse.highlightIds"
                :key="id"
                type="success"
              >
                {{ highlightMap[id] }}
              </el-tag>
              <span v-if="!selectedCourse.highlightIds || selectedCourse.highlightIds.length === 0" class="text-gray-400">
                暂无
              </span>
            </div>
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 报名提示 -->
        <el-alert class="mt-4" type="info" :closable="false" v-if="isMember && !isAdmin">
          <template #title>
            <div class="font-semibold">报名方式</div>
          </template>
          <div class="mt-2 text-sm">
            点击下方"前往报名"按钮跳转到活动页面，在活动列表中找到对应的培训活动进行报名
          </div>
        </el-alert>
      </div>
      
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button 
          v-if="isMember && !isAdmin"
          type="primary" 
          @click="goToEnroll"
        >
          <span class="i-mdi:calendar-check mr-1" />
          前往报名
        </el-button>
      </template>
    </el-dialog>

    <!-- 课程表单（管理员用） -->
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

    <!-- 亮点管理（管理员用） -->
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
:deep(.el-table) {
  font-size: 14px;
}
</style>
