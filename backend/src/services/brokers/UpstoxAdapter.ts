/**
 * Upstox API v2 Adapter
 * Implementation for Upstox broker integration
 */

import axios, { AxiosInstance } from 'axios';
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

export class UpstoxAdapter extends BaseBrokerAdapter {
  private apiClient: AxiosInstance;
  private readonly API_BASE_URL = 'https://api.upstox.com/v2';
  private readonly LOGIN_URL = 'https://api.upstox.com/v2/login/authorization/dialog';

  constructor(config: BrokerAdapterConfig = {}) {
    super('UPSTOX', config);

    this.apiClient = axios.create({
      baseURL: this.API_BASE_URL,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  getBrokerType(): BrokerType {
    return 'UPSTOX';
  }

  /**
   * Authenticate with Upstox
   */
  async authenticate(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('Credentials not provided');
    }

    try {
      // Check existing token
      if (this.credentials.accessToken && !this.isTokenExpired()) {
        this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.credentials.accessToken}`;
        this.connected = true;
        return true;
      }

      // OAuth2 flow - exchange authorization code for access token
      if (!this.credentials.refreshToken) {
        const authUrl = `${this.LOGIN_URL}?client_id=${this.credentials.apiKey}&redirect_uri=${encodeURIComponent('http://localhost:3001/auth/upstox/callback')}&state=upstox`;
        this.log('info', 'Complete OAuth flow', { authUrl });
        throw new Error('Authorization code required. Please complete OAuth flow first.');
      }

      // Exchange code for token
      const response = await axios.post(`${this.API_BASE_URL}/login/authorization/token`, {
        code: this.credentials.refreshToken,
        client_id: this.credentials.apiKey,
        client_secret: this.credentials.apiSecret,
        redirect_uri: 'http://localhost:3001/auth/upstox/callback',
        grant_type: 'authorization_code',
      });

      if (response.data && response.data.access_token) {
        this.credentials.accessToken = response.data.access_token;
        this.credentials.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

        this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.credentials.accessToken}`;
        this.log('success', 'Authenticated with Upstox successfully');
        return true;
      }

      return false;
    } catch (error) {
      this.log('error', 'Authentication failed', { error: this.parseError(error) });
      return false;
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    // Upstox requires re-authentication
    this.log('warn', 'Upstox requires re-authentication. Cannot refresh token.');
    return false;
  }

  async getFunds(): Promise<Funds> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get('/user/get-funds-and-margin');
    const equity = response.data.data.equity;

    return {
      availableCash: equity.available_margin,
      usedMargin: equity.used_margin,
      availableMargin: equity.available_margin,
      totalCollateral: 0,
      openingBalance: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      totalPnl: 0,
    };
  }

  async getPositions(): Promise<Position[]> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get('/portfolio/short-term-positions');
    const positions = response.data.data;

    return positions.map((pos: any) => ({
      symbol: pos.trading_symbol,
      exchange: pos.exchange,
      productType: this.mapProductType(pos.product),
      positionType: pos.quantity > 0 ? 'LONG' : 'SHORT',
      quantity: pos.quantity,
      averagePrice: pos.average_price,
      lastPrice: pos.last_price,
      pnl: pos.unrealised_profit,
      pnlPercent: (pos.unrealised_profit / (pos.average_price * Math.abs(pos.quantity))) * 100,
      realizedPnl: pos.realised_profit,
      unrealizedPnl: pos.unrealised_profit,
      value: pos.market_value,
      buyQuantity: pos.buy_quantity,
      sellQuantity: pos.sell_quantity,
      buyPrice: pos.buy_price,
      sellPrice: pos.sell_price,
    }));
  }

  async getHoldings(): Promise<Holding[]> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get('/portfolio/long-term-holdings');
    const holdings = response.data.data;

    return holdings.map((holding: any) => ({
      symbol: holding.trading_symbol,
      exchange: holding.exchange,
      isin: holding.isin,
      quantity: holding.quantity,
      t1Quantity: 0,
      averagePrice: holding.average_price,
      lastPrice: holding.last_price,
      pnl: holding.pnl,
      pnlPercent: (holding.pnl / (holding.average_price * holding.quantity)) * 100,
    }));
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    const validation = this.validateOrder(order);
    if (!validation.valid) {
      throw new Error(`Invalid order: ${validation.errors.join(', ')}`);
    }

    const orderPayload: any = {
      quantity: order.quantity,
      product: this.mapProductTypeToUpstox(order.productType),
      validity: order.validity || 'DAY',
      price: order.price || 0,
      tag: order.tag || '',
      instrument_token: await this.getInstrumentToken(order.symbol, order.exchange),
      order_type: this.mapOrderType(order.orderType),
      transaction_type: order.orderSide,
      disclosed_quantity: order.disclosedQuantity || 0,
      trigger_price: order.triggerPrice || 0,
      is_amo: false,
    };

    try {
      const response = await this.apiClient.post('/order/place', orderPayload);
      return {
        orderId: response.data.data.order_id,
        status: 'PENDING',
        message: 'Order placed successfully',
        timestamp: new Date(),
      };
    } catch (error: any) {
      this.log('error', 'Failed to place order', { error: this.parseError(error), order });
      return {
        orderId: '',
        status: 'REJECTED',
        message: this.parseError(error),
        timestamp: new Date(),
        rejectionReason: this.parseError(error),
      };
    }
  }

  async modifyOrder(orderId: string, modifications: Partial<OrderRequest>): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    const modifyPayload: any = {
      quantity: modifications.quantity,
      validity: modifications.validity || 'DAY',
      price: modifications.price || 0,
      order_type: modifications.orderType ? this.mapOrderType(modifications.orderType) : undefined,
      trigger_price: modifications.triggerPrice || 0,
    };

    try {
      await this.apiClient.put('/order/modify', { ...modifyPayload, order_id: orderId });
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

  async cancelOrder(orderId: string): Promise<OrderResponse> {
    await this.ensureAuthenticated();

    try {
      await this.apiClient.delete(`/order/cancel?order_id=${orderId}`);
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

  async getOrderBook(): Promise<OrderBook[]> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get('/order/retrieve-all');
    const orders = response.data.data;

    return orders.map((order: any) => ({
      orderId: order.order_id,
      symbol: order.trading_symbol,
      exchange: order.exchange,
      orderType: this.mapOrderTypeFromUpstox(order.order_type),
      orderSide: order.transaction_type as OrderSide,
      quantity: order.quantity,
      price: order.price,
      triggerPrice: order.trigger_price,
      averagePrice: order.average_price,
      filledQuantity: order.filled_quantity,
      pendingQuantity: order.quantity - order.filled_quantity,
      cancelledQuantity: 0,
      status: this.mapOrderStatus(order.status),
      statusMessage: order.status_message,
      orderTimestamp: new Date(order.order_timestamp),
      productType: this.mapProductType(order.product),
      validity: order.validity,
      tag: order.tag,
    }));
  }

  async getOrderStatus(orderId: string): Promise<OrderBook> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get(`/order/details?order_id=${orderId}`);
    const order = response.data.data;

    return {
      orderId: order.order_id,
      symbol: order.trading_symbol,
      exchange: order.exchange,
      orderType: this.mapOrderTypeFromUpstox(order.order_type),
      orderSide: order.transaction_type as OrderSide,
      quantity: order.quantity,
      price: order.price,
      triggerPrice: order.trigger_price,
      averagePrice: order.average_price,
      filledQuantity: order.filled_quantity,
      pendingQuantity: order.quantity - order.filled_quantity,
      cancelledQuantity: 0,
      status: this.mapOrderStatus(order.status),
      statusMessage: order.status_message,
      orderTimestamp: new Date(order.order_timestamp),
      productType: this.mapProductType(order.product),
      validity: order.validity,
      tag: order.tag,
    };
  }

  async getTradeBook(): Promise<Trade[]> {
    await this.ensureAuthenticated();
    const response = await this.apiClient.get('/order/trades/get-trades-for-day');
    const trades = response.data.data;

    return trades.map((trade: any) => ({
      tradeId: trade.trade_id,
      orderId: trade.order_id,
      symbol: trade.trading_symbol,
      exchange: trade.exchange,
      orderSide: trade.transaction_type as OrderSide,
      quantity: trade.quantity,
      price: trade.price,
      productType: this.mapProductType(trade.product),
      timestamp: new Date(trade.trade_timestamp),
    }));
  }

  async getQuote(symbol: string, exchange: string): Promise<Quote> {
    await this.ensureAuthenticated();
    const instrumentKey = await this.getInstrumentToken(symbol, exchange);
    const response = await this.apiClient.get(`/market-quote/quotes?instrument_key=${instrumentKey}`);
    const quote = response.data.data[instrumentKey];

    return {
      symbol,
      exchange,
      lastPrice: quote.last_price,
      volume: quote.volume,
      open: quote.ohlc.open,
      high: quote.ohlc.high,
      low: quote.ohlc.low,
      close: quote.ohlc.close,
      change: quote.net_change,
      changePercent: quote.change_percent,
      timestamp: new Date(),
      ohlc: quote.ohlc,
    };
  }

  async getQuotes(symbols: Array<{ symbol: string; exchange: string }>): Promise<Quote[]> {
    await this.ensureAuthenticated();
    const instrumentKeys = await Promise.all(
      symbols.map(s => this.getInstrumentToken(s.symbol, s.exchange))
    );
    const keys = instrumentKeys.join(',');
    const response = await this.apiClient.get(`/market-quote/quotes?instrument_key=${keys}`);

    return symbols.map((s, idx) => {
      const quote = response.data.data[instrumentKeys[idx]];
      return {
        symbol: s.symbol,
        exchange: s.exchange,
        lastPrice: quote.last_price,
        volume: quote.volume,
        open: quote.ohlc.open,
        high: quote.ohlc.high,
        low: quote.ohlc.low,
        close: quote.ohlc.close,
        change: quote.net_change,
        changePercent: quote.change_percent,
        timestamp: new Date(),
        ohlc: quote.ohlc,
      };
    });
  }

  async getInstrumentToken(symbol: string, exchange: string): Promise<string> {
    // Format: <exchange>|<instrument_key>
    // In production, fetch from instruments master
    return `${exchange}|${symbol}`;
  }

  async subscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void> {
    this.log('info', 'Market data subscription not implemented yet', { symbols });
  }

  async unsubscribeMarketData(symbols: Array<{ symbol: string; exchange: string }>): Promise<void> {
    this.log('info', 'Market data unsubscription not implemented yet', { symbols });
  }

  private mapOrderType(orderType: OrderType): string {
    const mapping: Record<OrderType, string> = {
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      STOP_LOSS: 'SL',
      STOP_LOSS_MARKET: 'SL-M',
    };
    return mapping[orderType];
  }

  private mapOrderTypeFromUpstox(orderType: string): OrderType {
    const mapping: Record<string, OrderType> = {
      MARKET: 'MARKET',
      LIMIT: 'LIMIT',
      SL: 'STOP_LOSS',
      'SL-M': 'STOP_LOSS_MARKET',
    };
    return mapping[orderType] || 'MARKET';
  }

  private mapProductTypeToUpstox(productType: ProductType): string {
    const mapping: Record<ProductType, string> = {
      INTRADAY: 'I',
      DELIVERY: 'D',
      MARGIN: 'M',
    };
    return mapping[productType];
  }

  private mapProductType(product: string): ProductType {
    const mapping: Record<string, ProductType> = {
      I: 'INTRADAY',
      D: 'DELIVERY',
      M: 'MARGIN',
    };
    return mapping[product] || 'DELIVERY';
  }

  private mapOrderStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'pending validation': 'PENDING',
      'validation pending': 'PENDING',
      'open': 'OPEN',
      'complete': 'COMPLETE',
      'cancelled': 'CANCELLED',
      'rejected': 'REJECTED',
    };
    return mapping[status.toLowerCase()] || 'PENDING';
  }
}
