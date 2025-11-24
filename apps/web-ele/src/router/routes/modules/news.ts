// apps/web-ele/src/router/routes/modules/news.ts
import type { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    path: '/news',  // ✅ 与数据库的 path 一致
    name: 'DemosNews',
    component: () => import('#/views/demos/news/index.vue'),
    meta: {
      icon: 'mdi:newspaper',
      title: '新闻管理',
      order: 51,  // 在课程管理之后
    },
  },
];
export default routes;
