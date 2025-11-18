import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/course',
    name: 'Course',
    component: () => import('#/views/course/index.vue'),
    meta: {
      icon: 'mdi:book-education',
      title: '课程管理',
      order: 50,
    },
  },
];

export default routes;
