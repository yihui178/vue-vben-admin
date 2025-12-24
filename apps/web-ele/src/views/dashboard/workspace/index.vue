<script lang="ts" setup>
import type {
  WorkbenchProjectItem,
  WorkbenchQuickNavItem,
  WorkbenchTodoItem,
  WorkbenchTrendItem,
} from '@vben/common-ui';
import type { EchartsUIType } from '@vben/plugins/echarts';

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { requestClient } from '#/api/request';

const userStore = useUserStore();
const router = useRouter();

// ========== 俱乐部快速入口 ==========
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    color: '#1fdaca',
    icon: 'ion:home-outline',
    title: '首页',
    url: '/dashboard/workspace',
  },
  {
    color: '#bf0c2c',
    icon: 'ion:people-outline',
    title: '会员管理',
    url: '/demos/member',
  },
  {
    color: '#e18525',
    icon: 'ion:bicycle-outline',
    title: '活动管理',
    url: '/demos/activity',
  },
  {
    color: '#3fb27f',
    icon: 'ion:school-outline',
    title: '课程管理',
    url: '/demos/course',
  },
  {
    color: '#4daf1bc9',
    icon: 'ion:newspaper-outline',
    title: '动态管理',
    url: '/demos/news',
  },
  {
    color: '#00d8ff',
    icon: 'ion:bar-chart-outline',
    title: '数据分析',
    url: '/dashboard/analytics',
  },
];

// ========== 推荐活动 ==========
const projectItems = ref<WorkbenchProjectItem[]>([
  {
    title: '周末骑行活动',
    content: '探索城市周边美景，享受骑行乐趣',
    date: '2024-12-15',
    group: '骑行',
    icon: 'ion:bicycle-outline',
    color: '#1fdaca',
    url: '/activity',
  },
  {
    title: '会员聚会',
    content: '俱乐部年度聚会，欢迎所有会员参加',
    date: '2024-12-20',
    group: '聚会',
    icon: 'ion:people-outline',
    color: '#e18525',
    url: '/activity',
  },
  {
    title: '骑行技巧培训',
    content: '专业教练指导，提升骑行技能',
    date: '2024-12-18',
    group: '培训',
    icon: 'ion:school-outline',
    color: '#3fb27f',
    url: '/course',
  },
  {
    title: '骑行比赛',
    content: '俱乐部内部友谊赛，欢迎报名',
    date: '2024-12-25',
    group: '比赛',
    icon: 'ion:trophy-outline',
    color: '#bf0c2c',
    url: '/activity',
  },
]);

// ========== 待办事项 ==========
const todoItems = ref<WorkbenchTodoItem[]>([
  {
    completed: false,
    content: '审核新报名的活动参与者',
    date: new Date().toISOString(),
    title: '活动报名审核',
  },
  {
    completed: false,
    content: '检查本周即将开始的培训课程',
    date: new Date().toISOString(),
    title: '培训课程安排',
  },
  {
    completed: false,
    content: '审核会员提交的动态内容',
    date: new Date().toISOString(),
    title: '动态内容审核',
  },
  {
    completed: true,
    content: '更新俱乐部活动日历',
    date: new Date().toISOString(),
    title: '活动日历更新',
  },
]);

// ========== 俱乐部动态 ==========
const trendItems = ref<WorkbenchTrendItem[]>([
  {
    avatar: 'svg:avatar-1',
    title: '张三',
    content: '报名参加了 <a>周末骑行活动</a>',
    date: '刚刚',
  },
  {
    avatar: 'svg:avatar-2',
    title: '李四',
    content: '发布了新动态 <a>今日骑行记录</a>',
    date: '1小时前',
  },
  {
    avatar: 'svg:avatar-3',
    title: '王五',
    content: '完成了 <a>骑行技巧培训</a>',
    date: '2小时前',
  },
  {
    avatar: 'svg:avatar-4',
    title: '赵六',
    content: '加入了俱乐部，成为新会员',
    date: '3小时前',
  },
  {
    avatar: 'svg:avatar-1',
    title: '孙七',
    content: '评论了 <a>周末骑行路线推荐</a>',
    date: '1天前',
  },
]);

// ========== 会员统计图表 ==========
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const initChart = () => {
  renderEcharts({
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: '2%',
      left: 'center',
    },
    series: [
      {
        name: '会员类型',
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { name: '普通会员', value: 150 },
          { name: '高级会员', value: 80 },
          { name: '终身会员', value: 30 },
        ],
        color: ['#5ab1ef', '#2ec7c9', '#ffb980'],
      },
    ],
  });
};

function navTo(nav: WorkbenchProjectItem | WorkbenchQuickNavItem) {
  if (nav.url?.startsWith('/')) {
    router.push(nav.url).catch((error) => {
      console.error('导航失败:', error);
    });
  }
}

onMounted(() => {
  initChart();
});
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        欢迎回来, {{ userStore.userInfo?.realName }}！让我们一起享受骑行的乐趣 🏍️
      </template>
      <template #description>
        今日晴，20℃ - 32℃，适合骑行！
      </template>
    </WorkbenchHeader>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <WorkbenchProject 
          :items="projectItems" 
          title="推荐活动" 
          @click="navTo" 
        />
        <WorkbenchTrends 
          :items="trendItems" 
          class="mt-5" 
          title="俱乐部动态" 
        />
      </div>
      <div class="w-full lg:w-2/5"> 
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷入口"
          @click="navTo"
        />
        <WorkbenchTodo 
          :items="todoItems" 
          class="mt-5" 
          title="待办事项" 
        />
        <AnalysisChartCard class="mt-5" title="会员统计">
          <EchartsUI ref="chartRef" />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>
