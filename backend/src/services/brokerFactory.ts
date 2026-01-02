/**
 * Broker Factory - Create broker instances based on type
 * Links scalper configuration to broker accounts from settings
 */

import { BrokerService } from './brokerService';
import { ZerodhaBroker } from './brokers/ZerodhaBroker';
import { UpstoxBroker } from './brokers/UpstoxBroker';
import { IBKRBroker } from './brokers/IBKRBroker';
import { PaperBroker } from './brokerService';
import { databaseService } from './databaseService';
import { loggerService } from './loggerService';

export interface BrokerConnectionConfig {
  broker: 'zerodha' | 'upstox' | 'ibkr' | 'paper';
  accountId?: string; // Optional: Load from settings
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  requestToken?: string; // For Zerodha
  code?: string; // For Upstox OAuth
}

/**
 * Create a broker instance
 * - If accountId is provided, loads credentials from database
 * - Otherwise uses provided credentials
 */
export function createBroker(
  config: BrokerConnectionConfig
): BrokerService {
  loggerService.info('Creating broker instance', { broker: config.broker });

  // Paper trading mode
  if (config.broker === 'paper') {
    return new PaperBroker();
  }

  // Load from database if accountId is provided
  if (config.accountId) {
    const account = databaseService.getBrokerAccountById(parseInt(config.accountId));

    if (!account) {
      throw new Error(`Broker account not found: ${config.accountId}`);
    }

    if (account.broker !== config.broker) {
      throw new Error(`Broker mismatch: Expected ${config.broker}, got ${account.broker}`);
    }

    // Parse credentials from JSON string
    const credentials = typeof account.credentials === 'string'
      ? JSON.parse(account.credentials)
      : account.credentials;

    // Merge database credentials with config
    config = {
      ...config,
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      requestToken: credentials.requestToken,
      code: credentials.code,
    };

    loggerService.info('Loaded broker credentials from database', {
      broker: config.broker,
      accountId: config.accountId
    });
  }

  // Create broker instance
  switch (config.broker) {
    case 'zerodha':
      return createZerodhaBroker(config);

    case 'upstox':
      return createUpstoxBroker(config);

    case 'ibkr':
      return createIBKRBroker(config);

    default:
      throw new Error(`Unsupported broker: ${config.broker}`);
  }
}

/**
 * Create Zerodha broker with configuration
 */
function createZerodhaBroker(config: BrokerConnectionConfig): ZerodhaBroker {
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('Zerodha: apiKey and apiSecret are required');
  }

  if (!config.accessToken && !config.requestToken) {
    throw new Error('Zerodha: Either accessToken or requestToken is required');
  }

  const broker = new ZerodhaBroker();

  // Note: Connection happens async after broker is created
  // Caller must call broker.connect(config) after creation

  return broker;
}

/**
 * Create Upstox broker with configuration
 */
function createUpstoxBroker(config: BrokerConnectionConfig): UpstoxBroker {
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('Upstox: apiKey and apiSecret are required');
  }

  if (!config.accessToken && !config.code) {
    throw new Error('Upstox: Either accessToken or authorization code is required');
  }

  const broker = new UpstoxBroker();

  // Note: Connection happens async after broker is created
  // Caller must call broker.connect(config) after creation

  return broker;
}

/**
 * Create IBKR broker with configuration
 */
function createIBKRBroker(config: BrokerConnectionConfig): IBKRBroker {
  loggerService.warn('IBKR broker is using placeholder implementation');

  const broker = new IBKRBroker();

  // Note: Connection happens async after broker is created
  // Caller must call broker.connect(config) after creation

  return broker;
}

/**
 * Get broker connection configuration from database
 */
export function getBrokerConfigFromDatabase(
  broker: 'zerodha' | 'upstox' | 'ibkr',
  accountId: number
): BrokerConnectionConfig {
  const account = databaseService.getBrokerAccountById(accountId);

  if (!account) {
    throw new Error(`Broker account not found: ${accountId}`);
  }

  if (account.broker !== broker) {
    throw new Error(`Broker mismatch: Expected ${broker}, got ${account.broker}`);
  }

  // Parse credentials from JSON string
  const credentials = typeof account.credentials === 'string'
    ? JSON.parse(account.credentials)
    : account.credentials;

  return {
    broker,
    accountId: accountId.toString(),
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    accessToken: credentials.accessToken,
    requestToken: credentials.requestToken,
    code: credentials.code,
  };
}

/**
 * Test broker connection
 */
export async function testBrokerConnection(
  broker: 'zerodha' | 'upstox' | 'ibkr' | 'paper',
  accountId?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const config: BrokerConnectionConfig = {
      broker,
      accountId,
    };

    const brokerInstance = createBroker(config);

    // Get full config for connection
    let fullConfig = config;
    if (accountId) {
      fullConfig = getBrokerConfigFromDatabase(broker, parseInt(accountId));
    }

    // Attempt connection
    await brokerInstance.connect(fullConfig as any);

    // Test a simple API call (get balance)
    const balance = await brokerInstance.getAccountBalance();

    await brokerInstance.disconnect();

    return {
      success: true,
      message: `Successfully connected to ${broker}. Available balance: ₹${balance.available.toLocaleString()}`,
    };
  } catch (error: any) {
    loggerService.error('Broker connection test failed', { broker, error });
    return {
      success: false,
      message: `Failed to connect to ${broker}`,
      error: error.message,
    };
  }
}
