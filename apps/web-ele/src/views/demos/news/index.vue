<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UploadProps } from 'element-plus';
import { requestClient } from '#/api/request';
const { hasAccessByCodes } = useAccess();
// ==================== 类型定义 ====================
interface NewsForm {
  id: number | null;
  newsName: string;
  newsContent: string;
  newsCategory: string[];
  newsDescription: string;
  hasImage: boolean;
  imageUrl: string;
  newsTags: string[];
}
// ==================== 常量 ====================
const CATEGORY_OPTIONS = ['国内新闻', '本地新闻', '国际信息', '游戏新闻', '最新动态'];
const TAG_OPTIONS = ['动态', '国内', '国际', '军事', '游戏'];
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
// ==================== 基础状态 ====================
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
interface ImageState {
  uploadMode: 'url' | 'oss';
  uploadLoading: boolean;
  previewUrl: string;
  pendingFile: File | null;
  originalUrl: string;
  shouldDeleteOld: boolean;
}
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
// 监听 hasImage 变化
watch(() => form.value.hasImage, (newVal) => {
  if (!newVal) {
    resetImageState();
  }
});
// 监听 URL 输入变化
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
// ==================== 图片处理逻辑 ====================
const handleImageUpload = async () => {
  const { pendingFile, uploadMode, originalUrl, shouldDeleteOld } = imageState.value;
  // 上传新图片
  if (pendingFile && uploadMode === 'oss') {
    ElMessage.info('正在上传图片到阿里云OSS...');
    const newImageUrl = await uploadToOSS(pendingFile);
    form.value.imageUrl = newImageUrl;
    // 删除被替换的旧图片
    if (originalUrl?.includes('aliyuncs.com') && originalUrl !== newImageUrl) {
      await deleteOSSImage(originalUrl);
    }
  }
  // 删除被移除的旧图片
  if (shouldDeleteOld && originalUrl) {
    await deleteOSSImage(originalUrl);
  }
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
    total.value = pageData.total || 0;
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
    // 清理资源
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
    // 异步删除 OSS 图片
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
// ==================== 生命周期 ====================
onMounted(fetchNews);
</script>
<template>
  <div class="p-4">
    <!-- 头部搜索栏 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1">
        <el-input
          v-model="keyword"
          placeholder="搜索新闻标题或内容..."
          clearable
          class="w-1/3"
          @clear="fetchNews"
          @keyup.enter="fetchNews"
        >
          <template #prefix>
            <span class="i-mdi:magnify text-lg" />
          </template>
        </el-input>
        <el-select
          v-model="selectedCategory"
          placeholder="全部分类"
          clearable
          class="w-40"
          @change="fetchNews"
        >
          <el-option
            v-for="cat in categoryOptions"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
        <el-button type="primary" @click="fetchNews">
          <span class="i-mdi:magnify mr-1" />
          搜索
        </el-button>
        <el-button @click="resetSearch">
          <span class="i-mdi:refresh mr-1" />
          重置
        </el-button>
      </div>
      <div class="flex items-center gap-3">
        <!-- 视图切换 -->
        <el-button-group>
          <el-button 
            :type="viewMode === 'card' ? 'primary' : ''"
            @click="viewMode = 'card'"
          >
            <span class="i-mdi:view-grid mr-1" />
            卡片
          </el-button>
          <el-button 
            :type="viewMode === 'list' ? 'primary' : ''"
            @click="viewMode = 'list'"
          >
            <span class="i-mdi:view-list mr-1" />
            列表
          </el-button>
        </el-button-group>
        <el-button
          v-if="hasAccessByCodes(['news:add'])"
          type="primary"
          @click="openAddDialog"
        >
          <span class="i-mdi:plus mr-1" />
          发布新闻
        </el-button>
      </div>
    </div>
    <!-- 卡片式布局 -->
    <div v-if="viewMode === 'card'" v-loading="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="news in newsList" 
        :key="news.id" 
        class="bg-background border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer flex flex-col"
      >
        <!-- 新闻图片 -->
        <div class="relative h-48 bg-primary/10 overflow-hidden">
          <img 
            v-if="news.hasImage && news.imageUrl" 
            :src="news.imageUrl" 
            :alt="news.newsName"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div v-else-if="news.hasImage && !news.imageUrl" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span class="i-mdi:image text-6xl text-primary/30" />
          </div>
          <div v-else class="w-full h-full flex flex-col items-center justify-center bg-muted">
            <span class="i-mdi:image-off text-4xl text-muted-foreground/30" />
            <span class="text-xs text-muted-foreground/50 mt-1">暂无图片</span>
          </div>
          <!-- 分类标签 -->
          <div class="absolute top-3 left-3 flex gap-2 flex-wrap">
            <el-tag
              v-for="cat in news.newsCategory"
              :key="cat"
              type="primary"
              size="small"
              effect="dark"
              round
            >
              {{ cat }}
            </el-tag>
          </div>
        </div>
        <!-- 新闻内容 -->
        <div class="p-4 flex flex-col grow">
          <div class="grow">
            <h3 class="text-base font-semibold mb-2 line-clamp-2">{{ news.newsName }}</h3>
            <p class="text-sm text-muted-foreground mb-3 line-clamp-3">{{ news.newsContent }}</p>
            <div class="flex items-center text-xs text-muted-foreground mb-3">
              <span class="i-mdi:information-outline mr-1" />
              {{ news.newsDescription }}
            </div>
          </div>
          <!-- 标签 -->
          <div class="flex gap-2 flex-wrap mb-3">
            <el-tag
              v-for="tag in news.newsTags"
              :key="tag"
              type="success"
              size="small"
              effect="plain"
            >
              # {{ tag }}
            </el-tag>
          </div>
          <!-- 操作按钮 -->
          <div class="flex justify-end gap-2 pt-3 border-t">
            <el-button
              v-if="hasAccessByCodes(['news:edit'])"
              type="primary"
              size="small"
              text
              @click="editNews(news)"
            >
              <span class="i-mdi:pencil mr-1" />
              编辑
            </el-button>
            <el-button
              v-if="hasAccessByCodes(['news:delete'])"
              type="danger"
              size="small"
              text
              @click="removeNews(news)"
            >
              <span class="i-mdi:delete mr-1" />
              删除
            </el-button>
          </div>
        </div>
      </div>
      <!-- 空状态 -->
      <div v-if="!loading && newsList.length === 0" class="col-span-full flex flex-col items-center justify-center py-20">
        <span class="i-mdi:newspaper-variant-outline text-8xl text-muted-foreground/20" />
        <p class="text-muted-foreground mt-4">暂无新闻数据</p>
      </div>
    </div>
    <!-- 列表式布局 -->
    <div v-if="viewMode === 'list'" v-loading="loading" class="space-y-4">
      <div 
        v-for="news in newsList" 
        :key="news.id" 
        class="bg-background border rounded-lg p-5 shadow-sm hover:shadow-md transition-all hover:translate-x-1 flex gap-5"
      >
        <!-- 左侧图标 -->
        <div class="flex-shrink-0 w-15 h-15 flex items-center justify-center bg-muted rounded-lg">
          <span v-if="news.hasImage" class="i-mdi:image text-3xl text-primary" />
          <span v-else class="i-mdi:text text-3xl text-muted-foreground" />
        </div>
        <!-- 中间内容 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="text-base font-semibold flex-1">{{ news.newsName }}</h3>
            <div class="flex gap-2">
              <el-tag
                v-for="cat in news.newsCategory"
                :key="cat"
                type="primary"
                size="small"
              >
                {{ cat }}
              </el-tag>
            </div>
          </div>
          <p class="text-sm text-muted-foreground mb-3 line-clamp-2">{{ news.newsContent }}</p>
          <div class="flex justify-between items-center">
            <div class="flex gap-2 flex-wrap">
              <el-tag
                v-for="tag in news.newsTags"
                :key="tag"
                type="success"
                size="small"
                effect="plain"
              >
                # {{ tag }}
              </el-tag>
            </div>
            <div class="flex items-center text-xs text-muted-foreground">
              <span class="i-mdi:eye-outline mr-1" />
              {{ news.newsDescription }}
            </div>
          </div>
        </div>
        <!-- 右侧操作按钮 -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <el-button
            v-if="hasAccessByCodes(['news:edit'])"
            type="primary"
            size="small"
            @click="editNews(news)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasAccessByCodes(['news:delete'])"
            type="danger"
            size="small"
            @click="removeNews(news)"
          >
            删除
          </el-button>
        </div>
      </div>
      <!-- 空状态 -->
      <div v-if="!loading && newsList.length === 0" class="flex flex-col items-center justify-center py-20">
        <span class="i-mdi:newspaper-variant-outline text-8xl text-muted-foreground/20" />
        <p class="text-muted-foreground mt-4">暂无新闻数据</p>
      </div>
    </div>
    <!-- 分页 -->
    <div class="mt-4 flex justify-center">
      <el-pagination
        background
        layout="prev, pager, next, total, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => { page = p; fetchNews(); }"
      />
    </div>
    <!-- 新闻表单弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="form.id ? '编辑新闻' : '发布新闻'"
      width="720px"
      align-center
    >
      <el-form ref="formRef" :model="form" label-position="top">
        <el-form-item label="新闻标题" required>
          <el-input
            v-model="form.newsName"
            maxlength="20"
            show-word-limit
            placeholder="请输入新闻标题（不超过20字）"
          />
        </el-form-item>
        <el-form-item label="新闻内容" required>
          <el-input
            type="textarea"
            v-model="form.newsContent"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入新闻正文内容（不超过200字）"
          />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="新闻分类" required>
              <el-select
                v-model="form.newsCategory"
                multiple
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryOptions"
                  :key="cat"
                  :label="cat"
                  :value="cat"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="新闻标签" required>
              <el-select
                v-model="form.newsTags"
                multiple
                placeholder="请选择标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tagOptions"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="新闻简介" required>
          <el-input
            type="textarea"
            v-model="form.newsDescription"
            :rows="2"
            placeholder="请输入新闻简要描述"
          />
        </el-form-item>
        <!-- 图片上传区域 -->
        <el-form-item label="新闻配图">
          <div class="w-full">
            <!-- 是否有配图开关 -->
            <el-switch 
              v-model="form.hasImage"
              active-text="有配图"
              inactive-text="无配图"
              class="mb-3"
            />
            <!-- 当选择有配图时显示 -->
            <div v-if="form.hasImage" class="space-y-3">
              <!-- 上传模式切换 -->
              <el-radio-group v-model="imageState.uploadMode" size="small">
                <el-radio-button label="url">
                  <span class="i-mdi:link mr-1" />
                  图片链接
                </el-radio-button>
                <el-radio-button label="oss">
                  <span class="i-mdi:cloud-upload mr-1" />
                  阿里云上传
                </el-radio-button>
              </el-radio-group>
              <!-- 方式1：URL输入 -->
              <div v-if="imageState.uploadMode === 'url'">
                <el-input
                  v-model="form.imageUrl"
                  placeholder="请输入图片URL（如：https://picsum.photos/360/180）"
                  clearable
                >
                  <template #prepend>
                    <span class="i-mdi:link" />
                  </template>
                </el-input>
                <div class="text-xs text-muted-foreground mt-1">
                  支持 http:// 或 https:// 开头的图片链接
                </div>
              </div>
              <!-- 方式2：阿里云OSS上传 -->
              <div v-if="imageState.uploadMode === 'oss'">
                <el-upload
                  class="upload-demo"
                  :auto-upload="false"
                  :show-file-list="false"
                  :before-upload="beforeUpload"
                  :on-change="handleUpload"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  drag
                >
                  <div class="el-upload__text">
                    <span class="i-mdi:cloud-upload text-4xl text-primary mb-2" />
                    <p>将图片拖到此处，或<em>点击选择</em></p>
                    <p class="text-xs text-muted-foreground mt-2">
                      支持 JPG/PNG/GIF/WEBP，大小不超过 5MB
                    </p>
                    <p class="text-xs text-warning mt-1">
                      <span class="i-mdi:information mr-1" />
                      图片将在点击"保存发布"后上传到OSS
                    </p>
                  </div>
                </el-upload>
                <div v-if="imageState.uploadLoading" class="text-center text-sm text-primary mt-2">
                  <span class="i-mdi:loading animate-spin mr-1" />
                  正在上传到阿里云OSS...
                </div>
              </div>
              <!-- 图片预览 -->
              <div v-if="imageState.previewUrl" class="relative w-full h-48 border-2 border-dashed border-primary/30 rounded-lg overflow-hidden group">
                <img 
                  :src="imageState.previewUrl" 
                  alt="预览" 
                  class="w-full h-full object-cover"
                  @error="() => {
                    imageState.previewUrl = '';
                    ElMessage.error('图片加载失败，请检查URL或重新上传');
                  }"
                />
                <!-- 删除按钮 -->
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <el-button type="danger" size="large" @click="removeImage">
                    删除图片
                  </el-button>
                </div>
                <!-- 预览标签 -->
                <div class="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded">
                  <span class="i-mdi:check mr-1" />
                  {{ imageState.pendingFile ? '等待上传到OSS' : imageState.uploadMode === 'oss' ? '已上传到OSS' : '已设置URL' }}
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveNews"
          :loading="imageState.uploadLoading"
        >
          <span class="i-mdi:check mr-1" />
          保存发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
:deep(.el-upload-dragger) {
  padding: 40px 20px;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  background-color: var(--el-fill-color-light);
  transition: all 0.3s;
}
:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}
:deep(.el-upload__text) {
  display: flex;
  flex-direction: column;
  align-items: center;
}
:deep(.el-upload__text em) {
  color: var(--el-color-primary);
  font-style: normal;
  font-weight: 500;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
