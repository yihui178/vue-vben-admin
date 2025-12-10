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
  highlightIds: number[];
}
// ==================== 常量 ====================
const DEFAULT_FORM: CourseForm = {
  id: null,
  courseName: '',
  category: '',
  description: '',
  online: false,
  highlightIds: [],
};
const CATEGORY_OPTIONS = ['编程语言', '数据科学', '数据库', '后端开发', '前端开发'];
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
  };
}
