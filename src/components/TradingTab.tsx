import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  DollarSign, 
  Brain, 
  Building2, 
  Zap, 
  Target, 
  Shield, 
  Activity,
  BarChart3,
  ArrowLeft,
  Eye,
  EyeOff,
  Coins,
  RefreshCw,
  Save,
  CheckCircle,
  Calendar
} from 'lucide-react';

import TradingSettings from './TradingSettings';
import TradingPairsManager from './TradingPairsManager';
import PLCards from './PLCards';
import { usePersistentStats } from '../hooks/usePersistentStats';

interface TradingTabProps {
  isTrading: boolean;
  isPaperTrading: boolean;
  balance: number;
  liveBalance: number;
  trades: any[];
  mlModels: any[];
  exchanges: any[];
  tradingPairs: any;
  onToggleTrading: () => void;
  onSwitchTradingMode: () => void;
  onEmergencyStop: () => void;
  onBack: () => void;
  isAdmin: boolean;
  userTier: string;
}

export default function TradingTab({
  isTrading,
  isPaperTrading,
  balance,
  liveBalance,
  trades,
  mlModels,
  exchanges,
  tradingPairs,
  onToggleTrading,
  onSwitchTradingMode,
  onEmergencyStop,
  onBack,
  isAdmin,
  userTier
}: TradingTabProps) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [settingsApplied, setSettingsApplied] = useState(false);
  const [updatedTradingPairs, setUpdatedTradingPairs] = useState(tradingPairs);

  // Get persistent stats for P&L display
  const { 
    stats: persistentStats, 
    getTodaysStats,
    getWeeklyStats,
    getMonthlyStats
  } = usePersistentStats();

  const currentBalance = isPaperTrading ? balance : liveBalance;
  const enabledExchanges = exchanges.filter(e => e.enabled && e.connected);
  const enabledMLModels = mlModels.filter(m => m.enabled);
  const allPairs = updatedTradingPairs.exchanges ? Object.values(updatedTradingPairs.exchanges).flat() : [];
  const enabledPairs = allPairs.filter((p: any) => p.enabled);

  useEffect(() => {
    setUpdatedTradingPairs(tradingPairs);
  }, [tradingPairs]);

  const recentTrades = trades.slice(0, 10);
  const todaysTrades = trades.filter(trade => {
    const today = new Date().toDateString();
    const tradeDate = new Date(trade.timestamp).toDateString();
    return today === tradeDate;
  });

  const profitableTrades = todaysTrades.filter(t => t.netProfit > 0);
  const winRate = todaysTrades.length > 0 ? (profitableTrades.length / todaysTrades.length) * 100 : 0;
  
  // Get P&L data for consistent display
  const todaysStats = getTodaysStats();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const handleSettingsChange = (settings: any) => {
    // Apply settings to the trading system
    console.log('🔧 Applying trading settings:', settings);
    
    // Show confirmation that settings were applied
    setSettingsApplied(true);
    setTimeout(() => setSettingsApplied(false), 3000);
    
    // Here you would typically update the trading engine with new settings
    // For now, we'll just log and show confirmation
  };

  const handlePairsUpdate = (pairs: any) => {
    setUpdatedTradingPairs(pairs);
    // Save to localStorage for persistence
    localStorage.setItem('tradingPairs', JSON.stringify(pairs));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Trading Control Center</h2>
            <p className="text-gray-400">Manage your automated trading operations</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {settingsApplied && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Settings Applied</span>
            </div>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTrading ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isTrading ? 'Trading Active' : 'Trading Stopped'}
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPaperTrading ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isPaperTrading ? 'Paper Mode' : 'Live Mode'}
          </div>
          {isAdmin && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-600 text-white">
              ADMIN
            </div>
          )}
        </div>
      </div>

      {/* Trading Controls */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Balance */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Current Balance</h3>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {formatCurrency(currentBalance)}
            </div>
            <div className="text-sm text-gray-400">
              {isPaperTrading ? 'Paper Trading' : 'Live Trading'}
            </div>
          </div>

          {/* Today's Performance */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Today's P&L</h3>
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              persistentStats.dailyPL >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {persistentStats.dailyPL >= 0 ? '+' : ''}{formatCurrency(persistentStats.dailyPL)}
            </div>
            <div className="text-sm text-gray-400">
              {todaysTrades.length} trades • {formatPercentage(winRate)} win rate
            </div>
          </div>

          {/* Active Components */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">Active Components</h3>
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ML Models:</span>
                <span className="text-white">{enabledMLModels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Exchanges:</span>
                <span className="text-white">{enabledExchanges.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pairs:</span>
                <span className="text-white">{enabledPairs.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="flex items-center justify-center space-x-4 mt-6 pt-6 border-t border-slate-600">
          <button
            onClick={onToggleTrading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isTrading 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTrading ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            <span>{isTrading ? 'Stop Trading' : 'Start Trading'}</span>
          </button>
          
          <button
            onClick={onSwitchTradingMode}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isPaperTrading 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>Switch to {isPaperTrading ? 'Live' : 'Paper'} Trading</span>
          </button>
          
          <button
            onClick={onEmergencyStop}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Stop</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Trading Overview', icon: BarChart3 },
          { id: 'exchanges', label: 'Exchange Status', icon: Building2 },
          { id: 'pairs', label: 'Trading Pairs', icon: Coins },
          { id: 'ml_models', label: 'ML Models', icon: Brain },
          { id: 'settings', label: 'Trading Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeSubTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Trading Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* P&L Cards */}
          <div className="flex flex-wrap gap-4">
            <PLCards 
              dailyPL={persistentStats.dailyPL}
              weeklyPL={persistentStats.weeklyPL}
              monthlyPL={persistentStats.monthlyPL}
              weeklyComparison={persistentStats.weeklyComparison}
              monthlyComparison={persistentStats.monthlyComparison}
              totalTrades={persistentStats.totalTrades}
              winningTrades={persistentStats.winningTrades}
              losingTrades={persistentStats.losingTrades}
              totalFees={persistentStats.totalFees}
              dailyFees={persistentStats.dailyFees || 0}
              weeklyFees={persistentStats.weeklyFees || 0}
              monthlyFees={persistentStats.monthlyFees || 0}
              winRate={persistentStats.winRate}
              databaseType={"LocalStorage"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Trades */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Recent Trades</h3>
                <span className="text-sm text-gray-400">{recentTrades.length} trades</span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {isTrading ? 'Waiting for trading signals...' : 'Start trading to see activity'}
                  </div>
                ) : (
                  recentTrades.map(trade => (
                    <div key={trade.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.symbol}</span>
                          <span className="text-xs bg-orange-600 px-2 py-1 rounded">MEME</span>
                        </div>
                        <div className={`font-bold ${
                          trade.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.netProfit >= 0 ? '+' : ''}{formatCurrency(trade.netProfit)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                        <div>
                          <div>Route: {trade.buyExchange} → {trade.sellExchange}</div>
                          <div>ML Confidence: {formatPercentage(trade.mlConfidence * 100)}</div>
                        </div>
                        <div>
                          <div>Fees: {formatCurrency(trade.totalFees)}</div>
                          <div>Time: {new Date(trade.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ML Model Performance */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">ML Model Performance</h3>
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              
              <div className="space-y-3">
                {enabledMLModels.slice(0, 6).map(model => (
                  <div key={model.type} className="bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{model.name}</span>
                      <span className="text-sm text-green-400">{formatPercentage(model.accuracy)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Predictions: {model.predictions}</span>
                      <span>Profit: {formatCurrency(model.profitGenerated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Status */}
      {activeSubTab === 'exchanges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exchanges.map(exchange => (
            <div key={exchange.id} className={`bg-slate-800 rounded-lg p-6 border ${
              exchange.connected ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Building2 className={`h-6 w-6 ${exchange.connected ? 'text-green-400' : 'text-red-400'}`} />
                  <div>
                    <h3 className="text-lg font-bold text-white">{exchange.name}</h3>
                    <p className="text-sm text-gray-400">
                      {exchange.fees.maker * 100}% maker / {exchange.fees.taker * 100}% taker fees
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  exchange.connected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {exchange.connected ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Status:</div>
                  <div className={exchange.enabled ? 'text-green-400' : 'text-red-400'}>
                    {exchange.enabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">API Keys:</div>
                  <div className={exchange.hasKeys ? 'text-green-400' : 'text-red-400'}>
                    {exchange.hasKeys ? 'Configured' : 'Missing'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Trading Pairs:</div>
                  <div className="text-white">{exchange.enabledPairs}/{exchange.totalPairs}</div>
                </div>
                <div>
                  <div className="text-gray-400">Trading Hours:</div>
                  <div className="text-white">{exchange.tradingHours || '24/7'}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="text-sm text-gray-400 mb-2">API Limits:</div>
                <div className="text-xs text-gray-500">
                  {exchange.apiLimits?.requestsPerSecond || 10}/sec • {exchange.apiLimits?.requestsPerDay?.toLocaleString() || '100,000'}/day
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trading Pairs */}
      {activeSubTab === 'pairs' && (
        <TradingPairsManager />
      )}

      {/* ML Models Tab */}
      {activeSubTab === 'ml_models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mlModels.map(model => (
            <div key={model.type} className={`bg-slate-800 rounded-lg p-6 border ${
              model.enabled ? 'border-purple-500/30' : 'border-slate-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className={`h-5 w-5 ${model.enabled ? 'text-purple-400' : 'text-gray-400'}`} />
                  <h3 className="font-semibold text-white">{model.name}</h3>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  model.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {model.enabled ? 'ACTIVE' : 'DISABLED'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Accuracy:</span>
                  <span className="text-green-400 font-bold">{formatPercentage(model.accuracy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Predictions:</span>
                  <span className="text-white">{model.predictions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit Generated:</span>
                  <span className={model.profitGenerated >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatCurrency(model.profitGenerated)}
                  </span>
                </div>
              </div>

              {model.enabled && (
                <div className="mt-4 pt-4 border-t border-slate-600">
                  <div className="text-xs text-gray-400">Currently analyzing market patterns...</div>
                  <div className="mt-2 w-full bg-slate-600 rounded-full h-1">
                    <div className="h-1 bg-purple-400 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Trading Settings */}
      {activeSubTab === 'settings' && (
        <TradingSettings
          onSettingsChange={handleSettingsChange}
          userTier={userTier}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}