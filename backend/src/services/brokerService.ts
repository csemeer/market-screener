/**
 * Broker Service - Base class for broker integrations
 * Supports Zerodha, Upstox, and IBKR
 */

import { EventEmitter } from 'events';
import { OrderRequest, BrokerOrder, RealTimeCandle } from '../types/scalper';

export interface BrokerConfig {
  broker: 'zerodha' | 'upstox' | 'ibkr';
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface Position {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface Holding {
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  value: number;
}

/**
 * Abstract base class for all broker integrations
 */
export abstract class BrokerService extends EventEmitter {
  protected broker: 'zerodha' | 'upstox' | 'ibkr';
  protected connected: boolean = false;
  protected authenticated: boolean = false;

  constructor(broker: 'zerodha' | 'upstox' | 'ibkr') {
    super();
    this.broker = broker;
  }

  /**
   * Connect to broker API
   */
  abstract connect(config: BrokerConfig): Promise<boolean>;

  /**
   * Disconnect from broker
   */
  abstract disconnect(): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Place a market order
   */
  abstract placeOrder(order: OrderRequest): Promise<BrokerOrder>;

  /**
   * Cancel an order
   */
  abstract cancelOrder(orderId: string): Promise<boolean>;

  /**
   * Get order status
   */
  abstract getOrder(orderId: string): Promise<BrokerOrder>;

  /**
   * Get all orders for the day
   */
  abstract getOrders(): Promise<BrokerOrder[]>;

  /**
   * Get current positions
   */
  abstract getPositions(): Promise<Position[]>;

  /**
   * Get holdings
   */
  abstract getHoldings(): Promise<Holding[]>;

  /**
   * Get last traded price (LTP) for a symbol
   */
  abstract getLTP(symbol: string, exchange: string): Promise<number>;

  /**
   * Subscribe to live ticks
   */
  abstract subscribeToTicks(symbols: { symbol: string; exchange: string }[]): Promise<void>;

  /**
   * Unsubscribe from ticks
   */
  abstract unsubscribeFromTicks(symbols: { symbol: string; exchange: string }[]): Promise<void>;

  /**
   * Get historical data
   */
  abstract getHistoricalData(
    symbol: string,
    exchange: string,
    interval: '1minute' | '3minute' | '5minute' | '15minute' | '1hour' | '1day',
    fromDate: Date,
    toDate: Date
  ): Promise<RealTimeCandle[]>;

  /**
   * Get account balance
   */
  abstract getAccountBalance(): Promise<{
    available: number;
    utilized: number;
    total: number;
  }>;

  /**
   * Get account margins
   */
  abstract getMargins(): Promise<{
    equity: number;
    commodity: number;
  }>;

  /**
   * Validate order before placing
   */
  protected validateOrder(order: OrderRequest): { valid: boolean; error?: string } {
    if (!order.symbol || !order.exchange) {
      return { valid: false, error: 'Symbol and exchange are required' };
    }

    if (!order.side || !['BUY', 'SELL'].includes(order.side)) {
      return { valid: false, error: 'Invalid order side' };
    }

    if (!order.quantity || order.quantity <= 0) {
      return { valid: false, error: 'Invalid quantity' };
    }

    if (order.orderType === 'LIMIT' && (!order.price || order.price <= 0)) {
      return { valid: false, error: 'Price required for limit orders' };
    }

    if (
      (order.orderType === 'STOP_LOSS' || order.orderType === 'STOP_LOSS_MARKET') &&
      (!order.triggerPrice || order.triggerPrice <= 0)
    ) {
      return { valid: false, error: 'Trigger price required for stop loss orders' };
    }

    return { valid: true };
  }

  /**
   * Convert broker-specific exchange codes to our format
   */
  protected normalizeExchange(brokerExchange: string): 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' {
    const exchangeMap: { [key: string]: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' } = {
      'NSE': 'NSE',
      'BSE': 'BSE',
      'NFO': 'NSE', // F&O
      'BFO': 'BSE', // F&O
      'MCX': 'NSE', // Commodity
      'NYSE': 'NYSE',
      'NASDAQ': 'NASDAQ',
    };

    return exchangeMap[brokerExchange] || 'NSE';
  }

  /**
   * Convert our exchange format to broker-specific codes
   */
  protected toBrokerExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): string {
    // Default mapping - override in specific broker implementations if needed
    return exchange;
  }
}

/**
 * Paper Trading Broker - For testing without real orders
 */
export class PaperBroker extends BrokerService {
  private paperPositions: Map<string, Position> = new Map();
  private paperOrders: Map<string, BrokerOrder> = new Map();
  private orderCounter: number = 1;
  private balance: number = 1000000; // 10 lakh starting capital

  constructor() {
    super('zerodha'); // Use zerodha format for compatibility
  }

  async connect(config: BrokerConfig): Promise<boolean> {
    this.connected = true;
    this.authenticated = true;
    this.emit('connected');
    console.log('📄 Paper Trading Mode: Connected');
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.authenticated = false;
    this.emit('disconnected');
    console.log('📄 Paper Trading Mode: Disconnected');
  }

  async placeOrder(order: OrderRequest): Promise<BrokerOrder> {
    const validation = this.validateOrder(order);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const orderId = `PAPER_${this.orderCounter++}`;
    const currentPrice = await this.getLTP(order.symbol, order.exchange);

    const brokerOrder: BrokerOrder = {
      orderId,
      status: 'COMPLETE', // Paper orders fill immediately
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      filledQuantity: order.quantity,
      price: order.price || currentPrice,
      averagePrice: order.price || currentPrice,
      orderTime: new Date(),
      updateTime: new Date(),
    };

    this.paperOrders.set(orderId, brokerOrder);

    // Update paper positions
    const posKey = `${order.symbol}_${order.exchange}`;
    const currentPos = this.paperPositions.get(posKey);

    if (order.side === 'BUY') {
      if (currentPos) {
        const totalQty = currentPos.quantity + order.quantity;
        const totalCost =
          currentPos.quantity * currentPos.averagePrice +
          order.quantity * brokerOrder.averagePrice!;
        currentPos.quantity = totalQty;
        currentPos.averagePrice = totalCost / totalQty;
      } else {
        this.paperPositions.set(posKey, {
          symbol: order.symbol,
          exchange: order.exchange,
          quantity: order.quantity,
          averagePrice: brokerOrder.averagePrice!,
          lastPrice: brokerOrder.averagePrice!,
          pnl: 0,
          pnlPercent: 0,
        });
      }
    } else if (order.side === 'SELL' && currentPos) {
      currentPos.quantity -= order.quantity;
      if (currentPos.quantity <= 0) {
        this.paperPositions.delete(posKey);
      }
    }

    console.log(`📄 Paper Order Filled: ${order.side} ${order.quantity} ${order.symbol} @ ${brokerOrder.averagePrice}`);
    this.emit('order:filled', brokerOrder);

    return brokerOrder;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.paperOrders.get(orderId);
    if (order) {
      order.status = 'CANCELLED';
      return true;
    }
    return false;
  }

  async getOrder(orderId: string): Promise<BrokerOrder> {
    const order = this.paperOrders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  }

  async getOrders(): Promise<BrokerOrder[]> {
    return Array.from(this.paperOrders.values());
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.paperPositions.values());
  }

  async getHoldings(): Promise<Holding[]> {
    return [];
  }

  async getLTP(symbol: string, exchange: string): Promise<number> {
    // Return mock LTP - in production, fetch from market data service
    return 100 + Math.random() * 1000;
  }

  async subscribeToTicks(symbols: { symbol: string; exchange: string }[]): Promise<void> {
    console.log('📄 Paper Trading: Subscribed to ticks', symbols.map(s => s.symbol));
  }

  async unsubscribeFromTicks(symbols: { symbol: string; exchange: string }[]): Promise<void> {
    console.log('📄 Paper Trading: Unsubscribed from ticks', symbols.map(s => s.symbol));
  }

  async getHistoricalData(
    symbol: string,
    exchange: string,
    interval: string,
    fromDate: Date,
    toDate: Date
  ): Promise<RealTimeCandle[]> {
    // Return mock historical data
    return [];
  }

  async getAccountBalance(): Promise<{ available: number; utilized: number; total: number }> {
    const utilized = Array.from(this.paperPositions.values()).reduce((sum, pos) => {
      return sum + pos.quantity * pos.averagePrice;
    }, 0);

    return {
      available: this.balance - utilized,
      utilized,
      total: this.balance,
    };
  }

  async getMargins(): Promise<{ equity: number; commodity: number }> {
    return {
      equity: this.balance,
      commodity: 0,
    };
  }
}

/**
 * Factory function to create broker instances
 */
export function createBroker(broker: 'zerodha' | 'upstox' | 'ibkr' | 'paper'): BrokerService {
  if (broker === 'paper') {
    return new PaperBroker();
  }

  // For now, return paper broker for all
  // In production, import and return specific broker implementations
  console.warn(`⚠️  Real broker "${broker}" not implemented yet. Using Paper Trading mode.`);
  return new PaperBroker();

  // TODO: Implement real broker integrations
  // switch (broker) {
  //   case 'zerodha':
  //     return new ZerodhaBroker();
  //   case 'upstox':
  //     return new UpstoxBroker();
  //   case 'ibkr':
  //     return new IBKRBroker();
  //   default:
  //     throw new Error(`Unsupported broker: ${broker}`);
  // }
}
