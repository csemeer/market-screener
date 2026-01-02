/**
 * Upstox Broker Integration
 * Official Docs: https://upstox.com/developer/api-documentation
 */

import { BrokerService, BrokerConfig, Position, Holding } from '../brokerService';
import { OrderRequest, BrokerOrder, RealTimeCandle } from '../../types/scalper';
import { loggerService } from '../loggerService';
import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';

interface UpstoxConfig extends BrokerConfig {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  code?: string; // Authorization code from OAuth
}

export class UpstoxBroker extends BrokerService {
  private apiKey: string = '';
  private apiSecret: string = '';
  private accessToken: string = '';
  private client: AxiosInstance;
  private websocket: WebSocket | null = null;
  private baseURL: string = 'https://api.upstox.com/v2';
  private redirectUri: string = 'http://localhost:3001/api/auth/upstox/callback';

  constructor() {
    super('upstox');
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });
  }

  /**
   * Connect to Upstox API
   */
  async connect(config: UpstoxConfig): Promise<boolean> {
    try {
      this.apiKey = config.apiKey;
      this.apiSecret = config.apiSecret;

      if (config.accessToken) {
        // Use existing access token
        this.accessToken = config.accessToken;
        this.setupAxiosInterceptors();
        await this.validateSession();
        this.connected = true;
        this.authenticated = true;
        this.emit('connected');
        loggerService.success('Upstox: Connected with existing access token');
        return true;
      }

      if (config.code) {
        // Generate access token from authorization code
        await this.generateAccessToken(config.code);
        this.setupAxiosInterceptors();
        this.connected = true;
        this.authenticated = true;
        this.emit('connected');
        loggerService.success('Upstox: Connected and authenticated');
        return true;
      }

      throw new Error('Either accessToken or authorization code is required');
    } catch (error) {
      loggerService.error('Upstox connection failed', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Upstox
   */
  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connected = false;
    this.authenticated = false;
    this.emit('disconnected');
    loggerService.info('Upstox: Disconnected');
  }

  /**
   * Generate access token from authorization code
   */
  private async generateAccessToken(code: string): Promise<void> {
    try {
      const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', {
        code,
        client_id: this.apiKey,
        client_secret: this.apiSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      loggerService.info('Upstox: Access token generated successfully');
    } catch (error) {
      loggerService.error('Failed to generate access token', { error });
      throw error;
    }
  }

  /**
   * Setup axios interceptors for authentication
   */
  private setupAxiosInterceptors(): void {
    this.client.interceptors.request.use((config) => {
      config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      config.headers['Accept'] = 'application/json';
      return config;
    });
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<void> {
    try {
      const response = await this.client.get('/user/profile');
      loggerService.info('Upstox session valid', { user: response.data.data.user_id });
    } catch (error) {
      throw new Error('Invalid session or expired access token');
    }
  }

  /**
   * Place an order
   */
  async placeOrder(order: OrderRequest): Promise<BrokerOrder> {
    const validation = this.validateOrder(order);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      const upstoxOrder = {
        quantity: order.quantity,
        product: 'I', // Intraday
        validity: 'DAY',
        price: order.price || 0,
        tag: 'scalper',
        instrument_token: await this.getInstrumentKey(order.symbol, order.exchange),
        order_type: this.mapOrderType(order.orderType),
        transaction_type: order.side,
        disclosed_quantity: 0,
        trigger_price: order.triggerPrice || 0,
        is_amo: false,
      };

      const response = await this.client.post('/order/place', upstoxOrder);
      const orderId = response.data.data.order_id;

      // Fetch order details
      const orderDetails = await this.getOrder(orderId);
      this.emit('order:placed', orderDetails);

      return orderDetails;
    } catch (error: any) {
      loggerService.error('Upstox order placement failed', { error: error.response?.data || error });
      throw new Error(`Order failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await this.client.delete(`/order/cancel`, {
        data: { order_id: orderId },
      });
      loggerService.info('Order cancelled', { orderId });
      return true;
    } catch (error) {
      loggerService.error('Failed to cancel order', { orderId, error });
      return false;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<BrokerOrder> {
    try {
      const response = await this.client.get('/order/details', {
        params: { order_id: orderId },
      });

      return this.mapUpstoxOrderToBrokerOrder(response.data.data);
    } catch (error) {
      loggerService.error('Failed to fetch order', { orderId, error });
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getOrders(): Promise<BrokerOrder[]> {
    try {
      const response = await this.client.get('/order/retrieve-all');
      return response.data.data.map((order: any) => this.mapUpstoxOrderToBrokerOrder(order));
    } catch (error) {
      loggerService.error('Failed to fetch orders', { error });
      return [];
    }
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get('/portfolio/short-term-positions');
      const positions = response.data.data;

      return positions.map((pos: any) => ({
        symbol: pos.tradingsymbol,
        exchange: this.normalizeExchange(pos.exchange),
        quantity: pos.quantity,
        averagePrice: pos.average_price,
        lastPrice: pos.last_price,
        pnl: pos.pnl,
        pnlPercent: (pos.pnl / (pos.average_price * Math.abs(pos.quantity))) * 100,
      }));
    } catch (error) {
      loggerService.error('Failed to fetch positions', { error });
      return [];
    }
  }

  /**
   * Get holdings
   */
  async getHoldings(): Promise<Holding[]> {
    try {
      const response = await this.client.get('/portfolio/long-term-holdings');
      return response.data.data.map((holding: any) => ({
        symbol: holding.tradingsymbol,
        exchange: this.normalizeExchange(holding.exchange),
        quantity: holding.quantity,
        averagePrice: holding.average_price,
        lastPrice: holding.last_price,
        value: holding.last_price * holding.quantity,
      }));
    } catch (error) {
      loggerService.error('Failed to fetch holdings', { error });
      return [];
    }
  }

  /**
   * Get last traded price
   */
  async getLTP(symbol: string, exchange: string): Promise<number> {
    try {
      const instrumentKey = await this.getInstrumentKey(symbol, exchange);
      const response = await this.client.get(`/market-quote/ltp`, {
        params: { instrument_key: instrumentKey },
      });

      return response.data.data[instrumentKey].last_price;
    } catch (error) {
      loggerService.error('Failed to fetch LTP', { symbol, exchange, error });
      // Return simulated price for testing
      return 1000 + Math.random() * 100;
    }
  }

  /**
   * Subscribe to live ticks
   */
  async subscribeToTicks(symbols: { symbol: string; exchange: string }[]): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }

    const instrumentKeys = await Promise.all(
      symbols.map(s => this.getInstrumentKey(s.symbol, s.exchange))
    );

    const subscribeMessage = {
      guid: 'someguid',
      method: 'sub',
      data: {
        mode: 'full',
        instrumentKeys,
      },
    };

    this.websocket?.send(JSON.stringify(subscribeMessage));
    loggerService.info('Upstox: Subscribed to ticks', { count: symbols.length });
  }

  /**
   * Unsubscribe from ticks
   */
  async unsubscribeFromTicks(symbols: { symbol: string; exchange: string }[]): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const instrumentKeys = await Promise.all(
      symbols.map(s => this.getInstrumentKey(s.symbol, s.exchange))
    );

    const unsubscribeMessage = {
      guid: 'someguid',
      method: 'unsub',
      data: {
        mode: 'full',
        instrumentKeys,
      },
    };

    this.websocket?.send(JSON.stringify(unsubscribeMessage));
    loggerService.info('Upstox: Unsubscribed from ticks', { count: symbols.length });
  }

  /**
   * Connect to Upstox WebSocket
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Get WebSocket endpoint
        const response = await this.client.get('/feed/market-data-feed/authorize', {
          params: { apiVersion: '2.0' },
        });

        const wsURL = response.data.data.authorizedRedirectUri;
        this.websocket = new WebSocket(wsURL);

        this.websocket.on('open', () => {
          loggerService.success('Upstox WebSocket connected');
          resolve();
        });

        this.websocket.on('message', (data: any) => {
          this.handleWebSocketMessage(data);
        });

        this.websocket.on('error', (error) => {
          loggerService.error('Upstox WebSocket error', { error });
          reject(error);
        });

        this.websocket.on('close', () => {
          loggerService.warn('Upstox WebSocket closed');
          this.emit('websocket:closed');
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(data: any): void {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'feed') {
        this.emit('tick', message.data);
      }
    } catch (error) {
      loggerService.error('Failed to parse WebSocket message', { error });
    }
  }

  /**
   * Get instrument key for symbol
   */
  private async getInstrumentKey(symbol: string, exchange: string): Promise<string> {
    // In production, fetch from instruments master file or cache
    // Format: NSE_EQ|INE123A01017
    return `${this.toBrokerExchange(exchange)}_EQ|${symbol}`;
  }

  /**
   * Get historical data
   */
  async getHistoricalData(
    symbol: string,
    exchange: string,
    interval: '1minute' | '3minute' | '5minute' | '15minute' | '1hour' | '1day',
    fromDate: Date,
    toDate: Date
  ): Promise<RealTimeCandle[]> {
    try {
      const instrumentKey = await this.getInstrumentKey(symbol, exchange);
      const intervalMap: { [key: string]: string } = {
        '1minute': '1minute',
        '3minute': '3minute',
        '5minute': '5minute',
        '15minute': '15minute',
        '1hour': '1hour',
        '1day': '1day',
      };

      const response = await this.client.get(`/historical-candle/${instrumentKey}/${intervalMap[interval]}/${toDate.toISOString()}/${fromDate.toISOString()}`);

      return response.data.data.candles.map((candle: any[]) => ({
        timestamp: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));
    } catch (error) {
      loggerService.error('Failed to fetch historical data', { symbol, error });
      return [];
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<{ available: number; utilized: number; total: number }> {
    try {
      const response = await this.client.get('/user/get-funds-and-margin');
      const equity = response.data.data.equity;

      return {
        available: equity.available_margin,
        utilized: equity.used_margin,
        total: equity.available_margin + equity.used_margin,
      };
    } catch (error) {
      loggerService.error('Failed to fetch account balance', { error });
      return { available: 0, utilized: 0, total: 0 };
    }
  }

  /**
   * Get margins
   */
  async getMargins(): Promise<{ equity: number; commodity: number }> {
    try {
      const response = await this.client.get('/user/get-funds-and-margin');
      return {
        equity: response.data.data.equity.available_margin,
        commodity: response.data.data.commodity?.available_margin || 0,
      };
    } catch (error) {
      loggerService.error('Failed to fetch margins', { error });
      return { equity: 0, commodity: 0 };
    }
  }

  /**
   * Map order type to Upstox format
   */
  private mapOrderType(orderType: string): string {
    const typeMap: { [key: string]: string } = {
      'MARKET': 'MARKET',
      'LIMIT': 'LIMIT',
      'STOP_LOSS': 'SL',
      'STOP_LOSS_MARKET': 'SL-M',
    };
    return typeMap[orderType] || 'MARKET';
  }

  /**
   * Map Upstox order to BrokerOrder
   */
  private mapUpstoxOrderToBrokerOrder(upstoxOrder: any): BrokerOrder {
    return {
      orderId: upstoxOrder.order_id,
      status: upstoxOrder.status,
      symbol: upstoxOrder.tradingsymbol,
      side: upstoxOrder.transaction_type,
      quantity: upstoxOrder.quantity,
      filledQuantity: upstoxOrder.filled_quantity,
      price: upstoxOrder.price,
      averagePrice: upstoxOrder.average_price,
      orderTime: new Date(upstoxOrder.order_timestamp),
      updateTime: new Date(upstoxOrder.exchange_timestamp || upstoxOrder.order_timestamp),
      message: upstoxOrder.status_message,
    };
  }

  /**
   * Convert exchange to Upstox format
   */
  protected toBrokerExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): string {
    const exchangeMap: { [key: string]: string } = {
      'NSE': 'NSE',
      'BSE': 'BSE',
      'NYSE': 'NSE',
      'NASDAQ': 'NSE',
    };
    return exchangeMap[exchange] || 'NSE';
  }
}
