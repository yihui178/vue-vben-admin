<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';  // ✅ 导入 router
import { ElMessage } from 'element-plus';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { VBEN_DOC_URL, VBEN_GITHUB_URL } from '@vben/constants';
import { useWatermark } from '@vben/hooks';
import { BookOpenText, CircleHelp, SvgGithubIcon } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

import { 
  getNotificationsApi, 
  getUnreadCountApi, 
  markAsReadApi, 
  markAllAsReadApi,
  clearAllNotificationsApi,
  NotificationSSE,
  type Notification as NotificationData
} from '#/api/core/notification';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const router = useRouter();  // ✅ 获取 router 实例
const { destroyWatermark, updateWatermark } = useWatermark();

// ========== 通知相关 ==========
const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);
const sse = new NotificationSSE();

const showDot = computed(() => unreadCount.value > 0);

// 获取通知列表
const fetchNotifications = async () => {
  try {
    const res = await getNotificationsApi(1, 20);
    const data = (res as any).data || res;
    const list: NotificationData[] = data.list || [];
    
    notifications.value = list.map(item => ({
      avatar: getAvatar(item.type),
      date: formatTime(item.createTime),
      isRead: item.isRead,
      message: item.content,
      title: item.title,
      id: item.id,
      type: item.type,  // ✅ 存储 type 用于跳转
    } as any));
    
    unreadCount.value = (await getUnreadCountApi()) || 0;
  } catch (error) {
    console.error('获取通知失败:', error);
  }
};

// 根据类型获取头像
const getAvatar = (type: string) => {
  const map: Record<string, string> = {
    ACTIVITY: '🚴',
    COURSE: '📚',
    NEWS: '📰',
    SYSTEM: '🔔',
  };
  return `https://avatar.vercel.sh/${type}.svg?text=${map[type] || '📢'}`;
};

// 格式化时间
const formatTime = (time: string) => {
  const diff = Date.now() - new Date(time).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
  
  return new Date(time).toLocaleDateString();
};

// ✅ 根据通知类型获取跳转路径
const getRouteByType = (type: string): string => {
  const routeMap: Record<string, string> = {
    ACTIVITY: '/demos/activity',      // 活动管理页面
    COURSE: '/demos/course',          // 课程管理页面
    NEWS: '/demos/news',              // 新闻管理页面
    SYSTEM: '/demos/member',          // 系统设置页面
  };
  return routeMap[type] || '/';  // 默认跳转到首页
};

// SSE 新通知
const handleSSEMessage = (data: NotificationData) => {
  notifications.value.unshift({
    avatar: getAvatar(data.type),
    date: formatTime(data.createTime),
    isRead: false,
    message: data.content,
    title: data.title,
    id: data.id,
    type: data.type,  // ✅ 存储 type
  } as any);

  unreadCount.value++;
  
  ElMessage.info({
    message: `${data.title}: ${data.content}`,
    duration: 5000,
  });
};

// 清空通知
const handleNoticeClear = async () => {
  try {
    await clearAllNotificationsApi();  // ✅ 调用后端删除接口
    notifications.value = [];
    unreadCount.value = 0;
    ElMessage.success('已清空所有通知');
  } catch (error) {
    console.error('清空通知失败:', error);
    ElMessage.error('清空失败，请稍后重试');
  }
};

// 全部已读
const handleMakeAll = async () => {
  try {
    await markAllAsReadApi();
    notifications.value.forEach(item => item.isRead = true);
    unreadCount.value = 0;
    ElMessage.success('全部已标记为已读');
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// ✅ 单个已读 + 跳转
const handleNotificationClick = async (item: NotificationItem) => {
  const id = (item as any).id;
  const type = (item as any).type;
  
  // 1. 标记为已读
  if (!item.isRead && id) {
    try {
      await markAsReadApi(id);
      item.isRead = true;
      unreadCount.value--;
    } catch (error) {
      console.error('标记失败:', error);
    }
  }
  
  // 2. 跳转到对应页面
  if (type) {
    const routePath = getRouteByType(type);
    router.push(routePath);
    console.log('跳转到:', routePath);
  }
};

// 菜单
const menus = computed(() => [
  {
    handler: () => openWindow(VBEN_DOC_URL, { target: '_blank' }),
    icon: BookOpenText,
    text: $t('ui.widgets.document'),
  },
  {
    handler: () => openWindow(VBEN_GITHUB_URL, { target: '_blank' }),
    icon: SvgGithubIcon,
    text: 'GitHub',
  },
  {
    handler: () => openWindow(`${VBEN_GITHUB_URL}/issues`, { target: '_blank' }),
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
]);

const avatar = computed(() => 
  userStore.userInfo?.avatar ?? preferences.app.defaultAvatar
);

const handleLogout = async () => {
  sse.disconnect();
  await authStore.logout(false);
};

// 生命周期
onMounted(() => {
  fetchNotifications();
  sse.connect(handleSSEMessage);
});

onUnmounted(() => sse.disconnect());

// 水印
watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  ({ enable, content }) => {
    if (enable) {
      updateWatermark({
        content: content || 
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  { immediate: true }
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.name"
        :description="userStore.userInfo?.email"
        :tag-text="userStore.userInfo?.role"
        @logout="handleLogout"
      />
    </template>
    
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
        @read="handleNotificationClick"
      />
    </template>
    
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
