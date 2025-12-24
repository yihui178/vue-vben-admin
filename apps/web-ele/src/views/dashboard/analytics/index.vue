<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { ref, onMounted, markRaw } from 'vue';
import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';
import { requestClient } from '#/api/request';


import ActivityChart from './activity-chart.vue';
import RidingChart from './riding-chart.vue';
import GenderChart from './gender-chart.vue';
import TrendChart from './trend-chart.vue';
import CourseChart from './course-chart.vue';

// ========== 核心指标 ==========
const overviewItems = ref<AnalysisOverviewItem[]>([
  {
    icon: markRaw(SvgCardIcon),
    title: '活跃会员',
    totalTitle: '累计会员',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgCakeIcon),
    title: '本月活动',
    totalTitle: '累计活动',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgDownloadIcon),
    title: '参与人次',
    totalTitle: '累计参与',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgBellIcon),
    title: '新手学员',
    totalTitle: '累计学员',
    totalValue: 0,
    value: 0,
  },
]);


const chartTabs: TabOption[] = [
  { label: '活动类型统计', value: 'activity' },
  { label: '骑行里程统计', value: 'riding' },
];

// ========== 获取数据 ==========
const fetchData = async () => {
  try {
    const memberRes = await requestClient.get('/member/page', { 
      params: { page: 1, pageSize: 1 } 
    });
    const activityRes = await requestClient.get('/activity/page', { 
      params: { page: 1, pageSize: 1 } 
    });
    const courseRes = await requestClient.get('/course/page', { 
      params: { page: 1, pageSize: 1 } 
    });
    
    const memberTotal = parseInt(memberRes.total || '0', 10);
    const activityTotal = parseInt(activityRes.total || '0', 10);
    const courseTotal = parseInt(courseRes.total || '0', 10);
    
    const items = overviewItems.value;
    items[0]!.totalValue = memberTotal;
    items[0]!.value = Math.floor(memberTotal * 0.8);
    items[1]!.totalValue = activityTotal;
    items[1]!.value = 2;
    items[2]!.totalValue = memberTotal * 8;
    items[2]!.value = memberTotal * 2;
    items[3]!.totalValue = courseTotal * 5;
    items[3]!.value = courseTotal;
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-5">
    <!-- 核心指标卡片 -->
    <AnalysisOverview :items="overviewItems" />
    

    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #activity>
        <ActivityChart />
      </template>
      <template #riding>
        <RidingChart />
      </template>
    </AnalysisChartsTabs>

    <!-- 底部三个图表 -->
    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard 
        class="mt-5 md:mr-4 md:mt-0 md:w-1/3" 
        title="会员性别分布"
      >
        <GenderChart />
      </AnalysisChartCard>
      
      <AnalysisChartCard 
        class="mt-5 md:mr-4 md:mt-0 md:w-1/3" 
        title="活动报名趋势"
      >
        <TrendChart />
      </AnalysisChartCard>
      
      <AnalysisChartCard 
        class="mt-5 md:mt-0 md:w-1/3" 
        title="热门课程排行"
      >
        <CourseChart />
      </AnalysisChartCard>
    </div>
  </div>
</template>
