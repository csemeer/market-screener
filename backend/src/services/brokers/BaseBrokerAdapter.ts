/**
 * Base Broker Adapter
 * Abstract class providing common functionality for all broker adapters
 */

import { loggerService } from '../loggerService';
import {
  IBrokerAdapter,
  BrokerType,
  BrokerCredentials,
  BrokerAdapterConfig,
  OrderRequest,
  OrderResponse,
  Position,
  Holding,
  Funds,
  OrderBook,
  Trade,
  Quote,
} from './types';

export abstract class BaseBrokerAdapter implements IBrokerAdapter {
  protected credentials: BrokerCredentials | null = null;
  protected connected: boolean = false;
  protected config: BrokerAdapterConfig;
  protected brokerType: BrokerType;

  constructor(brokerType: BrokerType, config: BrokerAdapterConfig = {}) {
    this.brokerType = brokerType;
    this.config = {
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      enableLogging: config.enableLogging !== false,
      sandbox: config.sandbox || false,
    };
  }

  abstract getBrokerType(): BrokerType;
  abstract authenticate(): Promise<boolean>;
  abstract refreshAccessToken(): Promise<boolean>;
  abstract getFunds(): Promise<Funds>;
  abstract getPositions(): Promise<Position[]>;
  abstract getHoldings(): Promise<Holding[]>;
  abstract placeOrder(order: OrderRequest): Promise<OrderResponse>;
  abstract modifyOrder(orderId: string, modifications: Partial<OrderRequest>): Promise<OrderResponse>;
  abstract cancelOrder(orderId: string): Promise<OrderResponse>;
  abstract getOrderBook(): Promise<OrderBook[]>;
  abstract getOrderStatus(orderId: string): Promise<OrderBook>;
  abstract getTradeBook(): Promise<Trade[]>;
  abstract getQuote(symbol: string, exchange: string): Promise<Quote>;
  abstract getQuotes(symbols: Array<{ symbol: string; exchange: string }>): Promise<Quote[]>;
  abstract getInstrumentToken(symbol: string, exchange: string): Promise<string | number>;
  abstract subscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void>;
  abstract unsubscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void>;

  /**
   * Initialize adapter with credentials
   */
  async initialize(credentials: BrokerCredentials): Promise<void> {
    this.credentials = credentials;
    this.log('info', 'Initializing broker adapter', {
      broker: this.brokerType,
      userId: credentials.userId,
    });

    try {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Authentication failed');
      }
      this.connected = true;
      this.log('success', 'Broker adapter initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize broker adapter', { error });
      throw error;
    }
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Exit a single position
   */
  async exitPosition(position: Position): Promise<OrderResponse> {
    const order: OrderRequest = {
      symbol: position.symbol,
      exchange: position.exchange,
      orderType: 'MARKET',
      orderSide: position.positionType === 'LONG' ? 'SELL' : 'BUY',
      quantity: Math.abs(position.quantity),
      productType: position.productType,
      tag: 'EXIT_POSITION',
    };

    this.log('info', 'Exiting position', {
      symbol: position.symbol,
      quantity: position.quantity,
      pnl: position.pnl,
    });

    return this.placeOrder(order);
  }

  /**
   * Exit all positions
   */
  async exitAllPositions(): Promise<OrderResponse[]> {
    this.log('info', 'Exiting all positions');

    const positions = await this.getPositions();
    const results: OrderResponse[] = [];

    for (const position of positions) {
      if (position.quantity !== 0) {
        try {
          const result = await this.exitPosition(position);
          results.push(result);
        } catch (error) {
          this.log('error', `Failed to exit position ${position.symbol}`, { error });
          results.push({
            orderId: '',
            status: 'REJECTED',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }
    }

    return results;
  }

  /**
   * Validate order parameters
   */
  validateOrder(order: OrderRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!order.symbol || order.symbol.trim().length === 0) {
      errors.push('Symbol is required');
    }

    if (!order.exchange || order.exchange.trim().length === 0) {
      errors.push('Exchange is required');
    }

    if (!order.orderType) {
      errors.push('Order type is required');
    }

    if (!order.orderSide) {
      errors.push('Order side is required');
    }

    if (!order.quantity || order.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!order.productType) {
      errors.push('Product type is required');
    }

    // Check limit order price
    if (order.orderType === 'LIMIT' && (!order.price || order.price <= 0)) {
      errors.push('Limit orders require a valid price');
    }

    // Check stop loss price
    if (
      (order.orderType === 'STOP_LOSS' || order.orderType === 'STOP_LOSS_MARKET') &&
      (!order.triggerPrice || order.triggerPrice <= 0)
    ) {
      errors.push('Stop loss orders require a valid trigger price');
    }

    // Check stop loss + limit price combination
    if (order.orderType === 'STOP_LOSS' && (!order.price || order.price <= 0)) {
      errors.push('Stop loss limit orders require both trigger price and limit price');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    this.log('info', 'Disconnecting broker adapter');
    this.connected = false;
    this.credentials = null;
  }

  /**
   * Retry logic for API calls
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= (this.config.retryAttempts || 3); attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('warn', `${operationName} failed (attempt ${attempt}/${this.config.retryAttempts})`, {
          error: lastError.message,
        });

        if (attempt < (this.config.retryAttempts || 3)) {
          await this.sleep((this.config.retryDelay || 1000) * attempt);
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Logging utility
   */
  protected log(
    level: 'info' | 'success' | 'warn' | 'error' | 'debug',
    message: string,
    metadata?: any
  ): void {
    if (!this.config.enableLogging) return;

    const logData = {
      broker: this.brokerType,
      ...metadata,
    };

    switch (level) {
      case 'info':
        loggerService.info(message, logData);
        break;
      case 'success':
        loggerService.success(message, logData);
        break;
      case 'warn':
        loggerService.warn(message, logData);
        break;
      case 'error':
        loggerService.error(message, logData);
        break;
      case 'debug':
        loggerService.debug(message, logData);
        break;
    }
  }

  /**
   * Format symbol for broker (override in subclasses if needed)
   */
  protected formatSymbol(symbol: string, exchange: string): string {
    return symbol;
  }

  /**
   * Parse broker-specific error
   */
  protected parseError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  /**
   * Check if access token is expired
   */
  protected isTokenExpired(): boolean {
    if (!this.credentials?.expiresAt) {
      return false;
    }
    return new Date() >= this.credentials.expiresAt;
  }

  /**
   * Ensure authenticated (refresh if needed)
   */
  protected async ensureAuthenticated(): Promise<void> {
    if (!this.connected) {
      throw new Error('Broker adapter not initialized');
    }

    if (this.isTokenExpired()) {
      this.log('info', 'Access token expired, refreshing...');
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        throw new Error('Failed to refresh access token');
      }
    }
  }
}
