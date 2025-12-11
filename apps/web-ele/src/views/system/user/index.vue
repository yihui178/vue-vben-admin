<script setup lang="ts">
import { useAccess } from '@vben/access';
import UserForm from './UserForm.vue';
import { useUser } from './useUser';
const { hasAccessByCodes } = useAccess();
const {
  // 列表状态
  loading,
  userList,
  total,
  page,
  pageSize,
  keyword,
  
  // 表单状态
  formVisible,
  formRef,
  form,
  
  // 列表方法
  fetchUsers,
  resetSearch,
  
  // CRUD 方法
  openAddDialog,
  editUser,
  saveUser,
  deleteUser,
  
  // 导入导出
  handleImport,
  handleExport,
  
  // 辅助方法
  getRoleTagType,
  getRoleName
} = useUser();
</script>
<template>
  <div class="p-4">
    <!-- 页面说明 -->
    <div class="mb-4">
      <p class="text-sm text-gray-500">
        管理系统用户，包括超级管理员、管理员和普通会员
      </p>
    </div>
    <!-- 搜索栏 -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名或邮箱..."
          clearable
          style="width: 300px"
          @clear="fetchUsers"
          @keyup.enter="fetchUsers"
        >
          <template #prefix>
            <span class="i-mdi:magnify" />
          </template>
        </el-input>
        <el-button type="primary" @click="fetchUsers">
          <span class="i-mdi:magnify mr-1" />
          搜索
        </el-button>
        <el-button @click="resetSearch">
          <span class="i-mdi:refresh mr-1" />
          重置
        </el-button>
      </div>
      <div class="flex items-center gap-3">
        <!-- 导入 -->
        <el-upload
          v-if="hasAccessByCodes(['user:import'])"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleImport"
          accept=".xlsx,.xls"
        >
          <el-button type="success">
            <span class="i-mdi:upload mr-1" />
            导入
          </el-button>
        </el-upload>
        <!-- 导出 -->
        <el-button
          v-if="hasAccessByCodes(['user:export'])"
          type="warning"
          @click="handleExport"
        >
          <span class="i-mdi:download mr-1" />
          导出
        </el-button>
        <!-- 新增 -->
        <el-button
          v-if="hasAccessByCodes(['user:add'])"
          type="primary"
          @click="openAddDialog"
        >
          <span class="i-mdi:plus mr-1" />
          新增用户
        </el-button>
      </div>
    </div>
    <!-- 用户列表 -->
    <el-table 
      :data="userList" 
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
        prop="id" 
        label="用户ID" 
        width="180" 
      />
      
      <el-table-column 
        prop="name" 
        label="用户名" 
        width="150" 
      />
      
      <el-table-column 
        prop="age" 
        label="年龄" 
        width="80" 
        align="center" 
      />
      
      <el-table-column 
        prop="email" 
        label="邮箱" 
        min-width="200" 
      />
      
      <el-table-column 
        prop="role" 
        label="角色" 
        width="120"
      >
        <template #default="{ row }">
          <el-tag :type="getRoleTagType(row.role)">
            {{ getRoleName(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column 
        label="操作" 
        width="200" 
        fixed="right" 
        align="center"
      >
        <template #default="{ row }">
          <el-button
            v-if="hasAccessByCodes(['user:edit'])"
            type="primary"
            size="small"
            text
            @click="editUser(row)"
          >
            编辑
          </el-button>
          
          <el-button
            v-if="hasAccessByCodes(['user:delete'])"
            type="danger"
            size="small"
            text
            @click="deleteUser(row)"
          >
            删除
          </el-button>
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
        @current-change="(p: number) => { page = p; fetchUsers(); }"
      />
    </div>
    <!-- 用户表单对话框 -->
    <UserForm
      v-if="formVisible"
      :visible="formVisible"
      :form="form"
      :form-ref="formRef"
      @update:visible="formVisible = $event"
      @save="saveUser"
    />
  </div>
</template>
<style scoped>
:deep(.el-table) {
  font-size: 14px;
}
</style>
