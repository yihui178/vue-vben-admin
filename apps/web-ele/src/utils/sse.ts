// src/utils/sse.ts
import { useAccessStore } from '@vben/stores';
import { watch } from 'vue';
export class NotificationSSE {
  private eventSource: EventSource | null = null;
  private onMessageCallback: ((notification: any) => void) | null = null;
  private unwatchToken: (() => void) | null = null;
  /**
   * 建立 SSE 连接
   */
  connect(onMessage: (notification: any) => void) {
    const accessStore = useAccessStore();
    const accessToken = accessStore.accessToken;
    if (!accessToken) {
      console.error('❌ Token 不存在，无法建立 SSE 连接');
      return;
    }
    // 保存回调函数，用于重连
    this.onMessageCallback = onMessage;
    // 关闭旧连接
    this.disconnect();
    // 建立连接
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const url = `${baseUrl}/notification/sse?token=${accessToken}`;
    
    console.log('建立 SSE 连接:', url.substring(0, 100) + '...');
    this.eventSource = new EventSource(url);
    // 连接成功
    this.eventSource.onopen = () => {
      console.log('SSE 连接成功');
    };
    // 接收初始化消息
    this.eventSource.addEventListener('connect', (event: MessageEvent) => {
    });
    // 接收通知
    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      onMessage(JSON.parse(event.data));
    });
    // 连接错误：不自动重连，等待 Token 刷新
    this.eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
      this.eventSource?.close();
      this.eventSource = null;
      // 不自动重连，避免使用过期 Token
    };
    // 监听 Token 变化，自动重连
    this.unwatchToken = watch(
      () => accessStore.accessToken,
      (newToken, oldToken) => {
        if (newToken && newToken !== oldToken && this.onMessageCallback) {
          console.log('Token 已更新，重新建立 SSE 连接');
          this.connect(this.onMessageCallback);
        }
      }
    );
  }
  /**
   * 关闭连接
   */
  disconnect() {
    
    // 停止监听 Token 变化
    if (this.unwatchToken) {
      this.unwatchToken();
      this.unwatchToken = null;
    }
    // 关闭 EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.onMessageCallback = null;
  }
}
