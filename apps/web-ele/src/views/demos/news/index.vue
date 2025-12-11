<script setup lang="ts">
import { useAccess } from '@vben/access';
import NewsForm from './NewsForm.vue';
import { useNews } from './useNews';
const { hasAccessByCodes } = useAccess();
const {
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
} = useNews();
</script>
<template>
  <div class="p-4">
    <!-- 🔥 添加页面说明（可选） -->
    <div class="mb-3">
      <!-- <h2 class="text-lg font-semibold">俱乐部动态管理</h2> -->
      <p class="text-xs text-gray-500 mt-1">发布和管理活动、技巧、安全等动态内容</p>
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
          发布动态
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
    <!-- ✅ 新闻表单弹窗 - 修复 props 传递 -->
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
