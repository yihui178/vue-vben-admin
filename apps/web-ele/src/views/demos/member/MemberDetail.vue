<script setup lang="ts">
import { computed } from 'vue';
import type { Member } from './types';

interface Props {
  visible: boolean;
  member: Member | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});
</script>

<template>
  <el-drawer
    v-model="localVisible"
    title="会员详情"
    direction="rtl"
    size="500px"
  >
    <div v-if="member" class="p-4">
      <!-- 头像和基本信息 -->
      <div class="flex items-center gap-4 mb-6 pb-6 border-b">
        <el-avatar :size="80" class="bg-primary">
          <span class="text-2xl">{{ member.memberName.charAt(0) }}</span>
        </el-avatar>
        
        <div>
          <h3 class="text-xl font-bold mb-2">{{ member.memberName }}</h3>
          <div class="flex items-center gap-2">
            <el-tag :type="member.gender === '男' ? 'primary' : 'danger'" size="small">
              {{ member.gender }}
            </el-tag>
            <el-tag type="success" size="small">
              <span class="i-mdi:calendar mr-1" />
              {{ member.joinDate }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="mb-6">
        <h4 class="text-base font-semibold mb-3 flex items-center">
          <span class="i-mdi:contact-mail text-primary mr-2" />
          联系方式
        </h4>
        
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="i-mdi:phone text-success" />
            <span class="text-gray-600">手机号：</span>
            <span class="font-medium">{{ member.phone }}</span>
          </div>
          
          <div v-if="member.idCard" class="flex items-center gap-2">
            <span class="i-mdi:card-account-details text-warning" />
            <span class="text-gray-600">身份证：</span>
            <span class="font-medium">{{ member.idCard }}</span>
          </div>
          
          <div v-if="member.address" class="flex items-start gap-2">
            <span class="i-mdi:map-marker text-danger" />
            <span class="text-gray-600">地址：</span>
            <span class="font-medium">{{ member.address }}</span>
          </div>
        </div>
      </div>

      <!-- 车辆信息 -->
      <div class="mb-6">
        <h4 class="text-base font-semibold mb-3 flex items-center">
          <span class="i-mdi:motorbike text-primary mr-2" />
          车辆信息
        </h4>
        
        <div class="space-y-2">
          <div v-if="member.motorcycleBrand" class="flex items-center gap-2">
            <span class="text-gray-600">品牌：</span>
            <span class="font-medium">{{ member.motorcycleBrand }}</span>
          </div>
          
          <div v-if="member.motorcycleModel" class="flex items-center gap-2">
            <span class="text-gray-600">型号：</span>
            <span class="font-medium">{{ member.motorcycleModel }}</span>
          </div>
          
          <div v-if="member.plateNumber" class="flex items-center gap-2">
            <span class="text-gray-600">车牌号：</span>
            <el-tag type="success" size="large">{{ member.plateNumber }}</el-tag>
          </div>
          
          <el-empty 
            v-if="!member.motorcycleBrand && !member.motorcycleModel && !member.plateNumber"
            description="暂无车辆信息"
            :image-size="80"
          />
        </div>
      </div>

      <!-- 备注 -->
      <div v-if="member.remark">
        <h4 class="text-base font-semibold mb-3 flex items-center">
          <span class="i-mdi:note-text text-primary mr-2" />
          备注信息
        </h4>
        
        <el-alert
          :title="member.remark"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}
</style>
