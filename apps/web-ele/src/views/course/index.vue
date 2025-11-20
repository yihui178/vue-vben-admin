<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';

interface HighlightItem {
  id: number;
  name: string;
}

const { hasAccessByCodes } = useAccess();

// ----------------- 基础状态 -----------------
const loading = ref(false);
const courseList = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(5);
const keyword = ref('');

const formVisible = ref(false);
const formRef = ref();

const defaultForm = {
  id: null as number | null,
  courseName: '',
  category: '',
  description: '',
  online: false,
  highlightIds: [] as number[],
};

const form = ref({ ...defaultForm });

const highlightOptions = ref<HighlightItem[]>([]);
const categoryOptions = ['编程语言', '数据科学', '数据库', '后端开发', '前端开发'];

// ----------------- 亮点相关 -----------------
const updateHighlightDialogVisible = ref(false);
const updateHighlightForm = ref<HighlightItem>({
  id: 0,
  name: '',
});

const addHighlightDialogVisible = ref(false);
const newHighlightName = ref('');

// id -> name 映射，课程表格展示用
const highlightMap = computed(() => {
  const map: Record<number, string> = {};
  highlightOptions.value.forEach((h) => {
    map[h.id] = h.name;
  });
  return map;
});

async function fetchHighlightOptions() {
  try {
    const res = await requestClient.get('/highlight/list');
    const outer = (res as any).data ?? res;
    highlightOptions.value = outer.data || outer || [];
  } catch (e) {
    console.error('获取亮点列表失败:', e);
  }
}

function openManageHighlightDialog() {
  addHighlightDialogVisible.value = true;
  newHighlightName.value = '';
}

function openUpdateHighlight(row: HighlightItem) {
  updateHighlightForm.value = { ...row };
  updateHighlightDialogVisible.value = true;
}

async function saveUpdatedHighlight() {
  try {
    await requestClient.put('/highlight/update', updateHighlightForm.value);
    ElMessage.success('更新成功');
    updateHighlightDialogVisible.value = false;
    await fetchHighlightOptions();
  } catch (error) {
    console.error('更新亮点失败:', error);
  }
}

async function deleteHighlight(id: number) {
  try {
    // 🔥 确认删除
    await ElMessageBox.confirm('确定删除该亮点吗？该操作不可恢复！', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });

    await requestClient.post('/highlight/delete', { id });
    ElMessage.success('删除成功');
    await fetchHighlightOptions();
  } catch (error: any) {
    // 🔥 后端返回的错误信息会自动显示（如"该亮点已被 3 个课程引用，无法删除"）
    if (!(error instanceof Error && error.message.includes('cancel'))) {
      console.error('删除亮点失败:', error);
    }
  }
}

async function saveNewHighlight() {
  // 🔥 简单的前端校验（防止空提交）
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
}

// ----------------- 课程相关 -----------------
async function fetchCourses() {
  loading.value = true;
  try {
    const res = await requestClient.get('/course/page', {
      params: { page: page.value, pageSize: pageSize.value, keyword: keyword.value },
    });

    const data = (res as any).data || res;
    const pageData = data.data || data;
    courseList.value = pageData.list || pageData.records || [];
    total.value = pageData.total || 0;
  } catch (error) {
    console.error('获取课程列表失败:', error);
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  form.value = { ...defaultForm };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}

function editCourse(row: any) {
  form.value = {
    ...row,
    highlightIds: row.highlightIds || [],
  };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}

async function saveCourse() {
  // 🔥 简单的前端校验（防止空提交）
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
    fetchCourses();
  } catch (error) {
    console.error('保存课程失败:', error);
  }
}

async function removeCourse(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除【${row.courseName}】吗？该操作不可恢复！`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    });
    await requestClient.post('/course/delete', { id: row.id });
    ElMessage.success('课程已删除');
    fetchCourses();
  } catch (error: any) {
    if (!(error instanceof Error && error.message.includes('cancel'))) {
      console.error('删除课程失败:', error);
    }
  }
}

// ----------------- 生命周期 -----------------
onMounted(() => {
  fetchCourses();
  fetchHighlightOptions();
});
</script>

<template>
  <div class="p-4">
    <!-- 搜索与操作 -->
    <div class="flex items-center justify-between mb-4">
      <el-input
        v-model="keyword"
        placeholder="请输入课程名称或描述"
        clearable
        class="w-1/3"
        @clear="fetchCourses"
        @keyup.enter="fetchCourses"
      />
      <el-button
        v-if="hasAccessByCodes(['course:add'])"
        type="primary"
        @click="openAddDialog"
      >
        新增课程
      </el-button>
    </div>

    <!-- 课程列表 -->
    <el-table :data="courseList" v-loading="loading" border style="width: 100%">
      <el-table-column prop="courseName" label="课程名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column
        prop="online"
        label="是否线上课程"
        width="120"
        :formatter="(r: any) => (r.online ? '是' : '否')"
      />
      <el-table-column label="亮点">
        <template #default="{ row }">
          <el-tag
            v-for="id in row.highlightIds"
            :key="id"
            type="success"
            class="mr-1"
          >
            {{ highlightMap[id] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-if="hasAccessByCodes(['course:edit'])"
            size="small"
            @click="editCourse(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasAccessByCodes(['course:delete'])"
            type="danger"
            size="small"
            @click="removeCourse(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-end">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="
          (p: number) => {
            page = p;
            fetchCourses();
          }
        "
      />
    </div>

    <!-- 课程信息弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="form.id ? '编辑课程' : '新增课程'"
      width="720px"
      class="course-dialog"
      align-center
    >
      <el-form
        ref="formRef"
        :model="form"
        label-position="top"
        class="course-form"
      >
        <!-- 第一行：课程名称 + 分类 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="课程名称" required>
              <el-input v-model="form.courseName" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程分类" required>
              <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="c in categoryOptions"
                  :key="c"
                  :label="c"
                  :value="c"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行：是否线上课程 -->
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="是否线上课程" required>
              <el-switch v-model="form.online" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 描述 -->
        <el-form-item label="课程描述" required>
          <el-input
            type="textarea"
            v-model="form.description"
            :rows="3"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- 课程亮点 + 管理入口 -->
        <el-form-item label="课程亮点">
          <div class="flex items-center w-full gap-3">
            <el-select
              v-model="form.highlightIds"
              multiple
              placeholder="请选择亮点"
              class="flex-1"
            >
              <el-option
                v-for="item in highlightOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-button type="primary" text @click="openManageHighlightDialog">
              管理亮点
            </el-button>
          </div>
          <div class="form-tip">
            可以在「管理亮点」中新增 / 编辑 / 删除亮点。
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCourse">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 亮点管理弹窗：新增 + 列表 + 编辑/删除 -->
    <el-dialog
      v-model="addHighlightDialogVisible"
      title="管理课程亮点"
      width="640px"
      class="highlight-dialog"
      align-center
    >
      <div class="highlight-header">
        <div class="title">亮点维护</div>
        <div class="desc">在这里可以新增、编辑或删除课程亮点。</div>
      </div>

      <!-- 新增亮点 -->
      <div class="highlight-add">
        <el-input
          v-model="newHighlightName"
          placeholder="请输入新的亮点名称（最多20个字符）"
          maxlength="20"
          show-word-limit
          clearable
          @keyup.enter="saveNewHighlight"
        />
        <el-button type="primary" @click="saveNewHighlight">新增</el-button>
      </div>

      <!-- 亮点列表 -->
      <el-table
        :data="highlightOptions"
        border
        size="small"
        style="width: 100%; margin-top: 12px"
        max-height="400"
      >
        <el-table-column label="亮点名称" prop="name" />
        <el-table-column label="操作" width="160" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="openUpdateHighlight(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteHighlight(scope.row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="addHighlightDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 单独的编辑亮点弹窗 -->
    <el-dialog
      v-model="updateHighlightDialogVisible"
      title="编辑亮点"
      width="400px"
      align-center
    >
      <el-input
        v-model="updateHighlightForm.name"
        placeholder="请输入亮点名称（最多20个字符）"
        maxlength="20"
        show-word-limit
      />

      <template #footer>
        <el-button @click="updateHighlightDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUpdatedHighlight">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.course-dialog :deep(.el-dialog__body) {
  padding: 18px 24px 8px;
}

.course-form {
  margin-top: 4px;
}

.course-form .el-form-item {
  margin-bottom: 14px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 亮点管理弹窗样式 */
.highlight-dialog :deep(.el-dialog__body) {
  padding: 18px 24px 10px;
}

.highlight-header .title {
  font-size: 15px;
  font-weight: 600;
}

.highlight-header .desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.highlight-add {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
