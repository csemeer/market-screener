import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: false,
    emailAddress: '',
    smsEnabled: false,
    smsNumber: '',
    whatsappEnabled: false,
    whatsappNumber: '',
    telegramEnabled: false,
    telegramChatId: '',
    webhookEnabled: false,
    webhookUrl: '',
    webhookSecret: '',
    alertTypes: ['ENTRY_SIGNAL', 'TARGET_HIT', 'STOPLOSS_HIT'],
  });

  // Broker accounts state
  const [brokerAccounts, setBrokerAccounts] = useState<any[]>([]);
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [newBroker, setNewBroker] = useState({
    broker: 'upstox',
    accountId: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
  });

  // Trading parameters state
  const [tradingParams, setTradingParams] = useState({
    defaultPositionSize: 1,
    maxRiskPerTrade: 2,
    maxOpenPositions: 5,
    autoExecuteEntries: false,
    orderType: 'LIMIT',
    slippagePercent: 0.5,
  });

  // Load notification settings
  useEffect(() => {
    if (activeTab === 'notifications') {
      loadNotificationSettings();
    } else if (activeTab === 'brokers') {
      loadBrokerAccounts();
    } else if (activeTab === 'trading') {
      loadTradingParams();
    }
  }, [activeTab]);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/notifications`);
      setNotificationSettings(response.data);
    } catch (error) {
      console.error('Failed to load notification settings', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/settings/notifications`, notificationSettings);
      toast.success('✅ Notification settings saved successfully!');
    } catch (error) {
      toast.error('❌ Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async (channel: string, recipient: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/settings/notifications/test`, {
        channel,
        recipient,
        secret: channel === 'webhook' ? notificationSettings.webhookSecret : undefined,
      });
      toast.success(`✅ Test notification sent to ${channel}!`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const loadBrokerAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/brokers`);
      setBrokerAccounts(response.data.accounts || response.data);
    } catch (error) {
      console.error('Failed to load broker accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const addBrokerAccount = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/settings/brokers`, {
        broker: newBroker.broker,
        accountId: newBroker.accountId,
        credentials: {
          apiKey: newBroker.apiKey,
          apiSecret: newBroker.apiSecret,
          accessToken: newBroker.accessToken,
        },
      });
      toast.success('✅ Broker account added successfully!');
      setShowAddBroker(false);
      setNewBroker({ broker: 'upstox', accountId: '', apiKey: '', apiSecret: '', accessToken: '' });
      await loadBrokerAccounts();
    } catch (error) {
      toast.error('❌ Failed to add broker account');
    } finally {
      setLoading(false);
    }
  };

  const deleteBrokerAccount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this broker account?')) return;

    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/api/settings/brokers/${id}`);
      toast.success('✅ Broker account deleted successfully!');
      await loadBrokerAccounts();
    } catch (error) {
      toast.error('❌ Failed to delete broker account');
    } finally {
      setLoading(false);
    }
  };

  const toggleBrokerAutoTrade = async (id: number, currentState: boolean) => {
    try {
      await axios.put(`${API_BASE_URL}/api/settings/brokers/${id}`, {
        autoTradeEnabled: !currentState,
      });
      await loadBrokerAccounts();
      toast.success(`✅ Auto-trade ${!currentState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('❌ Failed to update broker settings');
    }
  };

  const connectBrokerOAuth = async (broker: 'zerodha' | 'upstox') => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/auth/${broker}/login`);

      if (response.data.success && response.data.authUrl) {
        // Open OAuth authorization URL in new window
        window.open(response.data.authUrl, '_blank', 'width=600,height=700');
        toast.success(`✅ Opening ${broker} login page...`);
      } else {
        toast.error(response.data.error || 'Failed to initiate login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Failed to connect to broker');
    } finally {
      setLoading(false);
    }
  };

  const testBrokerConnection = async (accountId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/brokers/${accountId}/test`);

      if (response.data.success) {
        toast.success(`✅ ${response.data.message}`);
      } else {
        toast.error(`❌ ${response.data.error || 'Connection failed'}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || '❌ Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth success/error messages in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'zerodha_connected') {
      toast.success('✅ Zerodha connected successfully!');
      loadBrokerAccounts();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (success === 'upstox_connected') {
      toast.success('✅ Upstox connected successfully!');
      loadBrokerAccounts();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        'zerodha_auth_failed': 'Zerodha authentication failed',
        'upstox_auth_failed': 'Upstox authentication failed',
        'no_zerodha_account': 'No Zerodha account found. Please add one first.',
        'no_upstox_account': 'No Upstox account found. Please add one first.',
        'zerodha_token_failed': 'Failed to get Zerodha access token',
        'upstox_token_failed': 'Failed to get Upstox access token',
      };
      toast.error(`❌ ${errorMessages[error] || error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadTradingParams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/trading`);
      setTradingParams(response.data);
    } catch (error) {
      console.error('Failed to load trading parameters', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTradingParams = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_BASE_URL}/api/settings/trading`, tradingParams);
      toast.success('✅ Trading parameters saved successfully!');
    } catch (error) {
      toast.error('❌ Failed to save trading parameters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure notifications, brokers, and trading parameters</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px">
              {[
                { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
                { id: 'brokers', label: '🏦 Brokers', icon: '🏦' },
                { id: 'trading', label: '⚙️ Trading', icon: '⚙️' },
                { id: 'webhooks', label: '🔗 Webhooks', icon: '🔗' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Channels</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure how you want to receive trading alerts
                  </p>
                </div>

                {/* Email */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📧</span>
                      <div>
                        <h3 className="font-medium text-gray-900">Email</h3>
                        <p className="text-sm text-gray-500">Receive alerts via email</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.emailEnabled && (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={notificationSettings.emailAddress}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailAddress: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => testNotification('email', notificationSettings.emailAddress)}
                        disabled={!notificationSettings.emailAddress || loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Send Test Email
                      </button>
                    </div>
                  )}
                </div>

                {/* SMS */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📱</span>
                      <div>
                        <h3 className="font-medium text-gray-900">SMS</h3>
                        <p className="text-sm text-gray-500">Receive alerts via SMS</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.smsEnabled && (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={notificationSettings.smsNumber}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNumber: e.target.value })}
                        placeholder="+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => testNotification('sms', notificationSettings.smsNumber)}
                        disabled={!notificationSettings.smsNumber || loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Send Test SMS
                      </button>
                    </div>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💬</span>
                      <div>
                        <h3 className="font-medium text-gray-900">WhatsApp</h3>
                        <p className="text-sm text-gray-500">Receive alerts via WhatsApp</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.whatsappEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsappEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.whatsappEnabled && (
                    <div className="space-y-3">
                      <input
                        type="tel"
                        value={notificationSettings.whatsappNumber}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, whatsappNumber: e.target.value })}
                        placeholder="whatsapp:+1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => testNotification('whatsapp', notificationSettings.whatsappNumber)}
                        disabled={!notificationSettings.whatsappNumber || loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Send Test WhatsApp
                      </button>
                    </div>
                  )}
                </div>

                {/* Telegram */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">✈️</span>
                      <div>
                        <h3 className="font-medium text-gray-900">Telegram</h3>
                        <p className="text-sm text-gray-500">Receive alerts via Telegram bot</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.telegramEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, telegramEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.telegramEnabled && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={notificationSettings.telegramChatId}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, telegramChatId: e.target.value })}
                        placeholder="Your Telegram Chat ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => testNotification('telegram', notificationSettings.telegramChatId)}
                        disabled={!notificationSettings.telegramChatId || loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Send Test Message
                      </button>
                    </div>
                  )}
                </div>

                {/* Alert Types */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Alert Types</h3>
                  <p className="text-sm text-gray-500 mb-4">Select which types of alerts you want to receive</p>
                  <div className="space-y-2">
                    {['ENTRY_SIGNAL', 'TARGET_HIT', 'STOPLOSS_HIT', 'PRICE_ALERT'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings.alertTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNotificationSettings({
                                ...notificationSettings,
                                alertTypes: [...notificationSettings.alertTypes, type],
                              });
                            } else {
                              setNotificationSettings({
                                ...notificationSettings,
                                alertTypes: notificationSettings.alertTypes.filter(t => t !== type),
                              });
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveNotificationSettings}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Brokers Tab */}
            {activeTab === 'brokers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Broker Accounts</h2>
                    <p className="text-sm text-gray-600 mt-1">Connect your broker accounts for auto-trading</p>
                  </div>
                  <button
                    onClick={() => setShowAddBroker(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Add Broker
                  </button>
                </div>

                {/* Add Broker Form */}
                {showAddBroker && (
                  <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Broker Account</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                        <select
                          value={newBroker.broker}
                          onChange={(e) => setNewBroker({ ...newBroker, broker: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="upstox">Upstox</option>
                          <option value="zerodha">Zerodha (Kite)</option>
                          <option value="ibkr">Interactive Brokers</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                        <input
                          type="text"
                          value={newBroker.accountId}
                          onChange={(e) => setNewBroker({ ...newBroker, accountId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your account ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                          type="text"
                          value={newBroker.apiKey}
                          onChange={(e) => setNewBroker({ ...newBroker, apiKey: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Secret</label>
                        <input
                          type="password"
                          value={newBroker.apiSecret}
                          onChange={(e) => setNewBroker({ ...newBroker, apiSecret: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="API Secret"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={addBrokerAccount}
                          disabled={loading || !newBroker.accountId || !newBroker.apiKey}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Add Account
                        </button>
                        <button
                          onClick={() => setShowAddBroker(false)}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Broker Accounts List */}
                <div className="space-y-4">
                  {brokerAccounts.length === 0 ? (
                    <div className="text-center py-12 border border-gray-200 rounded-lg">
                      <p className="text-gray-500">No broker accounts connected yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Broker" to get started.</p>
                    </div>
                  ) : (
                    brokerAccounts.map(account => (
                      <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 capitalize">{account.broker}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                account.status === 'connected' ? 'bg-green-100 text-green-800' :
                                account.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {account.status || 'disconnected'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{account.name || `Account: ${account.accountId}`}</p>
                            {account.credentials?.apiKey && (
                              <p className="text-xs text-gray-400 mt-1">
                                API Key: {account.credentials.apiKey.substring(0, 8)}...
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Added: {new Date(account.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteBrokerAccount(account.id)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          {(account.broker === 'zerodha' || account.broker === 'upstox') && (
                            <>
                              {account.status !== 'connected' ? (
                                <button
                                  onClick={() => connectBrokerOAuth(account.broker as 'zerodha' | 'upstox')}
                                  disabled={loading}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                  🔗 Connect
                                </button>
                              ) : (
                                <button
                                  onClick={() => testBrokerConnection(account.id.toString())}
                                  disabled={loading}
                                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                                >
                                  ✓ Test Connection
                                </button>
                              )}
                            </>
                          )}

                          {account.broker === 'ibkr' && (
                            <span className="text-xs text-gray-500 italic">
                              IBKR: Manual TWS/Gateway connection required
                            </span>
                          )}

                          <label className="flex items-center gap-2 ml-auto">
                            <span className="text-sm text-gray-700">Auto-trade:</span>
                            <input
                              type="checkbox"
                              checked={account.autoTradeEnabled}
                              onChange={() => toggleBrokerAutoTrade(account.id, account.autoTradeEnabled)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Trading Parameters Tab */}
            {activeTab === 'trading' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Trading Parameters</h2>
                  <p className="text-sm text-gray-600 mb-6">Configure your trading preferences and risk management</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Position Size (% of capital)
                    </label>
                    <input
                      type="number"
                      value={tradingParams.defaultPositionSize}
                      onChange={(e) => setTradingParams({ ...tradingParams, defaultPositionSize: parseFloat(e.target.value) })}
                      min="0.1"
                      max="100"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Risk Per Trade (%)
                    </label>
                    <input
                      type="number"
                      value={tradingParams.maxRiskPerTrade}
                      onChange={(e) => setTradingParams({ ...tradingParams, maxRiskPerTrade: parseFloat(e.target.value) })}
                      min="0.5"
                      max="10"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Open Positions
                    </label>
                    <input
                      type="number"
                      value={tradingParams.maxOpenPositions}
                      onChange={(e) => setTradingParams({ ...tradingParams, maxOpenPositions: parseInt(e.target.value) })}
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Type
                    </label>
                    <select
                      value={tradingParams.orderType}
                      onChange={(e) => setTradingParams({ ...tradingParams, orderType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MARKET">Market Order</option>
                      <option value="LIMIT">Limit Order</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slippage Tolerance (%)
                    </label>
                    <input
                      type="number"
                      value={tradingParams.slippagePercent}
                      onChange={(e) => setTradingParams({ ...tradingParams, slippagePercent: parseFloat(e.target.value) })}
                      min="0.1"
                      max="5"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={tradingParams.autoExecuteEntries}
                      onChange={(e) => setTradingParams({ ...tradingParams, autoExecuteEntries: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Auto-execute entry signals (requires active broker account)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveTradingParams}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Parameters'}
                  </button>
                </div>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Webhooks</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure webhooks to send alerts to external services
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Webhook Endpoint</h3>
                      <p className="text-sm text-gray-500">POST requests with alert data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.webhookEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.webhookEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                        <input
                          type="url"
                          value={notificationSettings.webhookUrl}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })}
                          placeholder="https://your-service.com/webhook"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key (optional)</label>
                        <input
                          type="password"
                          value={notificationSettings.webhookSecret}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookSecret: e.target.value })}
                          placeholder="For HMAC signature verification"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => testNotification('webhook', notificationSettings.webhookUrl)}
                        disabled={!notificationSettings.webhookUrl || loading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Send Test Webhook
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveNotificationSettings}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
