<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';
import type { NewsForm } from './useNews';
interface Props {
  visible: boolean;
  form: NewsForm;
  formRef: any;
  imageState: any;
  categoryOptions: string[];
  tagOptions: string[];
  beforeUpload: UploadProps['beforeUpload'];
  handleUpload: (file: any) => void;
  removeImage: () => void;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'save': [];
}>();
const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});
// 图片错误处理函数
const handlePreviewError = () => {
  props.imageState.previewUrl = '';
  ElMessage.error('图片加载失败，请检查URL或重新上传');
};
</script>
<template>
  <el-dialog
    v-model="localVisible"
    :title="form.id ? '编辑动态' : '发布动态'"
    width="720px"
    align-center
  >
    <el-form :ref="formRef" :model="form" label-position="top">
      <!-- 🔥 只改 label 文字 -->
      <el-form-item label="动态标题" required>
        <el-input
          v-model="form.newsName"
          maxlength="20"
          show-word-limit
          placeholder="例如：春季环城骑行活动圆满结束"
        />
      </el-form-item>
      <el-form-item label="动态内容" required>
        <el-input
          type="textarea"
          v-model="form.newsContent"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请输入详细的动态内容"
        />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="动态分类" required>
            <el-select
              v-model="form.newsCategory"
              multiple
              placeholder="请选择分类（可多选）"
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
          <el-form-item label="动态标签" required>
            <el-select
              v-model="form.newsTags"
              multiple
              placeholder="请选择标签（可多选）"
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
      <el-form-item label="动态简介" required>
        <el-input
          type="textarea"
          v-model="form.newsDescription"
          :rows="2"
          placeholder="一句话概括本条动态的核心内容"
        />
      </el-form-item>
      <!-- 图片上传区域完全不动 -->
      <el-form-item label="配图（可选）">
        <div class="w-full">
          <el-switch 
            v-model="form.hasImage"
            active-text="有配图"
            inactive-text="无配图"
            class="mb-3"
          />
          <div v-if="form.hasImage" class="space-y-3">
            <!-- 上传模式切换 -->
            <el-radio-group v-model="imageState.uploadMode" size="small">
              <el-radio-button value="url">
                <span class="i-mdi:link mr-1" />
                图片链接
              </el-radio-button>
              <el-radio-button value="oss">
                <span class="i-mdi:cloud-upload mr-1" />
                阿里云上传
              </el-radio-button>
            </el-radio-group>
            <!-- 方式1：URL输入 -->
            <div v-if="imageState.uploadMode === 'url'">
              <el-input
                v-model="form.imageUrl"
                placeholder="请输入图片URL"
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
            <!-- 方式2：OSS上传 -->
            <div v-if="imageState.uploadMode === 'oss'">
              <el-upload
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
                @error="handlePreviewError"
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
      <el-button @click="localVisible = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="emit('save')"
        :loading="imageState.uploadLoading"
      >
        <span class="i-mdi:check mr-1" />
        保存发布
      </el-button>
    </template>
  </el-dialog>
</template>
<style scoped>
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
