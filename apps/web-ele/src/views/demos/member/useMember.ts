// useMember.ts
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';
import { createDefaultMember, GENDER_OPTIONS } from './types';
import type { Member } from './types';

export function useMember() {
  const loading = ref(false);
  const memberList = ref<Member[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(10);
  const keyword = ref('');

  const formVisible = ref(false);
  const memberFormRef = ref();  // 改为 memberFormRef，存储子组件实例
  const form = ref<Member>(createDefaultMember());

  // ==================== 获取今天日期 ====================
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ==================== 查询会员列表 ====================
  const fetchMembers = async () => {
    loading.value = true;
    try {
      const res = await requestClient.get('/member/page', {
        params: {
          page: page.value,
          pageSize: pageSize.value,
          keyword: keyword.value || undefined
        }
      });
      const data = res?.data?.data || res?.data || res;
      memberList.value = data.list || [];
      total.value = Number(data.total) || 0;
    } catch (error: any) {
      ElMessage.error('获取会员列表失败');
    } finally {
      loading.value = false;
    }
  };

  // ==================== 重置搜索 ====================
  const resetSearch = () => {
    keyword.value = '';
    page.value = 1;
    fetchMembers();
  };

  // ==================== 打开新增对话框 ====================
  const openAddDialog = () => {
    form.value = createDefaultMember();
    formVisible.value = true;
  };

  // ==================== 编辑会员 ====================
  const editMember = (row: Member) => {
    form.value = { 
      ...row,
      joinDate: row.joinDate || getTodayDate()
    };
    formVisible.value = true;
  };

  // ==================== 保存会员 ====================
  const saveMember = async () => {

    // 获取子组件暴露的 formRef
    const formInstance = memberFormRef.value?.formRef;

    if (!formInstance) {
      ElMessage.error('表单初始化失败');
      return;
    }

    try {
      await formInstance.validate();

      const endpoint = form.value.id ? '/member/update' : '/member/add';
      const method = form.value.id ? 'put' : 'post';

      const res = await requestClient[method](endpoint, form.value);

      ElMessage.success(form.value.id ? '更新成功' : '新增成功');
      formVisible.value = false;
      fetchMembers();
    } catch (error: any) {

      if (error !== false) {
        const errorMsg = error?.response?.data?.message || error?.message || '保存失败';
        ElMessage.error(errorMsg);
      }
    }
  };

  // ==================== 删除会员 ====================
  const deleteMember = async (row: Member) => {
    try {
      await ElMessageBox.confirm(
        `确定删除会员【${row.memberName}】吗？`,
        '提示',
        { type: 'warning' }
      );

      await requestClient.post('/member/delete', { id: row.id });
      ElMessage.success('删除成功');

      if (memberList.value.length === 1 && page.value > 1) {
        page.value--;
      }

      fetchMembers();
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  };

  // ==================== 辅助方法 ====================
  const getGenderTagType = (gender: string) => {
    return gender === '男' ? 'primary' : 'danger';
  };

  onMounted(() => {
    fetchMembers();
  });

  return {
    loading,
    memberList,
    total,
    page,
    pageSize,
    keyword,
    formVisible,
    memberFormRef,  
    form,
    GENDER_OPTIONS,
    fetchMembers,
    resetSearch,
    openAddDialog,
    editMember,
    saveMember,
    deleteMember,
    getGenderTagType
  };
}
