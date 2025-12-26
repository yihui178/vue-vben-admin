<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // ✅ 添加 useRoute
import { useAccess } from '@vben/access';
import { ElMessage } from 'element-plus';
import { requestClient } from '#/api/request';
import ActivityForm from './ActivityForm.vue';
import EnrollmentList from './EnrollmentList.vue';
import { useActivity } from './useActivity';
import { useUserStore } from '#/store/member';

const router = useRouter();
const route = useRoute(); // ✅ 获取路由参数

const { hasAccessByCodes } = useAccess();
const isAdmin = computed(() => hasAccessByCodes(['activity:add']));

const userStore = useUserStore();
const isMember = computed(() => userStore.isMember || isAdmin.value);


const {
  loading,
  activityList,
  total,
  page,
  pageSize,
  keyword,
  formVisible,
  activityFormRef,
  form,
  enrollmentVisible,
  enrollmentLoading,
  enrollmentList,
  currentActivity,
  fetchActivities,
  resetSearch,
  openAddDialog,
  editActivity,
  saveActivity,
  deleteActivity,
  viewEnrollments,
  reviewEnrollment,
  getActivityTypeTag,
  getEnrollmentStatusTag,
  getEnrollmentStatusText,
} = useActivity();

// 检查会员状态
onMounted(async () => {
  await userStore.checkMemberStatus();
});

// ==================== 报名功能 ====================
const enrollDialogVisible = ref(false);
const enrollForm = ref({
  activityId: 0,
  memberId: null,
  memberName: '',
  memberPhone: '',
  remark: '',
  // 新增字段
  enrollmentType: 'activity', // training | activity
  courseId: null as number | null,
  courseName: '',
});

// 修改后的打开报名对话框
const openEnrollDialog = (activity: any) => {
  
  if (!isMember.value && !isAdmin.value) {
    ElMessage.warning('只有会员才能报名活动');
    return;
  }

  enrollForm.value = {
    activityId: activity.id,
    memberId: null,
    memberName: '',
    memberPhone: '',
    remark: '',
    // 重置为普通活动
    enrollmentType: 'activity',
    courseId: null,
    courseName: '',
  };

  enrollDialogVisible.value = true;
};

// 修改后的提交报名
const submitEnroll = async () => {
  if (!enrollForm.value.memberName.trim()) {
    ElMessage.warning('请输入姓名');
    return;
  }
  if (!enrollForm.value.memberPhone.trim()) {
    ElMessage.warning('请输入联系电话');
    return;
  }
  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(enrollForm.value.memberPhone)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }
  try {
    await requestClient.post('/enrollment/enroll', enrollForm.value);
    
    // 成功后的提示
    const successMsg = enrollForm.value.enrollmentType === 'training'
      ? '课程报名成功，请等待审核'
      : '报名成功，请等待审核';
    
    ElMessage.success(successMsg);
    enrollDialogVisible.value = false;
    fetchActivities();
    
    // 清除 URL 参数
    if (route.query.type) {
      router.replace({ query: {} });
    }
  } catch (error: any) {
    console.error('报名失败:', error);
  }
};

const canEnroll = (activity: any) => {
  if (activity.maxParticipants === 0) return true;
  return activity.currentParticipants < activity.maxParticipants;
};


</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <p class="text-sm text-gray-500">
        发布和管理俱乐部活动，包括骑行、聚会、培训、比赛等
      </p>
      
      <el-alert
        v-if="!isMember && !isAdmin"
        class="mt-2"
        title="温馨提示"
        type="info"
        :closable="false"
      >
        您是普通用户，只能浏览。请联系管理员为您创建会员档案后即可报名活动！
      </el-alert>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <el-input
          v-model="keyword"
          placeholder="搜索活动名称、地点..."
          clearable
          style="width: 300px"
          @clear="fetchActivities"
          @keyup.enter="fetchActivities"
        >
          <template #prefix>
            <span class="i-mdi:magnify" />
          </template>
        </el-input>
        <el-button type="primary" @click="fetchActivities">
          <span class="i-mdi:magnify mr-1" />搜索
        </el-button>
        <el-button @click="resetSearch">
          <span class="i-mdi:refresh mr-1" />重置
        </el-button>
      </div>
      <div class="flex items-center gap-3">
        <el-button v-if="isAdmin" type="primary" @click="openAddDialog">
          <span class="i-mdi:plus mr-1" />发布活动
        </el-button>
      </div>
    </div>

    <!-- 活动列表 -->
    <el-table :data="activityList" v-loading="loading" border stripe>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="activityName" label="活动名称" width="200" fixed="left" show-overflow-tooltip />
      <el-table-column prop="activityType" label="活动类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getActivityTypeTag(row.activityType)" size="small">
            {{ row.activityType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="活动时间" width="180" align="center">
        <template #default="{ row }">
          <!-- ✅ 简化判断：只要是培训类型就显示长期有效 -->
          <div v-if="row.activityType === '培训'">
            <el-tag type="success" size="small">
              <span class="i-mdi:calendar-clock mr-1" />
              长期有效
            </el-tag>
          </div>
          <span v-else>{{ row.startTime }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="活动地点" width="180" show-overflow-tooltip />
      <el-table-column label="报名人数" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="info" size="small">
            {{ row.currentParticipants }}
            <span v-if="row.maxParticipants > 0">/ {{ row.maxParticipants }}</span>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactPerson" label="联系人" width="100">
        <template #default="{ row }">
          <span>{{ row.contactPerson || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="contactPhone" label="联系电话" width="130">
        <template #default="{ row }">
          <span>{{ row.contactPhone || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <template v-if="isAdmin">
            <el-button type="info" size="small" text @click="viewEnrollments(row)">
              <span class="i-mdi:account-group mr-1" />报名列表
            </el-button>
            <el-button type="primary" size="small" text @click="editActivity(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="deleteActivity(row)">删除</el-button>
          </template>
          <template v-else-if="isMember">
            <el-button
              type="primary"
              size="small"
              :disabled="!canEnroll(row)"
              @click="openEnrollDialog(row)"
            >
              <span class="i-mdi:account-plus mr-1" />
              {{ canEnroll(row) ? '立即报名' : '已报满' }}
            </el-button>
          </template>
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
        @current-change="(p: number) => { page = p; fetchActivities(); }"
      />
    </div>

    <ActivityForm
      v-if="formVisible"
      ref="activityFormRef"
      :visible="formVisible"
      :form="form"
      @update:visible="formVisible = $event"
      @save="saveActivity"
    />

    <EnrollmentList
      v-if="enrollmentVisible"
      :visible="enrollmentVisible"
      :loading="enrollmentLoading"
      :activity="currentActivity"
      :enrollments="enrollmentList"
      :get-enrollment-status-tag="getEnrollmentStatusTag"
      :get-enrollment-status-text="getEnrollmentStatusText"
      @update:visible="enrollmentVisible = $event"
      @review="reviewEnrollment"
    />

    <!-- 报名对话框（支持培训和活动） -->
    <el-dialog 
      v-model="enrollDialogVisible" 
      :title="enrollForm.enrollmentType === 'training' ? '课程报名' : '活动报名'" 
      width="500px" 
      align-center
    >
      <el-form :model="enrollForm" label-width="100px">
        
        <!-- 培训课程提示 -->
        <el-alert 
          v-if="enrollForm.enrollmentType === 'training'"
          type="success"
          :closable="false"
          class="mb-4"
        >
          <template #title>
            <div class="flex items-center gap-2">
              <span class="i-mdi:school text-lg" />
              <span class="font-semibold">固定培训课程</span>
            </div>
          </template>
          <div class="mt-1 text-sm">{{ enrollForm.courseName }}</div>
        </el-alert>

        <el-form-item label="姓名" required>
          <el-input 
            v-model="enrollForm.memberName" 
            placeholder="请输入您的姓名" 
            maxlength="50" 
          />
        </el-form-item>

        <el-form-item label="联系电话" required>
          <el-input 
            v-model="enrollForm.memberPhone" 
            placeholder="请输入您的手机号" 
            maxlength="11" 
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input 
            v-model="enrollForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息（选填）" 
            maxlength="200" 
            show-word-limit 
          />
        </el-form-item>

        <el-alert 
          title="提示" 
          type="warning" 
          :closable="false"
        >
          提交后将进入审核状态，请耐心等待管理员审核
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="enrollDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEnroll">
          <span class="i-mdi:check mr-1" />提交报名
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-table) {
  font-size: 14px;
}
</style>
