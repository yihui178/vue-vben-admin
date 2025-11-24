<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';
const { hasAccessByCodes } = useAccess();
// ==================== 基础状态 ====================
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
const defaultForm = {
  id: null as number | null,
  newsName: '',
  newsContent: '',
  newsCategory: [] as string[],
  newsDescription: '',
  hasImage: false,
  imageUrl: '',
  newsTags: [] as string[],
};
const form = ref({ ...defaultForm });
// ==================== 下拉选项 ====================
const categoryOptions = ['国内新闻', '本地新闻', '国际信息', '游戏新闻', '最新动态'];
const tagOptions = ['动态', '国内', '国际', '军事', '游戏'];
// ==================== 查询新闻列表 ====================
async function fetchNews() {
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
    const data = (res as any).data || res;
    const pageData = data.data || data;
    
    newsList.value = pageData.list || pageData.records || pageData.items || [];
    total.value = pageData.total || 0;
  } catch (error) {
    console.error('获取新闻列表失败:', error);
    ElMessage.error('获取新闻列表失败');
  } finally {
    loading.value = false;
  }
}
// ==================== 新增/编辑新闻 ====================
function openAddDialog() {
  form.value = { ...defaultForm };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}
function editNews(row: any) {
  form.value = {
    ...row,
    newsCategory: Array.isArray(row.newsCategory) ? row.newsCategory : [],
    newsTags: Array.isArray(row.newsTags) ? row.newsTags : [],
  };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}
async function saveNews() {
  if (
    !form.value.newsName?.trim() ||
    !form.value.newsContent?.trim() ||
    !form.value.newsCategory.length ||
    !form.value.newsDescription?.trim() ||
    !form.value.newsTags.length
  ) {
    ElMessage.warning('请填写所有必填项');
    return;
  }
  if (form.value.newsName.length > 20) {
    ElMessage.warning('新闻名称不能超过20个字');
    return;
  }
  if (form.value.newsContent.length > 200) {
    ElMessage.warning('新闻内容不能超过200个字');
    return;
  }
  const payload = { ...form.value };
  try {
    if (form.value.id) {
      await requestClient.put('/news/update', payload);
      ElMessage.success('新闻更新成功');
    } else {
      await requestClient.post('/news/add', payload);
      ElMessage.success('新闻新增成功');
    }
    formVisible.value = false;
    fetchNews();
  } catch (error: any) {
    console.error('保存新闻失败:', error);
    const message = error?.response?.data?.message || error?.message || '保存失败';
    ElMessage.error(message);
  }
}
// ==================== 删除新闻 ====================
async function removeNews(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除【${row.newsName}】吗？该操作不可恢复！`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }
    );
    await requestClient.post('/news/delete', { id: row.id });
    ElMessage.success('新闻已删除');
    
    if (newsList.value.length === 1 && page.value > 1) {
      page.value = 1;
    }
    
    fetchNews();
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除新闻失败:', error);
      ElMessage.error('删除失败');
    }
  }
}
// ==================== 重置查询 ====================
function resetSearch() {
  keyword.value = '';
  selectedCategory.value = '';
  page.value = 1;
  fetchNews();
}
// ==================== 图片错误处理 ====================
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}
// ==================== 生命周期 ====================
onMounted(() => {
  fetchNews();
});
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
        <!-- ✅ 优先显示真实图片 -->
        <img 
          v-if="news.hasImage && news.imageUrl" 
          :src="news.imageUrl" 
          :alt="news.newsName"
          class="w-full h-full object-cover"
          @error="handleImageError(news)"
        />
        <!-- 占位符：有 hasImage 但没有 imageUrl -->
        <div v-else-if="news.hasImage && !news.imageUrl" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
          <span class="i-mdi:image text-6xl text-primary/30" />
        </div>
        <!-- 无图片 -->
        <div v-else class="w-full h-full flex flex-col items-center justify-center bg-muted">
          <span class="i-mdi:image-off text-4xl text-muted-foreground/30" />
          <span class="text-xs text-muted-foreground/50 mt-1">暂无图片</span>
        </div>
        
        <!-- 分类标签 -->
        <div class="absolute top-3 left-3 flex gap-2 flex-wrap ">
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
          <div class="flex gap-2 flex-wrap mb-3 gap-2 ">
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
        <!-- 右侧操作 -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <el-button
            v-if="hasAccessByCodes(['news:edit'])"
            type="primary"
            size="small"
            circle
            @click="editNews(news)"
          >
            <span class="i-mdi:pencil" />
          </el-button>
          <el-button
            v-if="hasAccessByCodes(['news:delete'])"
            type="danger"
            size="small"
            circle
            @click="removeNews(news)"
          >
            <span class="i-mdi:delete" />
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
        @current-change="
          (p: number) => {
            page = p;
            fetchNews();
          }
        "
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
        <el-form-item label="新闻配图">
          <el-switch 
            v-model="form.hasImage"
            active-text="有配图"
            inactive-text="无配图"
          />
          
          <el-input
            v-if="form.hasImage"
            v-model="form.imageUrl"
            placeholder="请输入图片URL（选填，如：https://picsum.photos/360/180）"
            clearable
            class="mt-2"
          >
            <template #prepend>
              <span class="i-mdi:link" />
            </template>
          </el-input>
          
          <!-- 图片预览 -->
          <div v-if="form.hasImage && form.imageUrl" class="mt-2 w-full h-40 border rounded overflow-hidden">
            <img 
              :src="form.imageUrl" 
              alt="预览" 
              class="w-full h-full object-cover"
              @error="handleImageError" 
            />
          </div>
          
          <div class="text-xs text-muted-foreground mt-1">
            标识该新闻是否包含图片，可输入图片链接进行预览
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNews">
          <span class="i-mdi:check mr-1" />
          保存发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
/* 使用 Tailwind 的 line-clamp 工具类 */
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
</style>
