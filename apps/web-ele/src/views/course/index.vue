<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage, ElMessageBox } from 'element-plus';
import { requestClient } from '#/api/request';

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const courseList = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(5);
const keyword = ref('');

const formVisible = ref(false);
const formRef = ref();

const defaultForm = {
  id: null,
  courseName: '',
  category: '',
  description: '',
  online: false,
  highlights: [] as string[],
};

const form = ref({ ...defaultForm });

const highlightOptions = ['老师教学生动', '该课程有潜力', '个人爱好'];
const categoryOptions = ['编程语言', '数据科学', '数据库', '后端开发', '前端开发'];

// 分页查询
async function fetchCourses() {
  loading.value = true;
  try {
    const res = await requestClient.get('/course/page', {
      params: { page: page.value, pageSize: pageSize.value, keyword: keyword.value },
    });

    const data = res.data || res;  // 有的 requestClient 会自动解包 data
    const pageData = data.data || data; // 你的 HttpResult 包含 data 字段
    courseList.value = pageData.list || pageData.records || [];
    total.value = pageData.total || 0;
  } catch (error) {
    ElMessage.error('获取课程列表失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 打开新增弹窗（重置表单）
function openAddDialog() {
  form.value = { ...defaultForm };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}

// 打开编辑弹窗
function editCourse(row: any) {
  // 如果 highlightStr 是字符串，转换成数组
  const highlights = row.highlightStr
    ? row.highlightStr.split(',')
    : row.highlights || [];

  form.value = { ...row, highlights };
  formVisible.value = true;
  nextTick(() => formRef.value?.clearValidate?.());
}

// 新增/编辑保存
async function saveCourse() {
  if (!form.value.courseName || !form.value.category || !form.value.description) {
    ElMessage.warning('所有字段都是必填项');
    return;
  }

  // ✅ 把 highlights 数组转成 highlightStr 字符串
  const payload = {
    ...form.value,
    highlightStr: form.value.highlights?.join(',') || null,
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
    ElMessage.error(form.value.id ? '更新课程失败' : '新增课程失败');
  }
}

// 删除课程
async function removeCourse(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除【${row.courseName}】吗？`, '提示');
    await requestClient.post('/course/delete', { id: row.id });
    ElMessage.success('课程已删除');
    fetchCourses();
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('cancel'))) {
      ElMessage.error('删除课程失败');
    }
  }
}

onMounted(fetchCourses);
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

    <!-- 表格 -->
    <el-table :data="courseList" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="courseName" label="课程名称" />
      <el-table-column prop="category" label="分类" />
      <el-table-column prop="description" label="描述" />
      <el-table-column
        prop="online"
        label="是否线上课程"
        width="120"
        :formatter="(r: any) => (r.online ? '是' : '否')"
      />
      <el-table-column label="亮点">
        <template #default="{ row }">
          <el-tag v-for="tag in row.highlights" :key="tag" type="success" class="mr-1">
            {{ tag }}
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
        @current-change="(p: number) => { page = p; fetchCourses(); }"
      />
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="formVisible" title="课程信息" width="500px">
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="课程名称">
          <el-input v-model="form.courseName" maxlength="20" />
        </el-form-item>
        <el-form-item label="课程分类">
          <el-select v-model="form.category" placeholder="请选择">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input type="textarea" v-model="form.description" maxlength="100" />
        </el-form-item>
        <el-form-item label="是否线上课程">
          <el-switch v-model="form.online" />
        </el-form-item>
        <el-form-item label="课程亮点">
          <el-checkbox-group v-model="form.highlights">
            <el-checkbox
              v-for="item in highlightOptions"
              :key="item"
              :value="item"
            >
              {{ item }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
