// src/composables/useNotificationSSE.ts
import { onMounted, onUnmounted, ref } from 'vue';
import { NotificationSSE } from '#/utils/sse';
import type { Notification } from '#/api/core/notification';

export function useNotificationSSE(
  onMessage: (notification: Notification) => void
) {
  const sse = new NotificationSSE();
  const isConnected = ref(false);
  const reconnectCount = ref(0);

  let statusCheckInterval: number;

  onMounted(() => {
    console.log('🚀 组件挂载，初始化 SSE 连接');
    sse.connect(onMessage);

    statusCheckInterval = window.setInterval(() => {
      const status = sse.getStatus();
      isConnected.value = sse.isConnected();
      reconnectCount.value = status.reconnectAttempts;
      
      if (!isConnected.value && status.state !== 'CONNECTING') {
        console.warn('⚠️ SSE 连接已断开:', status);
      }
    }, 10000);
  });

  onUnmounted(() => {
    console.log('🛑 组件卸载，断开 SSE 连接');
    sse.disconnect();
    
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
  });

  return { 
    sse, 
    isConnected,
    reconnectCount,
    reconnect: () => sse.reconnect(),
    getStatus: () => sse.getStatus()
  };
}
