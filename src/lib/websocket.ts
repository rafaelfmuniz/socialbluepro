/**
 * WebSocket Configuration and Utilities
 * 
 * This file contains the WebSocket setup for real-time communication.
 * Currently, this is prepared for future implementation but not active.
 * 
 * To enable WebSocket functionality:
 * 1. Uncomment the WebSocket client code below
 * 2. Set up a WebSocket server (e.g., using Socket.io, ws, or Pusher)
 * 3. Configure the connection URL in your environment variables
 * 4. Update the components to use WebSocket events instead of polling
 */

// WebSocket connection URL (configure via environment variables)
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

/**
 * WebSocket Client Class
 * Handles connection management and event listeners
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Uncomment when WebSocket server is ready
      /*
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('[WS] Connected to server');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('[WS] Connection closed');
        this.isConnecting = false;
        this.emit('disconnected');
        this.attemptReconnect();
      };
      */

      console.log('[WS] WebSocket connection disabled - polling is active');
    } catch (error) {
      console.error('[WS] Failed to connect:', error);
      this.isConnecting = false;
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Send a message to the server
   */
  send(type: string, payload?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WS] Cannot send message - not connected');
    }
  }

  /**
   * Register an event listener
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener
   */
  off(event: string, callback: Function) {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to all registered listeners
   */
  private emit(event: string, data?: any) {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Check if connected to the server
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

/**
 * Get the WebSocket client singleton instance
 */
export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
}

/**
 * Initialize WebSocket connection
 * Call this in your app initialization
 */
export function initializeWebSocket() {
  const client = getWebSocketClient();
  client.connect();
  return client;
}

/**
 * Example usage in components:
 * 
 * ```tsx
 * import { useEffect } from 'react';
 * import { getWebSocketClient } from '@/lib/websocket';
 * 
 * function MyComponent() {
 *   useEffect(() => {
 *     const ws = getWebSocketClient();
 *     
 *     // Listen for lead updates
 *     ws.on('lead:updated', (data) => {
 *       console.log('Lead updated:', data);
 *       // Update local state
 *     });
 *     
 *     // Listen for new leads
 *     ws.on('lead:created', (data) => {
 *       console.log('New lead:', data);
 *       // Update local state
 *     });
 *     
 *     return () => {
 *       ws.off('lead:updated');
 *       ws.off('lead:created');
 *     };
 *   }, []);
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
