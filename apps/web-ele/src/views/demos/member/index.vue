<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAccess } from '@vben/access';
import { ElMessage } from 'element-plus';
import { requestClient } from '#/api/request';
import MemberForm from './MemberForm.vue';
import MemberDetail from './MemberDetail.vue'; // ✅ 新增
import { useMember } from './useMember';
import { useUserStore } from '#/store/member';

const { hasAccessByCodes } = useAccess();

const isAdmin = computed(() => hasAccessByCodes(['member:add']));
const userStore = useUserStore();
const isMember = computed(() => userStore.isMember || isAdmin.value);

const {
  loading,
  memberList,
  total,
  page,
  pageSize,
  keyword,
  formVisible,
  memberFormRef,
  form,
  fetchMembers,
  resetSearch,
  openAddDialog,
  editMember,
  saveMember,
  deleteMember,
  getGenderTagType
} = useMember();

// 新增：查看详情相关
const detailVisible = ref(false);
const currentMember = ref<any>(null);

const viewDetail = (row: any) => {
  currentMember.value = row;
  detailVisible.value = true;
};

</script>

<template>
  <div class="p-4">
    <!-- 页面说明 -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold mb-2">会员管理</h2>
      <p class="text-sm text-gray-500">
        {{ isAdmin ? '管理俱乐部会员信息，包括个人资料和车辆信息' : '查看俱乐部会员信息' }}
      </p>
      
      <el-alert
        v-if="!isMember && !isAdmin"
        class="mt-2"
        title="温馨提示"
        type="info"
        :closable="false"
      >
        您是普通用户，只能浏览。请联系管理员为您创建会员档案后即可查看详细信息！
      </el-alert>
    </div>

    <!-- 搜索栏 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <el-input
          v-model="keyword"
          placeholder="搜索会员姓名、手机号或车牌号..."
          clearable
          style="width: 350px"
          @clear="fetchMembers"
          @keyup.enter="fetchMembers"
        >
          <template #prefix>
            <span class="i-mdi:magnify" />
          </template>
        </el-input>

        <el-button type="primary" @click="fetchMembers">
          <span class="i-mdi:magnify mr-1" />
          搜索
        </el-button>

        <el-button @click="resetSearch">
          <span class="i-mdi:refresh mr-1" />
          重置
        </el-button>
      </div>

      <div class="flex items-center gap-3">
        <el-button
          v-if="isAdmin"
          type="primary"
          @click="openAddDialog"
        >
          <span class="i-mdi:plus mr-1" />
          新增会员
        </el-button>
      </div>
    </div>

    <!-- 会员列表 -->
    <el-table 
      :data="memberList" 
      v-loading="loading" 
      border 
      stripe
    >
      <el-table-column 
        type="index" 
        label="序号" 
        width="60" 
        align="center" 
      />
      
      <el-table-column 
        prop="memberName" 
        label="会员姓名" 
        width="120"
        fixed="left"
      />
      
      <el-table-column 
        prop="phone" 
        label="手机号" 
        width="130" 
      />
      
      <el-table-column 
        prop="gender" 
        label="性别" 
        width="80" 
        align="center"
      >
        <template #default="{ row }">
          <el-tag :type="getGenderTagType(row.gender)" size="small">
            {{ row.gender }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="joinDate" 
        label="加入日期" 
        width="120" 
        align="center"
      />
      
      <el-table-column 
        prop="motorcycleBrand" 
        label="摩托车品牌" 
        width="120" 
      >
        <template #default="{ row }">
          <span>{{ row.motorcycleBrand || '-' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="motorcycleModel" 
        label="摩托车型号" 
        width="130" 
      >
        <template #default="{ row }">
          <span>{{ row.motorcycleModel || '-' }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="plateNumber" 
        label="车牌号" 
        width="110" 
      >
        <template #default="{ row }">
          <el-tag v-if="row.plateNumber" type="success" size="small">
            {{ row.plateNumber }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="address" 
        label="联系地址" 
        min-width="180"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span>{{ row.address || '-' }}</span>
        </template>
      </el-table-column>

      <!-- ✅ 修改操作列 -->
      <el-table-column 
        label="操作" 
        width="180" 
        fixed="right" 
        align="center"
      >
        <template #default="{ row }">
          <!-- 管理员 -->
          <template v-if="isAdmin">
            <el-button
              type="primary"
              size="small"
              text
              @click="editMember(row)"
            >
              编辑
            </el-button>
            
            <el-button
              type="danger"
              size="small"
              text
              @click="deleteMember(row)"
            >
              删除
            </el-button>
          </template>
          
          <!-- 会员 -->
          <template v-else-if="isMember">
            <el-button
              type="info"
              size="small"
              text
              @click="viewDetail(row)"
            >
              <span class="i-mdi:eye mr-1" />
              查看详情
            </el-button>
          </template>
          
          <!-- 普通用户 -->
          <template v-else>
            <el-tag type="info" size="small">仅供浏览</el-tag>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-center">
      <el-pagination
        background
        layout="prev, pager, next, total, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        @current-change="(p: number) => { page = p; fetchMembers(); }"
      />
    </div>

    <!-- 会员表单对话框 -->
    <MemberForm
      v-if="formVisible"
      ref="memberFormRef"
      :visible="formVisible"
      :form="form"
      @update:visible="formVisible = $event"
      @save="saveMember"
    />

    <!-- ✅ 新增：会员详情对话框 -->
    <MemberDetail
      v-if="detailVisible"
      :visible="detailVisible"
      :member="currentMember"
      @update:visible="detailVisible = $event"
    />
  </div>
</template>

<style scoped>
:deep(.el-table) {
  font-size: 14px;
}
</style>
