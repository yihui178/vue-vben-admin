// useUser.ts - 生产版本（移除所有日志）
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, UploadFile } from 'element-plus';
import { requestClient } from '#/api/request';
import { DEFAULT_USER, ROLE_OPTIONS, ROLE_TAG_TYPE_MAP } from './types';
import type { User } from './types';
/**
 * 用户管理 Composable
 */
export function useUser() {
  // ==================== 列表状态 ====================
  const loading = ref(false);
  const userList = ref<User[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(10);
  const keyword = ref('');
  
  // ==================== 表单状态 ====================
  const formVisible = ref(false);
  const formRef = ref<FormInstance>();
  const form = ref<User>({ ...DEFAULT_USER });
  
  // ==================== 查询用户列表 ====================
  const fetchUsers = async () => {
    loading.value = true;
    try {
      const res = await requestClient.get('/user/page', {
        params: {
          page: page.value,
          pageSize: pageSize.value,
          keyword: keyword.value || undefined
        }
      });
      
      const data = res?.data?.data || res?.data || res;
      userList.value = data.list || [];
      total.value = Number(data.total) || 0;
    } catch (error: any) {
      ElMessage.error('获取用户列表失败');
    } finally {
      loading.value = false;
    }
  };
  
  // ==================== 重置搜索 ====================
  const resetSearch = () => {
    keyword.value = '';
    page.value = 1;
    fetchUsers();
  };
  
  // ==================== 打开新增对话框 ====================
  const openAddDialog = () => {
    form.value = { ...DEFAULT_USER };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  };
  
  // ==================== 编辑用户 ====================
  const editUser = (row: User) => {
    form.value = { ...row, password: '' };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  };
  
  // ==================== 保存用户 ====================
  const saveUser = async () => {
    try {
      const endpoint = form.value.id ? '/user/update' : '/user/add';
      const method = form.value.id ? 'put' : 'post';
      
      const submitData: any = { ...form.value };
      
      if (form.value.id && !submitData.password) {
        delete submitData.password;
      }
      
      await requestClient[method](endpoint, submitData);
      
      ElMessage.success(form.value.id ? '更新成功' : '新增成功');
      formVisible.value = false;
      
      await fetchUsers();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message 
        || error?.message 
        || '保存失败，请重试';
      ElMessage.error(errorMsg);
    }
  };
  
  // ==================== 删除用户 ====================
  const deleteUser = async (row: User) => {
    try {
      await ElMessageBox.confirm(
        `确定删除用户【${row.name}】吗？`,
        '提示',
        { type: 'warning' }
      );
      
      await requestClient.post('/user/delete', { id: row.id });
      ElMessage.success('删除成功');
      
      if (userList.value.length === 1 && page.value > 1) {
        page.value--;
      }
      
      fetchUsers();
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  };
  
  // ==================== 导入用户 ====================
  const handleImport = async (file: UploadFile) => {
    const formData = new FormData();
    formData.append('file', file.raw as File);
    
    try {
      const loadingMsg = ElMessage.info({ 
        message: '正在导入...', 
        duration: 0 
      });
      
      await requestClient.post('/importUsers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      loadingMsg.close();
      ElMessage.success('导入成功');
      fetchUsers();
    } catch (error: any) {
      ElMessage.error('导入失败');
    }
  };
  
  // ==================== 下载 Blob 文件 ====================
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };
  
  // ==================== 导出用户 ====================
  const handleExport = async () => {
    const loadingMsg = ElMessage.info({ 
      message: '正在导出...', 
      duration: 0 
    });
    
    try {
      const response: any = await requestClient.post('/exportExcelUser', {}, {
        responseType: 'blob'
      });
      
      let blob: Blob | null = null;
      
      if (response instanceof Blob) {
        blob = response;
      } else if (response?.data instanceof Blob) {
        blob = response.data;
      } else if (response?.data) {
        blob = new Blob([response.data]);
      } else {
        blob = new Blob([response]);
      }
      
      if (!blob || blob.size === 0) {
        loadingMsg.close();
        ElMessage.error('文件为空');
        return;
      }
      
      const fileName = `用户数据_${Date.now()}.xlsx`;
      downloadBlob(blob, fileName);
      
      loadingMsg.close();
      ElMessage.success('导出成功！');
    } catch (error: any) {
      loadingMsg.close();
      
      if (error instanceof Blob) {
        const fileName = `用户数据_${Date.now()}.xlsx`;
        downloadBlob(error, fileName);
        ElMessage.success('导出成功！');
      } else {
        ElMessage.error('导出失败');
      }
    }
  };
  
  // ==================== 辅助方法 ====================
  const getRoleTagType = (role: string) => {
    return ROLE_TAG_TYPE_MAP[role] || '';
  };
  
  const getRoleName = (role: string) => {
    return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
  };
  
  // ==================== 生命周期 ====================
  onMounted(() => {
    fetchUsers();
  });
  
  return {
    // 列表状态
    loading,
    userList,
    total,
    page,
    pageSize,
    keyword,
    
    // 表单状态
    formVisible,
    formRef,
    form,
    
    // 列表方法
    fetchUsers,
    resetSearch,
    
    // CRUD 方法
    openAddDialog,
    editUser,
    saveUser,
    deleteUser,
    
    // 导入导出
    handleImport,
    handleExport,
    
    // 辅助方法
    getRoleTagType,
    getRoleName
  };
}
