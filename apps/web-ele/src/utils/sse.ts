// src/utils/sse.ts
import { useAccessStore } from '@vben/stores';

export class NotificationSSE {
  private eventSource: EventSource | null = null;
  private onMessageCallback: ((notification: any) => void) | null = null;
  
  // 🔥 重连配置
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private reconnectTimer: number | null = null;
  private readonly BASE_RECONNECT_DELAY = 1000;
  private readonly MAX_RECONNECT_DELAY = 30000;
  
  // 🔥 连接状态
  private isManualDisconnect = false;
  private connectionStartTime = 0;

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

    this.onMessageCallback = onMessage;
    this.isManualDisconnect = false;

    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      const url = `/api/notification/sse?token=${accessToken}`;
      console.log('🔌 建立 SSE 连接...');
      
      this.connectionStartTime = Date.now();
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        const duration = Date.now() - this.connectionStartTime;
        console.log(`✅ SSE 连接成功 (耗时 ${duration}ms)`);
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener('connected', (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log('🎉 SSE 连接已确认:', {
          userId: data.userId,
          timeout: `${data.timeout / 1000}秒`,
          message: data.message
        });
      });

      this.eventSource.addEventListener('notification', (event: MessageEvent) => {
        const notification = JSON.parse(event.data);
        console.log('📬 收到新通知:', notification.title);
        onMessage(notification);
      });

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE 连接错误:', error);
        
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        
        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      console.error('❌ 建立 SSE 连接失败:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ 达到最大重连次数，请刷新页面或重新登录');
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(
      this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1),
      this.MAX_RECONNECT_DELAY
    );

    console.log(
      `🔄 ${delay / 1000}秒后重连 (第 ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} 次)`
    );

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      if (this.onMessageCallback) {
        console.log('🔄 开始重连...');
        this.connect(this.onMessageCallback);
      }
    }, delay);
  }

  disconnect() {
    console.log('🔌 手动断开 SSE 连接');
    
    this.isManualDisconnect = true;
    this.onMessageCallback = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectAttempts = 0;
  }

  reconnect() {
    console.log('🔄 手动重连 SSE');
    
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.onMessageCallback) {
      this.connect(this.onMessageCallback);
    }
  }

  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  getStatus() {
    if (!this.eventSource) {
      return { 
        state: 'CLOSED', 
        readyState: -1, 
        reconnectAttempts: this.reconnectAttempts 
      };
    }

    // 🔥 修复：明确定义状态映射类型
    const stateMap: Record<number, string> = {
      [EventSource.CONNECTING]: 'CONNECTING',
      [EventSource.OPEN]: 'OPEN',
      [EventSource.CLOSED]: 'CLOSED',
    };

    // 🔥 修复：使用可选链和默认值
    const readyState = this.eventSource.readyState ?? -1;
    const state = stateMap[readyState] ?? 'UNKNOWN';

    return {
      state,
      readyState,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
