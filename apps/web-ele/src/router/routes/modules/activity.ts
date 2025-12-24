import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/demos/activity',
    name: 'DemosActivity',
    component: () => import('#/views/demos/activity/index.vue'),
    meta: {
      icon: 'mdi:calendar-check',
      title: '活动报名',
      order: 53,
    },
  },
];

export default routes;
