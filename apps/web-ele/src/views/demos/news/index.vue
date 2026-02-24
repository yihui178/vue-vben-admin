<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';
import NewsForm from './NewsForm.vue';
import { useNews } from './useNews';
import { useUserStore } from '#/store/member';

const { hasAccessByCodes } = useAccess();

// 判断角色
const isAdmin = computed(() => hasAccessByCodes(['news:add']));
const userStore = useUserStore();
const isMember = computed(() => userStore.isMember || isAdmin.value);

const {
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
  formVisible,
  formRef,
  form,
  imageState,
  resetSearch,
  handleImageError,
  openAddDialog,
  editNews,
  saveNews,
  beforeUpload,
  handleUpload,
  removeImage,
} = useNews();

// ✅ 新增：审核状态筛选
const selectedStatus = ref('');


// ✅ 获取动态列表
const fetchNews = async () => {
  try {
    loading.value = true;
    const url = isAdmin.value ? '/news/page-admin' : '/news/page';
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      category: selectedCategory.value,
    };
    
    if (isAdmin.value && selectedStatus.value) {
      params.status = selectedStatus.value;
    }
    
    const res = await requestClient.get(url, { params });
    // 兼容处理：尝试从 res.data 或 res 中读取
    let pageData;
    if (res.data && res.data.list !== undefined) {
      // 情况1: { data: { list: [], total: 0 } }
      pageData = res.data;
    } else if (res.list !== undefined) {
      // 情况2: { list: [], total: 0 }
      pageData = res;
    } else {
      // 情况3: 数据为空
      pageData = { list: [], total: 0 };
    }
    
    newsList.value = pageData.list || [];
    total.value = Number(pageData.total) || 0;
  } catch (error: any) {
    ElMessage.error('加载失败：' + (error?.message || '未知错误'));
    console.error('❌ 加载失败:', error);
  } finally {
    loading.value = false;
  }
};
// 修改：删除动态
const removeNews = async (news: any) => {
  try {
    await ElMessageBox.confirm('确定删除该动态吗？', '提示', {
      type: 'warning',
    });
    await requestClient.post('/news/delete', { id: news.id });
    ElMessage.success('删除成功');
    fetchNews();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 新增：审核动态
const reviewNews = async (news: any, action: string) => {
  try {
    const text = action === 'approve' ? '通过' : '拒绝';
    await ElMessageBox.confirm(`确定${text}该动态吗？`, '审核', {
      type: action === 'approve' ? 'success' : 'warning',
    });
    
    await requestClient.post('/news/review', {
      newsId: news.id,
      action,
    });
    
    ElMessage.success(`${text}成功`);
    fetchNews();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败');
    }
  }
};

// 新增：获取状态标签类型
const getStatusTag = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

// 新增：获取状态文本
const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return map[status] || status;
};

onMounted(async () => {
  fetchNews();
});
</script>

<template>
  <div class="p-4">
    <!-- 页面说明 -->
    <div class="mb-3">
      <h2 class="text-xl font-semibold mb-2">俱乐部动态管理</h2>
      <p class="text-xs text-gray-500 mt-1">
        {{ isAdmin ? '发布和管理活动、技巧、安全等动态内容' : isMember ? '浏览并发布俱乐部动态' : '浏览俱乐部动态' }}
      </p>
      
      <!-- 非会员提示 -->
      <el-alert
        v-if="!isMember && !isAdmin"
        class="mt-2"
        title="温馨提示"
        type="info"
        :closable="false"
      >
        您是普通用户，只能浏览动态。成为会员后可发布自己的动态！
      </el-alert>
      
      <!-- 会员提示 -->
      <el-alert
        v-if="isMember && !isAdmin"
        class="mt-2"
        title="温馨提示"
        type="success"
        :closable="false"
      >
        您可以发布动态，发布后需等待管理员审核通过
      </el-alert>
    </div>

    <!-- 头部搜索栏 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1">
        <el-input
          v-model="keyword"
          placeholder="搜索动态标题或内容..."
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
        
        <!-- 新增：管理员可筛选审核状态 -->
        <el-select
          v-if="isAdmin"
          v-model="selectedStatus"
          placeholder="审核状态"
          clearable
          class="w-32"
          @change="fetchNews"
        >
          <el-option label="全部" value="" />
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        
        <el-button type="primary" @click="fetchNews">
          <span class="i-mdi:magnify mr-1" />搜索
        </el-button>
        <el-button @click="resetSearch">
          <span class="i-mdi:refresh mr-1" />重置
        </el-button>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- 视图切换 -->
        <el-button-group>
          <el-button 
            :type="viewMode === 'card' ? 'primary' : ''"
            @click="viewMode = 'card'"
          >
            <span class="i-mdi:view-grid mr-1" />卡片
          </el-button>
          <el-button 
            :type="viewMode === 'list' ? 'primary' : ''"
            @click="viewMode = 'list'"
          >
            <span class="i-mdi:view-list mr-1" />列表
          </el-button>
        </el-button-group>
        
        <!-- 发布按钮 -->
        <el-button
          v-if="isAdmin || isMember"
          type="primary"
          @click="openAddDialog"
        >
          <span class="i-mdi:plus mr-1" />发布动态
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
          
          <!-- 新增：审核状态标签（右上角） -->
          <div v-if="isAdmin" class="absolute top-3 right-3">
            <el-tag
              :type="getStatusTag(news.status)"
              size="small"
              effect="dark"
            >
              {{ getStatusText(news.status) }}
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
            
            <!-- 新增：显示发布者 -->
            <div v-if="isAdmin && news.creatorName" class="text-xs text-muted-foreground mb-2">
              <span class="i-mdi:account mr-1" />发布者：{{ news.creatorName }}
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
          
          <!-- 修改：操作按钮 -->
          <div class="flex justify-end gap-2 pt-3 border-t">
            <template v-if="isAdmin">
              <!-- 待审核才显示审核按钮 -->
              <el-button
                v-if="news.status === 'pending'"
                type="success"
                size="small"
                text
                @click="reviewNews(news, 'approve')"
              >
                <span class="i-mdi:check mr-1" />通过
              </el-button>
              <el-button
                v-if="news.status === 'pending'"
                type="danger"
                size="small"
                text
                @click="reviewNews(news, 'reject')"
              >
                <span class="i-mdi:close mr-1" />拒绝
              </el-button>
              
              <el-button type="primary" size="small" text @click="editNews(news)">
                <span class="i-mdi:pencil mr-1" />编辑
              </el-button>
              <el-button type="danger" size="small" text @click="removeNews(news)">
                <span class="i-mdi:delete mr-1" />删除
              </el-button>
            </template>
            <template v-else>
              <el-tag type="info" size="small">
                {{ isMember ? '会员可发布' : '仅供浏览' }}
              </el-tag>
            </template>
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
              
              <!-- 新增：状态标签 -->
              <el-tag
                v-if="isAdmin"
                :type="getStatusTag(news.status)"
                size="small"
              >
                {{ getStatusText(news.status) }}
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
            
            <!-- 新增：发布者信息 -->
            <div v-if="isAdmin && news.creatorName" class="text-xs text-muted-foreground">
              发布者：{{ news.creatorName }}
            </div>
          </div>
        </div>
        
        <!-- 修改：右侧操作按钮 -->
        <div class="flex-shrink-0 flex items-center gap-2">
          <template v-if="isAdmin">
            <el-button
              v-if="news.status === 'pending'"
              type="success"
              size="small"
              @click="reviewNews(news, 'approve')"
            >
              通过
            </el-button>
            <el-button
              v-if="news.status === 'pending'"
              type="danger"
              size="small"
              @click="reviewNews(news, 'reject')"
            >
              拒绝
            </el-button>
            <el-button type="primary" size="small" @click="editNews(news)">编辑</el-button>
            <el-button type="danger" size="small" @click="removeNews(news)">删除</el-button>
          </template>
          <template v-else>
            <el-tag type="info" size="small">
              {{ isMember ? '会员可发布' : '仅供浏览' }}
            </el-tag>
          </template>
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
    <NewsForm
      v-if="formVisible"
      :visible="formVisible"
      :form="form"
      :form-ref="formRef"
      :image-state="imageState"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      :before-upload="beforeUpload"
      :handle-upload="handleUpload"
      :remove-image="removeImage"
      @update:visible="formVisible = $event"
      @save="saveNews"
    />
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
</style>
