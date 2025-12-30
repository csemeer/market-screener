/**
 * Broker Adapter Types and Interfaces
 * Common types for broker integration (Zerodha, Upstox, IBKR)
 */

export type BrokerType = 'ZERODHA' | 'UPSTOX' | 'IBKR';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
export type OrderSide = 'BUY' | 'SELL';
export type ProductType = 'INTRADAY' | 'DELIVERY' | 'MARGIN';
export type OrderStatus = 'PENDING' | 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED';
export type PositionType = 'LONG' | 'SHORT';

/**
 * Broker credentials for authentication
 */
export interface BrokerCredentials {
  brokerId: number;
  brokerType: BrokerType;
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  password?: string;
  totpSecret?: string;
  expiresAt?: Date;
}

/**
 * Order request structure
 */
export interface OrderRequest {
  symbol: string;
  exchange: string;
  orderType: OrderType;
  orderSide: OrderSide;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  productType: ProductType;
  validity?: 'DAY' | 'IOC' | 'GTC';
  disclosedQuantity?: number;
  squareOff?: number;
  stopLoss?: number;
  trailingStopLoss?: number;
  tag?: string;
}

/**
 * Order response from broker
 */
export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  message?: string;
  timestamp: Date;
  averagePrice?: number;
  filledQuantity?: number;
  pendingQuantity?: number;
  rejectionReason?: string;
}

/**
 * Position details
 */
export interface Position {
  symbol: string;
  exchange: string;
  productType: ProductType;
  positionType: PositionType;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  pnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  value: number;
  buyQuantity: number;
  sellQuantity: number;
  buyPrice: number;
  sellPrice: number;
  multiplier?: number;
  overnightQuantity?: number;
  dayQuantity?: number;
}

/**
 * Holdings (delivery positions)
 */
export interface Holding {
  symbol: string;
  exchange: string;
  isin: string;
  quantity: number;
  t1Quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  pnlPercent: number;
  collateralQuantity?: number;
  collateralType?: string;
}

/**
 * Account funds/margin information
 */
export interface Funds {
  availableCash: number;
  usedMargin: number;
  availableMargin: number;
  totalCollateral: number;
  openingBalance: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
}

/**
 * Order history/book
 */
export interface OrderBook {
  orderId: string;
  symbol: string;
  exchange: string;
  orderType: OrderType;
  orderSide: OrderSide;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  averagePrice?: number;
  filledQuantity: number;
  pendingQuantity: number;
  cancelledQuantity: number;
  status: OrderStatus;
  statusMessage?: string;
  orderTimestamp: Date;
  exchangeTimestamp?: Date;
  rejectionReason?: string;
  productType: ProductType;
  validity: string;
  tag?: string;
}

/**
 * Trade book (executed trades)
 */
export interface Trade {
  tradeId: string;
  orderId: string;
  symbol: string;
  exchange: string;
  orderSide: OrderSide;
  quantity: number;
  price: number;
  productType: ProductType;
  timestamp: Date;
  exchangeOrderId?: string;
}

/**
 * Market quote
 */
export interface Quote {
  symbol: string;
  exchange: string;
  lastPrice: number;
  lastQuantity?: number;
  volume: number;
  buyQuantity?: number;
  sellQuantity?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  depth?: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
}

/**
 * Base broker adapter interface
 * All broker implementations must implement these methods
 */
export interface IBrokerAdapter {
  /**
   * Get broker type
   */
  getBrokerType(): BrokerType;

  /**
   * Initialize connection with credentials
   */
  initialize(credentials: BrokerCredentials): Promise<void>;

  /**
   * Check if broker is connected and authenticated
   */
  isConnected(): boolean;

  /**
   * Authenticate/login to broker
   */
  authenticate(): Promise<boolean>;

  /**
   * Refresh access token (if applicable)
   */
  refreshAccessToken(): Promise<boolean>;

  /**
   * Get account funds/margin
   */
  getFunds(): Promise<Funds>;

  /**
   * Get all positions
   */
  getPositions(): Promise<Position[]>;

  /**
   * Get all holdings
   */
  getHoldings(): Promise<Holding[]>;

  /**
   * Place an order
   */
  placeOrder(order: OrderRequest): Promise<OrderResponse>;

  /**
   * Modify an existing order
   */
  modifyOrder(orderId: string, modifications: Partial<OrderRequest>): Promise<OrderResponse>;

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): Promise<OrderResponse>;

  /**
   * Get order book (all orders)
   */
  getOrderBook(): Promise<OrderBook[]>;

  /**
   * Get order status by ID
   */
  getOrderStatus(orderId: string): Promise<OrderBook>;

  /**
   * Get trade book
   */
  getTradeBook(): Promise<Trade[]>;

  /**
   * Get market quote for a symbol
   */
  getQuote(symbol: string, exchange: string): Promise<Quote>;

  /**
   * Get quotes for multiple symbols
   */
  getQuotes(symbols: Array<{ symbol: string; exchange: string }>): Promise<Quote[]>;

  /**
   * Exit a position (place opposite order)
   */
  exitPosition(position: Position): Promise<OrderResponse>;

  /**
   * Exit all positions
   */
  exitAllPositions(): Promise<OrderResponse[]>;

  /**
   * Validate order parameters
   */
  validateOrder(order: OrderRequest): { valid: boolean; errors: string[] };

  /**
   * Get instrument token/ID (broker-specific)
   */
  getInstrumentToken(symbol: string, exchange: string): Promise<string | number>;

  /**
   * Subscribe to live market data (WebSocket)
   */
  subscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void>;

  /**
   * Unsubscribe from market data
   */
  unsubscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void>;

  /**
   * Disconnect and cleanup
   */
  disconnect(): Promise<void>;
}

/**
 * Broker adapter configuration
 */
export interface BrokerAdapterConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  sandbox?: boolean;
}

/**
 * Auto-trading configuration
 */
export interface AutoTradingConfig {
  enabled: boolean;
  brokerId: number;
  defaultProductType: ProductType;
  defaultQuantity?: number;
  maxOrderValue?: number;
  maxPositions?: number;
  riskPerTrade?: number;
  stopLossEnabled?: boolean;
  targetEnabled?: boolean;
  trailingStopEnabled?: boolean;
  allowedSymbols?: string[];
  excludedSymbols?: string[];
  tradingHoursOnly?: boolean;
}

/**
 * Trading signal for auto-trading
 */
export interface TradingSignal {
  symbol: string;
  exchange: string;
  signalType: 'ENTRY' | 'EXIT' | 'STOP_LOSS' | 'TARGET';
  orderSide: OrderSide;
  setupType: string;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: Date;
  metadata?: any;
}
