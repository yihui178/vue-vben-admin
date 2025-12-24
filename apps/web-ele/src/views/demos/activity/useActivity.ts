// useActivity.ts
import { ref, onMounted } from 'vue'; // ✅ 移除 nextTick
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance } from 'element-plus';
import { requestClient } from '#/api/request';
import {
  createDefaultActivity,
  ACTIVITY_TYPE_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
} from './types';
import type { Activity, ActivityEnrollment } from './types';

export function useActivity() {
  const loading = ref(false);
  const activityList = ref<Activity[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(10);
  const keyword = ref('');

  const formVisible = ref(false);
  const activityFormRef = ref(); // ✅ 改为存储子组件实例
  const form = ref<Activity>(createDefaultActivity());

  const enrollmentVisible = ref(false);
  const enrollmentLoading = ref(false);
  const enrollmentList = ref<ActivityEnrollment[]>([]);
  const currentActivity = ref<Activity | null>(null);

  // ==================== 查询活动列表 ====================
  const fetchActivities = async () => {
    loading.value = true;
    try {
      const res = await requestClient.get('/activity/page', {
        params: {
          page: page.value,
          pageSize: pageSize.value,
          keyword: keyword.value || undefined,
        },
      });

      const data = res?.data?.data || res?.data || res;
      activityList.value = data.list || [];
      total.value = Number(data.total) || 0;
    } catch (error: any) {
      console.error('获取活动列表失败:', error);
      ElMessage.error(error?.message || '获取活动列表失败');
    } finally {
      loading.value = false;
    }
  };

  // ==================== 重置搜索 ====================
  const resetSearch = () => {
    keyword.value = '';
    page.value = 1;
    fetchActivities();
  };

  // ==================== 打开新增对话框 ====================
  const openAddDialog = () => {
    form.value = createDefaultActivity();
    formVisible.value = true;
  };

  // ==================== 编辑活动 ====================
  const editActivity = (row: Activity) => {
    form.value = { ...row };
    formVisible.value = true;
  };

  // ==================== 保存活动 ====================
  const saveActivity = async () => {
    console.log('=== 开始保存活动 ===');
    console.log('activityFormRef:', activityFormRef.value);
    
    // ✅ 获取子组件暴露的 formRef
    const formInstance = activityFormRef.value?.formRef;
    console.log('formInstance:', formInstance);
    
    if (!formInstance) {
      console.error('表单引用不存在');
      ElMessage.error('表单初始化失败');
      return;
    }

    try {
      console.log('开始表单验证...');
      await formInstance.validate();
      console.log('表单验证通过');
      console.log('表单数据:', form.value);

      const endpoint = form.value.id ? '/activity/update' : '/activity/add';
      const method = form.value.id ? 'put' : 'post';

      console.log('请求:', method, endpoint);

      await requestClient[method](endpoint, form.value);

      ElMessage.success(form.value.id ? '更新成功' : '新增成功');
      formVisible.value = false;
      fetchActivities();
    } catch (error: any) {
      console.error('保存失败:', error);

      if (error !== false) {
        const errorMsg =
          error?.response?.data?.message || error?.message || '保存失败';
        ElMessage.error(errorMsg);
      }
    }
  };

  // ==================== 删除活动 ====================
  const deleteActivity = async (row: Activity) => {
    try {
      await ElMessageBox.confirm(
        `确定删除活动【${row.activityName}】吗？`,
        '提示',
        { type: 'warning' },
      );

      await requestClient.post('/activity/delete', { id: row.id });
      ElMessage.success('删除成功');

      if (activityList.value.length === 1 && page.value > 1) {
        page.value--;
      }

      fetchActivities();
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error(error?.message || '删除失败');
      }
    }
  };

  // ==================== 查看报名列表 ====================
  const viewEnrollments = async (row: Activity) => {
    currentActivity.value = row;
    enrollmentVisible.value = true;
    enrollmentLoading.value = true;

    try {
      const res = await requestClient.get(
        `/enrollment/list/activity/${row.id}`,
      );
      enrollmentList.value = res?.data || res || [];
    } catch (error: any) {
      console.error('获取报名列表失败:', error);
      ElMessage.error(error?.message || '获取报名列表失败');
    } finally {
      enrollmentLoading.value = false;
    }
  };

  // ==================== 审核报名 ====================
  const reviewEnrollment = async (
    enrollment: ActivityEnrollment,
    status: string,
  ) => {
    try {
      const action = status === 'APPROVED' ? '通过' : '拒绝';
      await ElMessageBox.confirm(
        `确定${action}【${enrollment.memberName}】的报名吗？`,
        '审核确认',
        { type: 'warning' },
      );

      await requestClient.post('/enrollment/review', {
        id: enrollment.id,
        status: status,
      });

      ElMessage.success(`审核${action}成功`);

      if (currentActivity.value) {
        viewEnrollments(currentActivity.value);
      }
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('审核失败:', error);
        ElMessage.error(error?.message || '审核失败');
      }
    }
  };

  // ==================== 辅助方法 ====================
  const getActivityTypeTag = (type: string) => {
    const map: Record<string, string> = {
      骑行: 'primary',
      聚会: 'success',
      培训: 'warning',
      比赛: 'danger',
    };
    return map[type] || '';
  };

  const getEnrollmentStatusTag = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
    };
    return map[status] || '';
  };

  const getEnrollmentStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING: '待审核',
      APPROVED: '已通过',
      REJECTED: '已拒绝',
    };
    return map[status] || status;
  };

  onMounted(() => {
    fetchActivities();
  });

  return {
    loading,
    activityList,
    total,
    page,
    pageSize,
    keyword,
    formVisible,
    activityFormRef, // ✅ 改为返回子组件ref
    form,
    enrollmentVisible,
    enrollmentLoading,
    enrollmentList,
    currentActivity,
    ACTIVITY_TYPE_OPTIONS,
    ENROLLMENT_STATUS_OPTIONS,
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
  };
}
