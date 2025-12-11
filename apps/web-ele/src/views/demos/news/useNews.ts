import { ref, watch, nextTick, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadProps } from 'element-plus';
import { requestClient } from '#/api/request';
// ==================== 类型定义 ====================
export interface NewsForm {
  id: number | null;
  newsName: string;
  newsContent: string;
  newsCategory: string[];
  newsDescription: string;
  hasImage: boolean;
  imageUrl: string;
  newsTags: string[];
}
interface ImageState {
  uploadMode: 'url' | 'oss';
  uploadLoading: boolean;
  previewUrl: string;
  pendingFile: File | null;
  originalUrl: string;
  shouldDeleteOld: boolean;
}
// ==================== 常量 ====================
const CATEGORY_OPTIONS = [
  '俱乐部活动',      
  '骑行技巧',        
  '安全知识',        
  '车辆保养',        
  '最新动态',        
  '会员风采',        
];
const TAG_OPTIONS = [
  '动态',
  '活动',          
  '教学',        
  '安全',         
  '保养',         
  '推荐',          // 新增
];
const DEFAULT_FORM: NewsForm = {
  id: null,
  newsName: '',
  newsContent: '',
  newsCategory: [],
  newsDescription: '',
  hasImage: false,
  imageUrl: '',
  newsTags: [],
};
export function useNews() {
  // ==================== 列表状态 ====================
  const loading = ref(false);
  const newsList = ref<any[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(6);
  const keyword = ref('');
  const selectedCategory = ref('');
  const viewMode = ref<'card' | 'list'>('card');
  // ==================== 表单状态 ====================
  const formVisible = ref(false);
  const formRef = ref();
  const form = ref<NewsForm>({ ...DEFAULT_FORM });
  // ==================== 图片上传状态 ====================
  const imageState = ref<ImageState>({
    uploadMode: 'url',
    uploadLoading: false,
    previewUrl: '',
    pendingFile: null,
    originalUrl: '',
    shouldDeleteOld: false,
  });
  // ==================== 计算属性 ====================
  const categoryOptions = computed(() => CATEGORY_OPTIONS);
  const tagOptions = computed(() => TAG_OPTIONS);
  // ==================== Watch ====================
  watch(() => form.value.hasImage, (newVal) => {
    if (!newVal) {
      resetImageState();
    }
  });
  watch(() => form.value.imageUrl, (newVal) => {
    if (imageState.value.uploadMode === 'url' && newVal) {
      imageState.value.previewUrl = newVal;
    }
  });
  // ==================== 图片处理函数 ====================
  const resetImageState = () => {
    form.value.imageUrl = '';
    imageState.value = {
      ...imageState.value,
      previewUrl: '',
      uploadMode: 'url',
      pendingFile: null,
    };
  };
  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(rawFile.type)) {
      ElMessage.error('图片格式必须是 JPG/PNG/GIF/WEBP！');
      return false;
    }
    if (rawFile.size > maxSize) {
      ElMessage.error('图片大小不能超过 5MB！');
      return false;
    }
    return true;
  };
  const handleUpload = (file: any) => {
    const rawFile = file.raw;
    if (!rawFile) return;
    imageState.value.pendingFile = rawFile;
    imageState.value.previewUrl = URL.createObjectURL(rawFile);
    ElMessage.success({
      message: '图片已选择，点击"保存发布"后将上传到阿里云OSS',
      duration: 3000,
    });
  };
  const uploadToOSS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await requestClient.post('/upload/news-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const imageUrl = res?.data?.data?.url || res?.data?.url || res?.url;
    if (!imageUrl) {
      throw new Error('未获取到图片URL');
    }
    return imageUrl;
  };
  const deleteOSSImage = async (imageUrl: string) => {
    if (!imageUrl?.includes('aliyuncs.com')) return;
    try {
      await requestClient.delete('/upload/delete', { params: { url: imageUrl } });
    } catch (error) {
      console.error('删除 OSS 图片失败:', error);
    }
  };
  const removeImage = () => {
    if (imageState.value.originalUrl?.includes('aliyuncs.com')) {
      imageState.value.shouldDeleteOld = true;
    }
    if (imageState.value.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageState.value.previewUrl);
    }
    form.value.imageUrl = '';
    form.value.hasImage = false;
    imageState.value.previewUrl = '';
    imageState.value.pendingFile = null;
    ElMessage.success('图片已移除（将在保存时从 OSS 删除）');
  };
  const handleImageUpload = async () => {
    const { pendingFile, uploadMode, originalUrl, shouldDeleteOld } = imageState.value;
    if (pendingFile && uploadMode === 'oss') {
      ElMessage.info('正在上传图片到阿里云OSS...');
      const newImageUrl = await uploadToOSS(pendingFile);
      form.value.imageUrl = newImageUrl;
      if (originalUrl?.includes('aliyuncs.com') && originalUrl !== newImageUrl) {
        await deleteOSSImage(originalUrl);
      }
    }
    if (shouldDeleteOld && originalUrl) {
      await deleteOSSImage(originalUrl);
    }
  };
  // ==================== 表单验证 ====================
  const validateForm = (): boolean => {
    const { newsName, newsContent, newsCategory, newsDescription, newsTags, hasImage, imageUrl } = form.value;
    if (!newsName?.trim() || !newsContent?.trim() || !newsCategory.length || 
        !newsDescription?.trim() || !newsTags.length) {
      ElMessage.warning('请填写所有必填项');
      return false;
    }
    if (newsName.length > 20) {
      ElMessage.warning('新闻名称不能超过20个字');
      return false;
    }
    if (newsContent.length > 200) {
      ElMessage.warning('新闻内容不能超过200个字');
      return false;
    }
    if (hasImage) {
      if (imageState.value.uploadMode === 'oss' && !imageState.value.pendingFile && !imageUrl) {
        ElMessage.warning('请选择要上传的图片');
        return false;
      }
      if (imageState.value.uploadMode === 'url' && !imageUrl?.trim()) {
        ElMessage.warning('请输入图片URL');
        return false;
      }
    }
    return true;
  };
  // ==================== 查询新闻列表 ====================
const fetchNews = async () => {
  loading.value = true;
  try {
    const res = await requestClient.get('/news/page', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value || undefined,
        category: selectedCategory.value || undefined,
      },
    });
    const pageData = res?.data?.data || res?.data || res;
    newsList.value = pageData.list || pageData.records || [];
    // ✅ 强制转换为数字类型
    total.value = Number(pageData.total) || 0;
  } catch (error) {
    ElMessage.error('获取新闻列表失败');
  } finally {
    loading.value = false;
  }
};
  // ==================== 新增/编辑新闻 ====================
  const openAddDialog = () => {
    form.value = { ...DEFAULT_FORM };
    imageState.value = {
      uploadMode: 'url',
      uploadLoading: false,
      previewUrl: '',
      pendingFile: null,
      originalUrl: '',
      shouldDeleteOld: false,
    };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };
  const editNews = (row: any) => {
    form.value = {
      ...row,
      newsCategory: Array.isArray(row.newsCategory) ? row.newsCategory : [],
      newsTags: Array.isArray(row.newsTags) ? row.newsTags : [],
    };
    imageState.value.originalUrl = row.imageUrl || '';
    imageState.value.shouldDeleteOld = false;
    if (form.value.hasImage && form.value.imageUrl) {
      imageState.value.previewUrl = form.value.imageUrl;
      imageState.value.uploadMode = form.value.imageUrl.includes('aliyuncs.com') ? 'oss' : 'url';
    } else {
      imageState.value.previewUrl = '';
      imageState.value.uploadMode = 'url';
    }
    imageState.value.pendingFile = null;
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };
  const saveNews = async () => {
    if (!validateForm()) return;
    imageState.value.uploadLoading = true;
    try {
      await handleImageUpload();
      const endpoint = form.value.id ? '/news/update' : '/news/add';
      const method = form.value.id ? 'put' : 'post';
      await requestClient[method](endpoint, form.value);
      ElMessage.success(form.value.id ? '新闻更新成功' : '新闻发布成功');
      if (imageState.value.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.value.previewUrl);
      }
      formVisible.value = false;
      imageState.value.pendingFile = null;
      await fetchNews();
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '保存失败');
    } finally {
      imageState.value.uploadLoading = false;
    }
  };
  // ==================== 删除新闻 ====================
  const removeNews = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定删除【${row.newsName}】吗？该操作不可恢复！`,
        '提示',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
      );
      await requestClient.post('/news/delete', { id: row.id });
      if (row.hasImage && row.imageUrl?.includes('aliyuncs.com')) {
        deleteOSSImage(row.imageUrl).catch(console.error);
      }
      ElMessage.success('新闻已删除');
      if (newsList.value.length === 1 && page.value > 1) {
        page.value--;
      }
      await fetchNews();
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  };
  // ==================== 重置查询 ====================
  const resetSearch = () => {
    keyword.value = '';
    selectedCategory.value = '';
    page.value = 1;
    fetchNews();
  };
  // ==================== 图片错误处理 ====================
  const handleImageError = (event: Event) => {
    (event.target as HTMLImageElement).style.display = 'none';
  };
  onMounted(fetchNews);
  return {
    // 列表状态
    loading,
    newsList,
    total,
    page,
    pageSize,
    keyword,
    selectedCategory,
    viewMode,
    categoryOptions,
    tagOptions,
    // 表单状态
    formVisible,
    formRef,
    form,
    imageState,
    // 列表方法
    fetchNews,
    removeNews,
    resetSearch,
    handleImageError,
    // 表单方法
    openAddDialog,
    editNews,
    saveNews,
    // 图片方法
    beforeUpload,
    handleUpload,
    removeImage,
  };
}
