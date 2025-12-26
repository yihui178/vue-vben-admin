// src/composables/useNotificationSSE.ts
import { onMounted, onUnmounted } from 'vue';
import { NotificationSSE } from '#/utils/sse';
import type { Notification } from '#/api/core/notification';

export function useNotificationSSE(
  onMessage: (notification: Notification) => void
) {
  const sse = new NotificationSSE();

  onMounted(() => sse.connect(onMessage));
  onUnmounted(() => sse.disconnect());

  return { sse };
}
