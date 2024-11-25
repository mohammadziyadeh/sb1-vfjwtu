import { fetchPrice } from './marketData';

interface WebSocketOptions {
  maxRetries?: number;
  retryInterval?: number;
  fallbackInterval?: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocket>;
  private retryCount: Map<string, number>;
  private fallbackIntervals: Map<string, NodeJS.Timeout>;
  private maxRetries: number;
  private retryInterval: number;
  private fallbackInterval: number;
  private reconnectTimeouts: Map<string, NodeJS.Timeout>;
  private listeners: Map<string, Set<(data: any) => void>>;
  private errorListeners: Map<string, Set<(error: Error) => void>>;

  private constructor(options: WebSocketOptions = {}) {
    this.connections = new Map();
    this.retryCount = new Map();
    this.fallbackIntervals = new Map();
    this.reconnectTimeouts = new Map();
    this.listeners = new Map();
    this.errorListeners = new Map();
    this.maxRetries = options.maxRetries || 5;
    this.retryInterval = options.retryInterval || 2000;
    this.fallbackInterval = options.fallbackInterval || 5000;
  }

  static getInstance(options?: WebSocketOptions): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager(options);
    }
    return WebSocketManager.instance;
  }

  subscribe(symbol: string, callback: (data: any) => void): () => void {
    const lowerSymbol = symbol.toLowerCase();
    
    if (!this.listeners.has(lowerSymbol)) {
      this.listeners.set(lowerSymbol, new Set());
    }
    
    this.listeners.get(lowerSymbol)!.add(callback);
    
    if (!this.connections.has(lowerSymbol)) {
      this.connectWebSocket(lowerSymbol);
    }

    return () => {
      const listeners = this.listeners.get(lowerSymbol);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(lowerSymbol);
          this.cleanup(lowerSymbol);
        }
      }
    };
  }

  on(event: string, callback: (error: Error) => void): void {
    if (!this.errorListeners.has(event)) {
      this.errorListeners.set(event, new Set());
    }
    this.errorListeners.get(event)!.add(callback);
  }

  off(event: string, callback: (error: Error) => void): void {
    const listeners = this.errorListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.errorListeners.delete(event);
      }
    }
  }

  private emitError(symbol: string, error: Error): void {
    const event = `error:${symbol}`;
    const listeners = this.errorListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(error));
    }
  }

  private emitData(symbol: string, data: any): void {
    const listeners = this.listeners.get(symbol);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  private async connectWebSocket(symbol: string): Promise<void> {
    try {
      const existingTimeout = this.reconnectTimeouts.get(symbol);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.reconnectTimeouts.delete(symbol);
      }

      const initialData = await fetchPrice(symbol);
      this.emitData(symbol, {
        c: initialData.price.toString(),
        P: initialData.priceChange.toString(),
        v: initialData.volume.toString()
      });

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);
      
      ws.onopen = () => {
        this.retryCount.set(symbol, 0);
        this.clearFallbackInterval(symbol);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emitData(symbol, data);
        } catch {
          this.handleConnectionError(symbol);
        }
      };

      ws.onerror = () => {
        this.handleConnectionError(symbol);
      };

      ws.onclose = () => {
        this.handleConnectionError(symbol);
      };

      this.connections.set(symbol, ws);
    } catch {
      this.handleConnectionError(symbol);
    }
  }

  private setupFallbackInterval(symbol: string): void {
    if (!this.fallbackIntervals.has(symbol)) {
      const intervalId = setInterval(async () => {
        try {
          const data = await fetchPrice(symbol);
          this.emitData(symbol, {
            c: data.price.toString(),
            P: data.priceChange.toString(),
            v: data.volume.toString()
          });
        } catch {
          this.emitError(symbol, new Error('Failed to fetch price'));
        }
      }, this.fallbackInterval);
      
      this.fallbackIntervals.set(symbol, intervalId);
    }
  }

  private clearFallbackInterval(symbol: string): void {
    const intervalId = this.fallbackIntervals.get(symbol);
    if (intervalId) {
      clearInterval(intervalId);
      this.fallbackIntervals.delete(symbol);
    }
  }

  private async handleConnectionError(symbol: string): Promise<void> {
    const retries = this.retryCount.get(symbol) || 0;
    
    if (retries < this.maxRetries) {
      this.retryCount.set(symbol, retries + 1);
      
      const timeoutId = setTimeout(() => {
        this.reconnect(symbol);
      }, this.retryInterval * Math.pow(2, retries));
      
      this.reconnectTimeouts.set(symbol, timeoutId);
    } else {
      this.setupFallbackInterval(symbol);
      this.emitError(symbol, new Error('WebSocket connection failed'));
    }
  }

  private reconnect(symbol: string): void {
    const ws = this.connections.get(symbol);
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
    this.connections.delete(symbol);
    this.connectWebSocket(symbol);
  }

  private cleanup(symbol: string): void {
    const ws = this.connections.get(symbol);
    if (ws) {
      ws.close();
      this.connections.delete(symbol);
    }
    
    const timeoutId = this.reconnectTimeouts.get(symbol);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.reconnectTimeouts.delete(symbol);
    }
    
    this.retryCount.delete(symbol);
    this.clearFallbackInterval(symbol);
  }

  closeAll(): void {
    for (const [symbol, ws] of this.connections) {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
      this.connections.delete(symbol);
      
      const timeoutId = this.reconnectTimeouts.get(symbol);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.reconnectTimeouts.delete(symbol);
      }
      
      this.retryCount.delete(symbol);
      this.clearFallbackInterval(symbol);
    }
    
    this.listeners.clear();
    this.errorListeners.clear();
  }
}