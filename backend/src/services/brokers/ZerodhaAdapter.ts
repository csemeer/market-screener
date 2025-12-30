/**
 * Zerodha Kite Connect Adapter
 * Implementation for Zerodha broker integration
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { BaseBrokerAdapter } from './BaseBrokerAdapter';
import {
  BrokerType,
  BrokerAdapterConfig,
  OrderRequest,
  OrderResponse,
  Position,
  Holding,
  Funds,
  OrderBook,
  Trade,
  Quote,
  OrderType,
  OrderSide,
  ProductType,
  OrderStatus,
} from './types';

export class ZerodhaAdapter extends BaseBrokerAdapter {
  private apiClient: AxiosInstance;
  private readonly API_BASE_URL = 'https://api.kite.trade';
  private readonly LOGIN_URL = 'https://kite.zerodha.com/connect/login';

  constructor(config: BrokerAdapterConfig = {}) {
    super('ZERODHA', config);

    this.apiClient = axios.create({
      baseURL: this.API_BASE_URL,
      timeout: this.config.timeout,
      headers: {
        'X-Kite-Version': '3',
      },
    });
  }

  getBrokerType(): BrokerType {
    return 'ZERODHA';
  }

  /**
   * Authenticate with Zerodha
   * Requires user to login via browser and provide request_token
   */
  async authenticate(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('Credentials not provided');
    }

    try {
      // Check if we already have an access token
      if (this.credentials.accessToken && !this.isTokenExpired()) {
        this.apiClient.defaults.headers.common['Authorization'] =
          `token ${this.credentials.apiKey}:${this.credentials.accessToken}`;
        this.connected = true;
        return true;
      }

      // Generate login URL for user
      const loginUrl = `${this.LOGIN_URL}?api_key=${this.credentials.apiKey}`;
      this.log('info', 'Please login via browser and provide request_token', { loginUrl });

      // In production, implement OAuth flow:
      // 1. Redirect user to loginUrl
      // 2. User logs in and authorizes app
      // 3. Zerodha redirects back with request_token
      // 4. Exchange request_token for access_token

      // For now, assume we have a request_token in credentials
      if (!this.credentials.refreshToken) {
        throw new Error('Request token not provided. Please complete OAuth flow first.');
      }

      // Generate access token
      const checksum = crypto
        .createHash('sha256')
        .update(this.credentials.apiKey + this.credentials.refreshToken + this.credentials.apiSecret)
        .digest('hex');

      const response = await axios.post(`${this.API_BASE_URL}/session/token`, {
        api_key: this.credentials.apiKey,
        request_token: this.credentials.refreshToken,
        checksum: checksum,
      });

      if (response.data && response.data.data && response.data.data.access_token) {
        this.credentials.accessToken = response.data.data.access_token;

        // Access token expires at market close (3:30 PM IST)
        const expiresAt = new Date();
        expiresAt.setHours(15, 30, 0, 0); // 3:30 PM
        if (expiresAt < new Date()) {
          expiresAt.setDate(expiresAt.getDate() + 1); // Next day
        }
        this.credentials.expiresAt = expiresAt;

        this.apiClient.defaults.headers.common['Authorization'] =
          `token ${this.credentials.apiKey}:${this.credentials.accessToken}`;

        this.log('success', 'Authenticated with Zerodha successfully');
        return true;
      }

      return false;
    } catch (error) {
      this.log('error', 'Authentication failed', { error: this.parseError(error) });
      return false;
    }
  }

  /**
   * Refresh access token (Zerodha requires re-login daily)
   */
  async refreshAccessToken(): Promise<boolean> {
    // Zerodha doesn't support token refresh - requires re-login
    this.log('warn', 'Zerodha requires daily re-login. Cannot refresh token.');
    return false;
  }

  /**
   * Get account funds
   */
  async getFunds(): Promise<Funds> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get('/user/margins');
    const equity = response.data.data.equity;

    return {
      availableCash: equity.available.cash,
      usedMargin: equity.utilised.debits,
      availableMargin: equity.available.live_balance,
      totalCollateral: equity.available.collateral,
      openingBalance: equity.net,
      unrealizedPnl: 0, // Not directly provided
      realizedPnl: 0, // Not directly provided
      totalPnl: 0,
    };
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<Position[]> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get('/portfolio/positions');
    const positions = response.data.data.net;

    return positions.map((pos: any) => ({
      symbol: pos.tradingsymbol,
      exchange: pos.exchange,
      productType: this.mapProductType(pos.product),
      positionType: pos.quantity > 0 ? 'LONG' : 'SHORT',
      quantity: pos.quantity,
      averagePrice: pos.average_price,
      lastPrice: pos.last_price,
      pnl: pos.pnl,
      pnlPercent: (pos.pnl / (pos.average_price * Math.abs(pos.quantity))) * 100,
      realizedPnl: pos.realised,
      unrealizedPnl: pos.unrealised,
      value: pos.value,
      buyQuantity: pos.buy_quantity,
      sellQuantity: pos.sell_quantity,
      buyPrice: pos.buy_price,
      sellPrice: pos.sell_price,
      multiplier: pos.multiplier,
      overnightQuantity: pos.overnight_quantity,
      dayQuantity: pos.day_buy_quantity - pos.day_sell_quantity,
    }));
  }

  /**
   * Get all holdings
   */
  async getHoldings(): Promise<Holding[]> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get('/portfolio/holdings');
    const holdings = response.data.data;

    return holdings.map((holding: any) => ({
      symbol: holding.tradingsymbol,
      exchange: holding.exchange,
      isin: holding.isin,
      quantity: holding.quantity,
      t1Quantity: holding.t1_quantity,
      averagePrice: holding.average_price,
      lastPrice: holding.last_price,
      pnl: holding.pnl,
      pnlPercent: (holding.pnl / (holding.average_price * holding.quantity)) * 100,
      collateralQuantity: holding.collateral_quantity,
      collateralType: holding.collateral_type,
    }));
  }

  /**
   * Place an order
   */
  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    const validation = this.validateOrder(order);
    if (!validation.valid) {
      throw new Error(`Invalid order: ${validation.errors.join(', ')}`);
    }

    const orderParams: any = {
      tradingsymbol: order.symbol,
      exchange: order.exchange,
      transaction_type: order.orderSide,
      order_type: this.mapOrderType(order.orderType),
      quantity: order.quantity,
      product: this.mapProductTypeToZerodha(order.productType),
      validity: order.validity || 'DAY',
    };

    if (order.price) {
      orderParams.price = order.price;
    }

    if (order.triggerPrice) {
      orderParams.trigger_price = order.triggerPrice;
    }

    if (order.disclosedQuantity) {
      orderParams.disclosed_quantity = order.disclosedQuantity;
    }

    if (order.tag) {
      orderParams.tag = order.tag;
    }

    try {
      const response = await this.apiClient.post('/orders/regular', orderParams);

      return {
        orderId: response.data.data.order_id,
        status: 'PENDING',
        message: 'Order placed successfully',
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.log('error', 'Failed to place order', {
        error: this.parseError(error),
        order,
      });

      return {
        orderId: '',
        status: 'REJECTED',
        message: this.parseError(error),
        timestamp: new Date(),
        rejectionReason: this.parseError(error),
      };
    }
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(orderId: string, modifications: Partial<OrderRequest>): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    const modifyParams: any = {};

    if (modifications.orderType) {
      modifyParams.order_type = this.mapOrderType(modifications.orderType);
    }

    if (modifications.quantity) {
      modifyParams.quantity = modifications.quantity;
    }

    if (modifications.price) {
      modifyParams.price = modifications.price;
    }

    if (modifications.triggerPrice) {
      modifyParams.trigger_price = modifications.triggerPrice;
    }

    try {
      await this.apiClient.put(`/orders/regular/${orderId}`, modifyParams);

      return {
        orderId,
        status: 'PENDING',
        message: 'Order modified successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        orderId,
        status: 'REJECTED',
        message: this.parseError(error),
        timestamp: new Date(),
        rejectionReason: this.parseError(error),
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    try {
      await this.apiClient.delete(`/orders/regular/${orderId}`);

      return {
        orderId,
        status: 'CANCELLED',
        message: 'Order cancelled successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        orderId,
        status: 'REJECTED',
        message: this.parseError(error),
        timestamp: new Date(),
        rejectionReason: this.parseError(error),
      };
    }
  }

  /**
   * Get order book
   */
  async getOrderBook(): Promise<OrderBook[]> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get('/orders');
    const orders = response.data.data;

    return orders.map((order: any) => ({
      orderId: order.order_id,
      symbol: order.tradingsymbol,
      exchange: order.exchange,
      orderType: this.mapOrderTypeFromZerodha(order.order_type),
      orderSide: order.transaction_type as OrderSide,
      quantity: order.quantity,
      price: order.price,
      triggerPrice: order.trigger_price,
      averagePrice: order.average_price,
      filledQuantity: order.filled_quantity,
      pendingQuantity: order.pending_quantity,
      cancelledQuantity: order.cancelled_quantity,
      status: this.mapOrderStatus(order.status),
      statusMessage: order.status_message,
      orderTimestamp: new Date(order.order_timestamp),
      exchangeTimestamp: order.exchange_timestamp ? new Date(order.exchange_timestamp) : undefined,
      productType: this.mapProductType(order.product),
      validity: order.validity,
      tag: order.tag,
    }));
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderBook> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get(`/orders/${orderId}`);
    const order = response.data.data[0]; // Zerodha returns array

    return {
      orderId: order.order_id,
      symbol: order.tradingsymbol,
      exchange: order.exchange,
      orderType: this.mapOrderTypeFromZerodha(order.order_type),
      orderSide: order.transaction_type as OrderSide,
      quantity: order.quantity,
      price: order.price,
      triggerPrice: order.trigger_price,
      averagePrice: order.average_price,
      filledQuantity: order.filled_quantity,
      pendingQuantity: order.pending_quantity,
      cancelledQuantity: order.cancelled_quantity,
      status: this.mapOrderStatus(order.status),
      statusMessage: order.status_message,
      orderTimestamp: new Date(order.order_timestamp),
      exchangeTimestamp: order.exchange_timestamp ? new Date(order.exchange_timestamp) : undefined,
      productType: this.mapProductType(order.product),
      validity: order.validity,
      tag: order.tag,
    };
  }

  /**
   * Get trade book
   */
  async getTradeBook(): Promise<Trade[]> {
    await this.ensureAuthenticated();

    const response = await this.apiClient.get('/trades');
    const trades = response.data.data;

    return trades.map((trade: any) => ({
      tradeId: trade.trade_id,
      orderId: trade.order_id,
      symbol: trade.tradingsymbol,
      exchange: trade.exchange,
      orderSide: trade.transaction_type as OrderSide,
      quantity: trade.quantity,
      price: trade.average_price,
      productType: this.mapProductType(trade.product),
      timestamp: new Date(trade.fill_timestamp),
      exchangeOrderId: trade.exchange_order_id,
    }));
  }

  /**
   * Get market quote
   */
  async getQuote(symbol: string, exchange: string): Promise<Quote> {
    await this.ensureAuthenticated();

    const instrument = `${exchange}:${symbol}`;
    const response = await this.apiClient.get(`/quote?i=${instrument}`);
    const quote = response.data.data[instrument];

    return {
      symbol,
      exchange,
      lastPrice: quote.last_price,
      lastQuantity: quote.last_quantity,
      volume: quote.volume,
      buyQuantity: quote.buy_quantity,
      sellQuantity: quote.sell_quantity,
      open: quote.ohlc.open,
      high: quote.ohlc.high,
      low: quote.ohlc.low,
      close: quote.ohlc.close,
      change: quote.last_price - quote.ohlc.close,
      changePercent: ((quote.last_price - quote.ohlc.close) / quote.ohlc.close) * 100,
      timestamp: new Date(quote.timestamp),
      ohlc: quote.ohlc,
      depth: quote.depth,
    };
  }

  /**
   * Get quotes for multiple symbols
   */
  async getQuotes(symbols: Array<{ symbol: string; exchange: string }>): Promise<Quote[]> {
    await this.ensureAuthenticated();

    const instruments = symbols.map((s) => `${s.exchange}:${s.symbol}`).join(',');
    const response = await this.apiClient.get(`/quote?i=${instruments}`);

    return symbols.map((s) => {
      const instrument = `${s.exchange}:${s.symbol}`;
      const quote = response.data.data[instrument];

      return {
        symbol: s.symbol,
        exchange: s.exchange,
        lastPrice: quote.last_price,
        lastQuantity: quote.last_quantity,
        volume: quote.volume,
        buyQuantity: quote.buy_quantity,
        sellQuantity: quote.sell_quantity,
        open: quote.ohlc.open,
        high: quote.ohlc.high,
        low: quote.ohlc.low,
        close: quote.ohlc.close,
        change: quote.last_price - quote.ohlc.close,
        changePercent: ((quote.last_price - quote.ohlc.close) / quote.ohlc.close) * 100,
        timestamp: new Date(quote.timestamp),
        ohlc: quote.ohlc,
        depth: quote.depth,
      };
    });
  }

  /**
   * Get instrument token (for WebSocket subscriptions)
   */
  async getInstrumentToken(symbol: string, exchange: string): Promise<string | number> {
    // In production, fetch from instruments master CSV
    // For now, return placeholder
    return `${exchange}:${symbol}`;
  }

  /**
   * Subscribe to market data (WebSocket)
   */
  async subscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void> {
    // Implement WebSocket subscription using KiteTicker
    this.log('info', 'Market data subscription not implemented yet', { symbols });
  }

  /**
   * Unsubscribe from market data
   */
  async unsubscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void> {
    this.log('info', 'Market data unsubscription not implemented yet', { symbols });
  }

  /**
   * Helper: Map order type to Zerodha format
   */
  private mapOrderType(orderType: OrderType): string {
    const mapping: Record<OrderType, string> = {
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'SL',
      STOP_LOSS_MARKET: 'SL-M',
    };
    return mapping[orderType];
  }

  /**
   * Helper: Map order type from Zerodha format
   */
  private mapOrderTypeFromZerodha(orderType: string): OrderType {
    const mapping: Record<string, OrderType> = {
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      SL: 'STOP_LOSS',
      'SL-M': 'STOP_LOSS_MARKET',
    };
    return mapping[orderType] || 'MARKET';
  }

  /**
   * Helper: Map product type to Zerodha format
   */
  private mapProductTypeToZerodha(productType: ProductType): string {
    const mapping: Record<ProductType, string> = {
      INTRADAY: 'MIS',
      DELIVERY: 'CNC',
      MARGIN: 'NRML',
    };
    return mapping[productType];
  }

  /**
   * Helper: Map product type from Zerodha format
   */
  private mapProductType(product: string): ProductType {
    const mapping: Record<string, ProductType> = {
      MIS: 'INTRADAY',
      CNC: 'DELIVERY',
      NRML: 'MARGIN',
    };
    return mapping[product] || 'DELIVERY';
  }

  /**
   * Helper: Map order status
   */
  private mapOrderStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'PENDING': 'PENDING',
      'OPEN': 'OPEN',
      'COMPLETE': 'COMPLETE',
      'CANCELLED': 'CANCELLED',
      'REJECTED': 'REJECTED',
    };
    return mapping[status] || 'PENDING';
  }
}
