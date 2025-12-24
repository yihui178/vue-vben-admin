import type { RouteRecordRaw } from 'vue-router';
import { BasicLayout } from '#/layouts';
const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'mdi:account-group',
      order: 3,
      title: '会员管理',
    },
    name: 'Member',
    path: '/member',
    children: [
      {
        name: 'MemberList',
        path: '/member/list',
        component: () => import('#/views/demos/member/index.vue'),
        meta: {
          icon: 'mdi:account-group',
          title: '会员列表',
        },
      },
    ],
  },
];
export default routes;
