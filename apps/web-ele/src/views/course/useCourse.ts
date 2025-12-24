import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================
export interface HighlightItem {
  id: number;
  name: string;
}

export interface CourseForm {
  id: number | null;
  courseName: string;
  category: string;
  description: string;
  online: boolean;
  scheduleTime: string;
  duration: string;
  instructor: string;
  location: string;
  highlightIds: number[];
  // ✅ 新增字段
  maxStudents: number;
  contactPhone: string;
}

// ==================== 常量 ====================
const DEFAULT_FORM: CourseForm = {
  id: null,
  courseName: '',
  category: '',
  description: '',
  online: false,
  scheduleTime: '',
  duration: '2小时',
  instructor: '',
  location: '',
  highlightIds: [],
  // ✅ 新增字段默认值
  maxStudents: 0,
  contactPhone: '',
};

const CATEGORY_OPTIONS = [
  '新手入门',
  '进阶技巧',
  '保养维修',
  '安全培训',
  '骑行技巧',
  '越野技巧',
  '改装知识',
];

export function useCourse() {
  // ==================== 课程列表状态 ====================
  const loading = ref(false);
  const courseList = ref<any[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(8);
  const keyword = ref('');

  // ==================== 课程表单状态 ====================
  const formVisible = ref(false);
  const formRef = ref();
  const form = ref<CourseForm>({ ...DEFAULT_FORM });

  // ==================== 亮点相关状态 ====================
  const highlightOptions = ref<HighlightItem[]>([]);
  const highlightManageVisible = ref(false);
  const highlightEditVisible = ref(false);
  const editingHighlight = ref<HighlightItem>({ id: 0, name: '' });
  const newHighlightName = ref('');

  // ==================== 计算属性 ====================
  const categoryOptions = computed(() => CATEGORY_OPTIONS);

  const highlightMap = computed(() => {
    const map: Record<number, string> = {};
    highlightOptions.value.forEach((h) => {
      map[h.id] = h.name;
    });
    return map;
  });

  // ==================== 亮点相关方法 ====================
  const fetchHighlightOptions = async () => {
    try {
      const res = await requestClient.get('/highlight/list');
      const outer = (res as any).data ?? res;
      highlightOptions.value = outer.data || outer || [];
    } catch (e) {
      console.error('获取亮点列表失败:', e);
    }
  };

  const openHighlightManager = () => {
    highlightManageVisible.value = true;
    newHighlightName.value = '';
  };

  const openEditHighlight = (item: HighlightItem) => {
    editingHighlight.value = { ...item };
    highlightEditVisible.value = true;
  };

  const saveNewHighlight = async () => {
    if (!newHighlightName.value.trim()) {
      ElMessage.warning('请输入亮点名称');
      return;
    }
    try {
      await requestClient.post('/highlight/add', {
        name: newHighlightName.value.trim(),
      });
      ElMessage.success('亮点添加成功');
      newHighlightName.value = '';
      await fetchHighlightOptions();
    } catch (error) {
      console.error('新增亮点失败:', error);
    }
  };

  const saveEditedHighlight = async () => {
    try {
      await requestClient.put('/highlight/update', editingHighlight.value);
      ElMessage.success('更新成功');
      highlightEditVisible.value = false;
      await fetchHighlightOptions();
    } catch (error) {
      console.error('更新亮点失败:', error);
    }
  };

  const deleteHighlight = async (id: number) => {
    try {
      await ElMessageBox.confirm('确定删除该亮点吗？该操作不可恢复！', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      });
      await requestClient.post('/highlight/delete', { id });
      ElMessage.success('删除成功');
      await fetchHighlightOptions();
    } catch (error: any) {
      if (!(error instanceof Error && error.message.includes('cancel'))) {
        console.error('删除亮点失败:', error);
      }
    }
  };

  // ==================== 课程相关方法 ====================
  const fetchCourses = async () => {
    loading.value = true;
    try {
      const res = await requestClient.get('/course/page', {
        params: { 
          page: page.value, 
          pageSize: pageSize.value, 
          keyword: keyword.value 
        },
      });
      const data = (res as any).data || res;
      const pageData = data.data || data;
      courseList.value = pageData.list || pageData.records || [];
      total.value = Number(pageData.total) || 0;
    } catch (error) {
      console.error('获取课程列表失败:', error);
      ElMessage.error('获取课程列表失败');
    } finally {
      loading.value = false;
    }
  };

  const openAddDialog = () => {
    form.value = { ...DEFAULT_FORM };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };

  const openEditDialog = (row: any) => {
    form.value = {
      ...row,
      highlightIds: row.highlightIds || [],
      // ✅ 确保新字段也被复制
      maxStudents: row.maxStudents ?? 0,
      contactPhone: row.contactPhone || '',
    };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };

  const saveCourse = async () => {
    if (!form.value.courseName?.trim() || !form.value.category || !form.value.description?.trim()) {
      ElMessage.warning('请填写所有必填项');
      return;
    }

    const payload = {
      ...form.value,
      highlightIds: form.value.highlightIds || [],
      // ✅ 确保新字段被包含在请求中
      maxStudents: form.value.maxStudents ?? 0,
      contactPhone: form.value.contactPhone || '',
    };

    try {
      if (form.value.id) {
        await requestClient.put('/course/update', payload);
        ElMessage.success('课程更新成功');
      } else {
        await requestClient.post('/course/add', payload);
        ElMessage.success('课程新增成功');
      }
      formVisible.value = false;
      await fetchCourses();
    } catch (error) {
      console.error('保存课程失败:', error);
    }
  };

  const deleteCourse = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除【${row.courseName}】吗？该操作不可恢复！`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      });
      
      await requestClient.post('/course/delete', { id: row.id });
      ElMessage.success('课程已删除');
      await fetchCourses();
    } catch (error: any) {
      if (!(error instanceof Error && error.message.includes('cancel'))) {
        console.error('删除课程失败:', error);
      }
    }
  };

  // 🔥 改进：跳转到活动页面进行报名
  const enrollCourse = async (row: any) => {
    try {
      // 这里可以通过路由跳转到活动报名页面
      // 具体实现参考 CourseList.vue 中的 goToEnroll 方法
      ElMessage.info({
        message: `即将跳转到【${row.courseName}】的报名页面...`,
        duration: 2000,
      });
    } catch (error: any) {
      console.error('报名失败:', error);
    }
  };

  // 🔥 改进：查看课程详情（包含新字段）
  const viewCourseDetail = (row: any) => {
    const maxStudentsText = row.maxStudents === 0 ? '不限' : `${row.maxStudents}人`;
    const contactPhoneText = row.contactPhone || '暂无';
    
    ElMessageBox.alert(
      `
      <div style="text-align: left; line-height: 1.8;">
        <p><strong>课程名称：</strong>${row.courseName}</p>
        <p><strong>课程分类：</strong>${row.category}</p>
        <p><strong>授课方式：</strong>${row.online ? '线上课程' : '线下实操'}</p>
        <p><strong>上课时间：</strong>${row.scheduleTime || '待定'}</p>
        <p><strong>课程时长：</strong>${row.duration || '2小时'}</p>
        <p><strong>讲师/教练：</strong>${row.instructor || '专业教练'}</p>
        <p><strong>上课地点：</strong>${row.location || '待定'}</p>
        <p><strong>最大报名人数：</strong>${maxStudentsText}</p>
        <p><strong>联系电话：</strong>${contactPhoneText}</p>
        <p style="margin-top: 12px;"><strong>课程描述：</strong></p>
        <p style="color: #666; padding-left: 20px;">${row.description}</p>
        <p style="margin-top: 12px;"><strong>课程亮点：</strong></p>
        <ul style="padding-left: 20px; color: #666;">
          ${row.highlightIds?.map((id: number) => `<li>${highlightMap.value[id]}</li>`).join('') || '<li>暂无亮点</li>'}
        </ul>
      </div>
      `,
      '课程详情',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭',
        customClass: 'course-detail-dialog',
      }
    );
  };

  // ==================== 生命周期 ====================
  onMounted(() => {
    fetchCourses();
    fetchHighlightOptions();
  });

  return {
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
    // 报名和详情方法
    enrollCourse,
    viewCourseDetail,
  };
}
