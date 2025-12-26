// #/api/core/notification.ts
import { requestClient } from '#/api/request';

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createTime: string;
}

/** 获取通知列表 */
export async function getNotificationsApi(page: number, pageSize: number) {
  return requestClient.get<any>('/notification/page', {
    params: { page, pageSize },
  });
}

/** 获取未读数量 */
export async function getUnreadCountApi() {
  return requestClient.get<number>('/notification/unread-count');
}

/** 标记为已读 */
export async function markAsReadApi(id: number) {
  return requestClient.post('/notification/mark-read', { id });
}

/** 全部标记为已读 */
export async function markAllAsReadApi() {
  return requestClient.post('/notification/mark-all-read');
}

/**
 * 清空当前用户的所有通知
 */
export async function clearAllNotificationsApi() {
  return requestClient.post('/notification/clear');
}

// ✅ 导出 SSE 相关
export { NotificationSSE } from '#/utils/sse';
export { useNotificationSSE } from '#/composables/useNotificationSSE'; // 如果使用 composable
