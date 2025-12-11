import type { RouteRecordRaw } from 'vue-router';
import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';
const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:settings',
      order: 500,
      title: $t('page.system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemUser',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.system.user'),
        },
      },
    ],
  },
];
export default routes;
