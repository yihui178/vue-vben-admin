<script setup lang="ts">
import { computed } from 'vue';
import type { Activity, ActivityEnrollment } from './types';

interface Props {
  visible: boolean;
  loading: boolean;
  activity: Activity | null;
  enrollments: ActivityEnrollment[];
  getEnrollmentStatusTag: (status: string) => string;
  getEnrollmentStatusText: (status: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  review: [enrollment: ActivityEnrollment, status: string];
}>();

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

// 统计各状态的报名数
const stats = computed(() => {
  const pending = props.enrollments.filter(
    (e) => e.enrollmentStatus === 'PENDING',
  ).length;
  const approved = props.enrollments.filter(
    (e) => e.enrollmentStatus === 'APPROVED',
  ).length;
  const rejected = props.enrollments.filter(
    (e) => e.enrollmentStatus === 'REJECTED',
  ).length;
  return { pending, approved, rejected };
});
</script>

<template>
  <el-dialog
    v-model="localVisible"
    :title="`${activity?.activityName} - 报名列表`"
    width="900px"
    align-center
  >
    <!-- 统计信息 -->
    <div class="mb-4 grid grid-cols-3 gap-4">
      <el-card shadow="hover">
        <div class="stat-item">
          <span class="i-mdi:clock-outline text-warning text-2xl" />
          <div>
            <div class="text-sm text-gray-500">待审核</div>
            <div class="text-xl font-bold">{{ stats.pending }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover">
        <div class="stat-item">
          <span class="i-mdi:check-circle text-success text-2xl" />
          <div>
            <div class="text-sm text-gray-500">已通过</div>
            <div class="text-xl font-bold">{{ stats.approved }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="hover">
        <div class="stat-item">
          <span class="i-mdi:close-circle text-danger text-2xl" />
          <div>
            <div class="text-sm text-gray-500">已拒绝</div>
            <div class="text-xl font-bold">{{ stats.rejected }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 报名列表 -->
    <el-table
      :data="enrollments"
      v-loading="loading"
      border
      stripe
      max-height="500"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />

      <el-table-column prop="memberName" label="会员姓名" width="120" />

      <el-table-column prop="memberPhone" label="联系电话" width="130" />

      <el-table-column
        prop="enrollmentStatus"
        label="报名状态"
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <el-tag
            :type="getEnrollmentStatusTag(row.enrollmentStatus)"
            size="small"
          >
            {{ getEnrollmentStatusText(row.enrollmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="enrollmentTime"
        label="报名时间"
        width="180"
        align="center"
      />

      <el-table-column
        prop="remark"
        label="备注"
        min-width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="180"
        fixed="right"
        align="center"
      >
        <template #default="{ row }">
          <template v-if="row.enrollmentStatus === 'PENDING'">
            <el-button
              type="success"
              size="small"
              text
              @click="emit('review', row, 'APPROVED')"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="emit('review', row, 'REJECTED')"
            >
              拒绝
            </el-button>
          </template>
          <el-tag
            v-else
            :type="getEnrollmentStatusTag(row.enrollmentStatus)"
            size="small"
          >
            {{ getEnrollmentStatusText(row.enrollmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <!-- 空状态 -->
    <el-empty
      v-if="!loading && enrollments.length === 0"
      description="暂无报名记录"
      :image-size="100"
    />
    <template #footer>
      <el-button @click="localVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>
<style scoped>
.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.stat-item .text-xl {
  margin-top: 4px;
}
</style>
        