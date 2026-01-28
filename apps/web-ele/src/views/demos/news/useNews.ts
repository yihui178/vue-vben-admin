import { ref, watch, nextTick, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadProps } from 'element-plus';
import { requestClient } from '#/api/request';
// --- 类型 ---
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
}
// --- 常量（✅ 去掉 as const）---
const OPTIONS = {
  categories: ['俱乐部活动', '骑行技巧', '安全知识', '车辆保养', '最新动态', '会员风采'],
  tags: ['动态', '活动', '教学', '安全', '保养', '推荐']
};
const DEFAULT_FORM: NewsForm = {
  id: null, newsName: '', newsContent: '', newsCategory: [], 
  newsDescription: '', hasImage: false, imageUrl: '', newsTags: []
};
const INITIAL_IMAGE_STATE: ImageState = {
  uploadMode: 'url', uploadLoading: false, previewUrl: '', pendingFile: null
};
const UPLOAD_CONFIG = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: 5 * 1024 * 1024,
  maxNameLength: 20,
  maxContentLength: 200
};
// --- 工具函数 ---
const detectUploadMode = (url: string): 'oss' | 'url' => 
  /aliyuncs\.com|127\.0\.0\.1:9000|localhost:9000/.test(url) ? 'oss' : 'url';
const handleError = (error: any, defaultMsg: string) => {
  ElMessage.error(error?.response?.data?.message || defaultMsg);
};
export function useNews() {
  // --- 状态 ---
  const loading = ref(false);
  const newsList = ref<any[]>([]);
  const total = ref(0);
  const page = ref(1);
  const pageSize = ref(6);
  const keyword = ref('');
  const selectedCategory = ref('');
  const viewMode = ref<'card' | 'list'>('card');
  const formVisible = ref(false);
  const formRef = ref();
  const form = ref<NewsForm>({ ...DEFAULT_FORM });
  const imageState = ref<ImageState>({ ...INITIAL_IMAGE_STATE });
  // --- 计算属性返回 string[] 类型
  const categoryOptions = computed(() => OPTIONS.categories);
  const tagOptions = computed(() => OPTIONS.tags);
  // --- Watch ---
  watch(() => form.value.hasImage, (val) => !val && resetImageState());
  watch(() => form.value.imageUrl, (val) => {
    if (imageState.value.uploadMode === 'url' && val) {
      imageState.value.previewUrl = val;
    }
  });

  // --- 图片处理 ---
  const resetImageState = () => {
    if (imageState.value.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(imageState.value.previewUrl);
    }
    form.value.imageUrl = '';
    imageState.value = { ...INITIAL_IMAGE_STATE };
  };

  const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    if (!UPLOAD_CONFIG.allowedTypes.includes(rawFile.type)) {
      ElMessage.error('图片格式必须是 JPG/PNG/GIF/WEBP！');
      return false;
    }
    if (rawFile.size > UPLOAD_CONFIG.maxSize) {
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
    ElMessage.success({ message: '图片已选择，点击"保存发布"后将上传', duration: 3000 });
  };

  const uploadToOSS = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await requestClient.post('/upload/news-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const imageUrl = res?.data?.data?.url || res?.data?.url || res?.url;
    if (!imageUrl) throw new Error('未获取到图片URL');
    return imageUrl;
  };

  const removeImage = () => {
    resetImageState();
    form.value.hasImage = false;
    ElMessage.success('图片已移除');
  };

  // --- 表单验证 ---
  const validateForm = (): boolean => {
    const { newsName, newsContent, newsCategory, newsDescription, newsTags, hasImage, imageUrl } = form.value;

    const checks = [
      { condition: !newsName?.trim() || !newsContent?.trim() || !newsCategory.length || 
                    !newsDescription?.trim() || !newsTags.length, 
        message: '请填写所有必填项' },
      { condition: newsName.length > UPLOAD_CONFIG.maxNameLength, message: '新闻名称不能超过20个字' },
      { condition: newsContent.length > UPLOAD_CONFIG.maxContentLength, message: '新闻内容不能超过200个字' },
      { condition: hasImage && imageState.value.uploadMode === 'oss' && !imageState.value.pendingFile && !imageUrl,
        message: '请选择要上传的图片' },
      { condition: hasImage && imageState.value.uploadMode === 'url' && !imageUrl?.trim(),
        message: '请输入图片URL' }
    ];

    for (const { condition, message } of checks) {
      if (condition) {
        ElMessage.warning(message);
        return false;
      }
    }
    return true;
  };

  // --- CRUD 操作 ---
  const fetchNews = async () => {
    loading.value = true;
    try {
      const res = await requestClient.get('/news/page', {
        params: { page: page.value, pageSize: pageSize.value, 
                  keyword: keyword.value || undefined, category: selectedCategory.value || undefined }
      });
      const pageData = res?.data?.data || res?.data || res;
      newsList.value = pageData.list || pageData.records || [];
      total.value = Number(pageData.total) || 0;
    } catch (error) {
      handleError(error, '获取新闻列表失败');
    } finally {
      loading.value = false;
    }
  };

  const openAddDialog = () => {
    form.value = { ...DEFAULT_FORM };
    imageState.value = { ...INITIAL_IMAGE_STATE };
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };

  const editNews = (row: any) => {
    form.value = {
      ...row,
      newsCategory: Array.isArray(row.newsCategory) ? row.newsCategory : [],
      newsTags: Array.isArray(row.newsTags) ? row.newsTags : []
    };

    if (form.value.hasImage && form.value.imageUrl) {
      imageState.value.previewUrl = form.value.imageUrl;
      imageState.value.uploadMode = detectUploadMode(form.value.imageUrl);
    } else {
      imageState.value = { ...INITIAL_IMAGE_STATE };
    }

    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate?.());
  };

  const saveNews = async () => {
    if (!validateForm()) return;

    imageState.value.uploadLoading = true;
    try {
      if (imageState.value.pendingFile && imageState.value.uploadMode === 'oss') {
        ElMessage.info('正在上传图片...');
        form.value.imageUrl = await uploadToOSS(imageState.value.pendingFile);
      }

      const endpoint = form.value.id ? '/news/update' : '/news/add';
      const method = form.value.id ? 'put' : 'post';
      await requestClient[method](endpoint, form.value);

      ElMessage.success(form.value.id ? '更新成功' : '发布成功');
      resetImageState();
      formVisible.value = false;
      await fetchNews();
    } catch (error: any) {
      handleError(error, '保存失败');
    } finally {
      imageState.value.uploadLoading = false;
    }
  };

  const removeNews = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除【${row.newsName}】吗？该操作不可恢复！`, '提示',
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' });
      await requestClient.post('/news/delete', { id: row.id });
      ElMessage.success('删除成功');
      if (newsList.value.length === 1 && page.value > 1) page.value--;
      await fetchNews();
    } catch (error: any) {
      if (error !== 'cancel') handleError(error, '删除失败');
    }
  };

  const resetSearch = () => {
    keyword.value = '';
    selectedCategory.value = '';
    page.value = 1;
    fetchNews();
  };

  const handleImageError = (event: Event) => {
    (event.target as HTMLImageElement).style.display = 'none';
  };

  return {
    loading, newsList, total, page, pageSize, keyword, selectedCategory, viewMode,
    categoryOptions, tagOptions, formVisible, formRef, form, imageState,
    fetchNews, removeNews, resetSearch, handleImageError,
    openAddDialog, editNews, saveNews,
    beforeUpload, handleUpload, removeImage
  };
}
