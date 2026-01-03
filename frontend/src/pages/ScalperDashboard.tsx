import { useState, useEffect } from 'react';
import { Play, Square, AlertTriangle, Settings, BarChart3, TrendingUp, DollarSign, Activity, Plus } from 'lucide-react';
import { scalperAPI } from '../api/client';
import ScalperConfig from '../components/scalper/ScalperConfig';
import ScalperCreateForm from '../components/scalper/ScalperCreateForm';
import ScalperPositions from '../components/scalper/ScalperPositions';
import ScalperChart from '../components/scalper/ScalperChart';
import ScalperTrades from '../components/scalper/ScalperTrades';
import BacktestResults from '../components/scalper/BacktestResults';

interface ScalperConfig {
  id: number;
  name: string;
  enabled: boolean;
  broker: string;
  accountId: string;
  autoTrade: boolean;
}

interface ScalperStatus {
  running: boolean;
  startTime?: string;
  stocks: number;
  openTrades: number;
  dailyStats: {
    trades: number;
    pnl: number;
    wins: number;
    losses: number;
  };
}

export default function ScalperDashboard() {
  const [scalpers, setScalpers] = useState<ScalperConfig[]>([]);
  const [selectedScalper, setSelectedScalper] = useState<number | null>(null);
  const [scalperStatus, setScalperStatus] = useState<ScalperStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'positions' | 'chart' | 'trades' | 'backtest'>('overview');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadScalpers();
  }, []);

  useEffect(() => {
    if (selectedScalper) {
      loadScalperStatus(selectedScalper);
      // Poll status every 2 seconds
      const interval = setInterval(() => {
        loadScalperStatus(selectedScalper);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedScalper]);

  const loadScalpers = async () => {
    try {
      setLoading(true);
      const response = await scalperAPI.getAllConfigs();
      setScalpers(response.data.configs || []);
      if (response.data.configs && response.data.configs.length > 0) {
        setSelectedScalper(response.data.configs[0].id);
      }
    } catch (error) {
      console.error('Error loading scalpers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScalperStatus = async (id: number) => {
    try {
      const response = await scalperAPI.getStatus(id);
      setScalperStatus(response.data.status);
    } catch (error) {
      console.error('Error loading scalper status:', error);
    }
  };

  const handleStartScalper = async (id: number) => {
    try {
      await scalperAPI.startScalper(id);
      loadScalperStatus(id);
    } catch (error) {
      console.error('Error starting scalper:', error);
      alert('Failed to start scalper');
    }
  };

  const handleStopScalper = async (id: number) => {
    try {
      await scalperAPI.stopScalper(id);
      loadScalperStatus(id);
    } catch (error) {
      console.error('Error stopping scalper:', error);
      alert('Failed to stop scalper');
    }
  };

  const handleEmergencyStop = async () => {
    if (!confirm('⚠️ Are you sure you want to EMERGENCY STOP all scalpers and close all positions?')) {
      return;
    }
    try {
      await scalperAPI.emergencyStopAll();
      loadScalpers();
      if (selectedScalper) {
        loadScalperStatus(selectedScalper);
      }
      alert('✅ All scalpers stopped and positions closed');
    } catch (error) {
      console.error('Error emergency stop:', error);
      alert('Failed to execute emergency stop');
    }
  };

  const handleCreateScalper = () => {
    setIsCreating(true);
    setActiveTab('config');
  };

  const handleCreateSuccess = (scalperId: number) => {
    setIsCreating(false);
    loadScalpers();
    setSelectedScalper(scalperId);
    setActiveTab('overview');
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    if (scalpers.length > 0) {
      setActiveTab('overview');
    }
  };

  const currentScalper = scalpers.find(s => s.id === selectedScalper);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scalper dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Scalper Dashboard</h1>
            <p className="text-gray-600">Real-time automated scalping with live monitoring</p>
          </div>
          <button
            onClick={handleEmergencyStop}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-semibold shadow-lg"
          >
            <AlertTriangle className="w-5 h-5" />
            EMERGENCY STOP ALL
          </button>
        </div>
      </div>

      {/* Scalper Selector & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Scalper Selector */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Active Scalpers</h2>
            {scalpers.length > 0 && (
              <button
                onClick={handleCreateScalper}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Create New Scalper"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          {scalpers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No scalpers configured</p>
              <button
                onClick={handleCreateScalper}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Scalper
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {scalpers.map((scalper) => (
                <button
                  key={scalper.id}
                  onClick={() => {
                    setSelectedScalper(scalper.id);
                    setIsCreating(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedScalper === scalper.id && !isCreating
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{scalper.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {scalper.broker.toUpperCase()} • {scalper.autoTrade ? 'Auto' : 'Manual'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {scalperStatus && scalperStatus.dailyStats && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Status</span>
                <Activity className={`w-5 h-5 ${scalperStatus.running ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div className={`text-2xl font-bold ${scalperStatus.running ? 'text-green-600' : 'text-gray-400'}`}>
                {scalperStatus.running ? 'RUNNING' : 'STOPPED'}
              </div>
              {scalperStatus.running && scalperStatus.startTime && (
                <div className="text-sm text-gray-500 mt-1">
                  Since {new Date(scalperStatus.startTime).toLocaleTimeString()}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Daily P&L</span>
                <DollarSign className={`w-5 h-5 ${(scalperStatus.dailyStats?.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className={`text-2xl font-bold ${(scalperStatus.dailyStats?.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(scalperStatus.dailyStats?.pnl ?? 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {scalperStatus.dailyStats?.wins ?? 0}W / {scalperStatus.dailyStats?.losses ?? 0}L
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Open Positions</span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {scalperStatus.openTrades ?? 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {scalperStatus.stocks ?? 0} stocks tracked
              </div>
            </div>
          </>
        )}
      </div>

      {/* Control Buttons */}
      {currentScalper && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleStartScalper(currentScalper.id)}
              disabled={scalperStatus?.running}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                scalperStatus?.running
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Play className="w-4 h-4" />
              Start Scalper
            </button>
            <button
              onClick={() => handleStopScalper(currentScalper.id)}
              disabled={!scalperStatus?.running}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                !scalperStatus?.running
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Square className="w-4 h-4" />
              Stop Scalper
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-2 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'config', label: 'Configuration', icon: Settings },
              { id: 'positions', label: 'Positions', icon: TrendingUp },
              { id: 'chart', label: 'Live Charts', icon: Activity },
              { id: 'trades', label: 'Trade History', icon: DollarSign },
              { id: 'backtest', label: 'Backtest Results', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Paper Trading Mode</h3>
                  <p className="text-blue-700 text-sm">
                    All trades are currently simulated. No real money at risk. Perfect for testing strategies.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">Safety Features Active</h3>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>✓ Daily loss limits</li>
                    <li>✓ Max positions enforced</li>
                    <li>✓ Auto stop-loss</li>
                    <li>✓ Emergency controls</li>
                  </ul>
                </div>
              </div>

              {scalperStatus && scalperStatus.dailyStats && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Today's Performance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Total Trades</div>
                      <div className="text-2xl font-bold text-gray-900">{scalperStatus.dailyStats?.trades ?? 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Wins</div>
                      <div className="text-2xl font-bold text-green-600">{scalperStatus.dailyStats?.wins ?? 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Losses</div>
                      <div className="text-2xl font-bold text-red-600">{scalperStatus.dailyStats?.losses ?? 0}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">Win Rate</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(scalperStatus.dailyStats?.trades ?? 0) > 0
                          ? (((scalperStatus.dailyStats?.wins ?? 0) / (scalperStatus.dailyStats?.trades ?? 1)) * 100).toFixed(1)
                          : '0'}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            isCreating ? (
              <ScalperCreateForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            ) : selectedScalper ? (
              <ScalperConfig scalperId={selectedScalper} onUpdate={loadScalpers} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a scalper or create a new one
              </div>
            )
          )}

          {activeTab === 'positions' && selectedScalper && (
            <ScalperPositions scalperId={selectedScalper} />
          )}

          {activeTab === 'chart' && selectedScalper && (
            <ScalperChart scalperId={selectedScalper} />
          )}

          {activeTab === 'trades' && selectedScalper && (
            <ScalperTrades scalperId={selectedScalper} />
          )}

          {activeTab === 'backtest' && selectedScalper && (
            <BacktestResults scalperId={selectedScalper} />
          )}
        </div>
      </div>
    </div>
  );
}
