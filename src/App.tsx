// src/App.tsx - Complete file with WebSocket ML integration
// All your existing components and functionality preserved
// Only minimal additions for WebSocket real-time ML trading

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Settings, 
  Activity, 
  DollarSign, 
  Bell,
  Brain,
  Shield,
  Users,
  BarChart3,
  Zap,
  AlertTriangle,
  Trophy,
  Target,
  Rocket,
  Lock,
  ChevronRight,
  FileText,
  Download,
  Play,
  Pause,
  RefreshCw,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TradingPanel from './components/TradingPanel';
import SettingsPanel from './components/SettingsPanel';
import SocialMediaSetup from './components/SocialMediaSetup';
import ExchangeManager from './components/ExchangeManager';
import MLModelConfig from './components/MLModelConfig';
import TradingCenter from './components/TradingCenter';
import ReportGenerator from './components/ReportGenerator';
import UpgradeModal from './components/UpgradeModal';
import { useDraggableDashboard } from './hooks/useDraggableDashboard';
import { usePersistentStats } from './hooks/usePersistentStats';
import { useDatabase } from './hooks/useDatabase';
import { useWebSocketStats } from './hooks/useWebSocketStats'; // NEW IMPORT

interface MLModel {
  type: string;
  name: string;
  accuracy: number;
  predictions: number;
  profitGenerated: number;
  enabled: boolean;
  lastPrediction?: any;
  lastTraining?: string;
}

interface Exchange {
  id: string;
  name: string;
  connected: boolean;
  hasKeys: boolean;
  enabled: boolean;
  fees: { maker: number; taker: number };
  totalPairs: number;
  enabledPairs: number;
  tradingHours: string;
  apiLimits: { requestsPerSecond: number; requestsPerDay: number };
}

export default function App() {
  // Core state - ALL YOUR EXISTING STATE PRESERVED
  const [isTrading, setIsTrading] = useState(() => {
    const saved = localStorage.getItem('memebot_is_trading');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [isPaperTrading, setIsPaperTrading] = useState(() => {
    const saved = localStorage.getItem('memebot_is_paper_trading');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('memebot_balance');
    return saved ? parseFloat(saved) : 10000;
  });
  
  const [liveBalance, setLiveBalance] = useState(() => {
    const saved = localStorage.getItem('memebot_live_balance');
    return saved ? parseFloat(saved) : 5000;
  });
  
  const [trades, setTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(true);
  const [userTier, setUserTier] = useState('enterprise');
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [mlModels, setMLModels] = useState<any[]>([]);
  const [tradingPairs, setTradingPairs] = useState<any>({ exchanges: {} });
  const [socialSignals, setSocialSignals] = useState<any[]>([]);
  
  // Dashboard customization - YOUR EXISTING HOOKS
  const {
    cards,
    isCustomizing,
    toggleCardVisibility,
    resetLayout,
    getVisibleCards,
    toggleCustomization
  } = useDraggableDashboard();
  
  // Persistent stats - YOUR EXISTING HOOKS
  const { 
    stats: persistentStats, 
    updateStats,
    resetStats
  } = usePersistentStats();
  
  // Database connection - YOUR EXISTING HOOKS
  const {
    dbState,
    loadFromDatabase,
    syncTradingState,
    syncTradingStats,
    syncTrades
  } = useDatabase();
  
  // ============= NEW WEBSOCKET INTEGRATION START =============
  // WebSocket integration for real-time ML trading
  const {
    stats: wsStats,
    isConnected: wsConnected,
    lastPrediction,
    lastTrade: wsLastTrade,
    startTrading: wsStartTrading,
    stopTrading: wsStopTrading,
    toggleModel: wsToggleModel,
    refreshStats
  } = useWebSocketStats();
  
  // WebSocket Status Component
  const WebSocketStatus = () => (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
      <span className="text-xs text-gray-400">
        {wsConnected ? 'Live Connected' : 'Connecting...'}
      </span>
      {wsConnected && wsStats.predictions24h > 0 && (
        <span className="text-xs text-blue-400 ml-2">
          {wsStats.predictions24h} predictions/24h
        </span>
      )}
      {wsConnected && wsStats.activeModels > 0 && (
        <span className="text-xs text-green-400 ml-2">
          {wsStats.activeModels} models active
        </span>
      )}
    </div>
  );
  
  // Sync WebSocket stats with existing state
  useEffect(() => {
    if (wsStats && wsStats.lastUpdate > 0) {
      // Update persistent stats with real ML data
      updateStats({
        totalTrades: wsStats.totalTrades,
        profitLoss: wsStats.totalProfit - wsStats.totalLoss,
        winRate: wsStats.winRate,
        totalVolume: wsStats.totalTrades * 100,
        successRate: wsStats.winRate,
        activeAlerts: 0,
        roi: ((wsStats.totalProfit - wsStats.totalLoss) / 10000) * 100
      });
      
      // Update ML models with real stats from backend
      if (wsStats.mlModelStats && wsStats.mlModelStats.length > 0) {
        setMLModels(prev => {
          return prev.map(model => {
            const realStats = wsStats.mlModelStats.find(m => m.type === model.type);
            if (realStats) {
              return {
                ...model,
                accuracy: realStats.accuracy,
                predictions: realStats.predictions,
                profitGenerated: realStats.profitGenerated,
                lastPrediction: realStats.lastPrediction,
                lastTraining: realStats.lastTraining
              };
            }
            return model;
          });
        });
      }
      
      // Update balances with real trading results
      setBalance(wsStats.paperBalance);
      setLiveBalance(wsStats.liveBalance);
      
      console.log('📡 WebSocket Stats Updated:', {
        connected: wsConnected,
        trades: wsStats.totalTrades,
        models: wsStats.activeModels,
        predictions: wsStats.predictions24h
      });
    }
  }, [wsStats, updateStats]);
  
  // Handle new ML predictions
  useEffect(() => {
    if (lastPrediction) {
      console.log('🎯 New ML Prediction:', lastPrediction);
      
      // Alert on high confidence predictions
      if (lastPrediction.prediction && lastPrediction.prediction.confidence > 0.8) {
        console.log(`⚡ HIGH CONFIDENCE ${lastPrediction.prediction.action} signal for ${lastPrediction.symbol}`);
      }
    }
  }, [lastPrediction]);
  
  // Handle new trades from ML engine
  useEffect(() => {
    if (wsLastTrade) {
      console.log('💰 Trade Executed by ML:', wsLastTrade);
      
      // Add ML trade to trades array
      setTrades(prev => [wsLastTrade, ...prev].slice(0, 100));
      
      // Save to localStorage
      const updatedTrades = [wsLastTrade, ...trades].slice(0, 100);
      localStorage.setItem('memebot_trades', JSON.stringify(updatedTrades));
      
      // Sync with database
      syncTrades(updatedTrades);
    }
  }, [wsLastTrade, trades, syncTrades]);
  
  // Auto-refresh stats when trading is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsConnected && isTrading) {
        refreshStats();
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [wsConnected, isTrading, refreshStats]);
  // ============= NEW WEBSOCKET INTEGRATION END =============
  
  // Initialize data on mount - YOUR EXISTING CODE
  useEffect(() => {
    // Load trades from localStorage
    const savedTrades = localStorage.getItem('memebot_trades');
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (error) {
        console.error('Error parsing saved trades:', error);
      }
    } else {
      generateInitialTrades();
    }
    
    // Try to load from database
    loadFromDatabase().then(data => {
      if (data) {
        console.log('Loaded data from database:', data);
        if (data.tradingState) {
          setIsTrading(data.tradingState.isTrading || false);
          setIsPaperTrading(data.tradingState.isPaperTrading !== false);
          setBalance(data.tradingState.balance || 10000);
          setLiveBalance(data.tradingState.liveBalance || 5000);
        }
        
        if (data.trades && data.trades.length > 0) {
          setTrades(data.trades);
        }
      }
    }).catch(error => {
      console.error('Error loading from database:', error);
    });
    
    // Initialize other data
    initializeMLModels();
    initializeExchanges();
    initializeSocialSignals();
  }, [loadFromDatabase]);
  
  // Save state changes - YOUR EXISTING CODE
  useEffect(() => {
    localStorage.setItem('memebot_is_trading', JSON.stringify(isTrading));
  }, [isTrading]);
  
  useEffect(() => {
    localStorage.setItem('memebot_is_paper_trading', JSON.stringify(isPaperTrading));
  }, [isPaperTrading]);
  
  useEffect(() => {
    localStorage.setItem('memebot_balance', balance.toString());
  }, [balance]);
  
  useEffect(() => {
    localStorage.setItem('memebot_live_balance', liveBalance.toString());
  }, [liveBalance]);
  
  // YOUR EXISTING FUNCTIONS
  const generateInitialTrades = () => {
    const coins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'];
    const actions = ['BUY', 'SELL'];
    const initialTrades = Array.from({ length: 10 }, (_, i) => ({
      id: `trade-${i}`,
      coin: coins[Math.floor(Math.random() * coins.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      amount: Math.random() * 1000 + 100,
      price: Math.random() * 0.001 + 0.0001,
      profit: (Math.random() - 0.5) * 200,
      timestamp: Date.now() - Math.random() * 86400000,
      exchange: ['Coinbase', 'Kraken', 'Binance'][Math.floor(Math.random() * 3)]
    }));
    setTrades(initialTrades);
    localStorage.setItem('memebot_trades', JSON.stringify(initialTrades));
  };
  
  const initializeMLModels = async () => {
    // Try to fetch ML models from server first
    try {
      const response = await fetch('/api/ml/models');
      if (response.ok) {
        const serverModels = await response.json();
        if (Array.isArray(serverModels) && serverModels.length > 0) {
          const models = serverModels.map((model: any) => ({
            type: model.type || model.name.toLowerCase().replace(/\s+/g, '_'),
            name: model.name,
            accuracy: model.accuracy || 0,
            predictions: model.predictions || 0,
            profitGenerated: model.profitGenerated || 0,
            enabled: model.enabled !== false
          }));
          setMLModels(models);
          console.log('🧠 Loaded ML models from server:', models.length);
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching ML models from server:', error);
    }
    
    // Fallback to default models
    const models: MLModel[] = [
      { type: 'linear_regression', name: 'Linear Regression', accuracy: 72.5, predictions: 1247, profitGenerated: 2847.32, enabled: true },
      { type: 'polynomial_regression', name: 'Polynomial Regression', accuracy: 75.1, predictions: 1089, profitGenerated: 3245.67, enabled: true },
      { type: 'moving_average', name: 'Moving Average', accuracy: 68.3, predictions: 1156, profitGenerated: 1923.45, enabled: true },
      { type: 'rsi_momentum', name: 'RSI Momentum', accuracy: 79.2, predictions: 2341, profitGenerated: 5678.90, enabled: userTier !== 'basic' },
      { type: 'bollinger_bands', name: 'Bollinger Bands', accuracy: 81.7, predictions: 2156, profitGenerated: 6234.12, enabled: userTier !== 'basic' },
      { type: 'macd_signal', name: 'MACD Signal', accuracy: 77.8, predictions: 1987, profitGenerated: 4567.89, enabled: userTier !== 'basic' },
      { type: 'lstm_neural', name: 'LSTM Neural Network', accuracy: 85.4, predictions: 3456, profitGenerated: 12345.67, enabled: ['expert', 'enterprise'].includes(userTier) },
      { type: 'transformer', name: 'Transformer', accuracy: 88.2, predictions: 4234, profitGenerated: 23456.78, enabled: ['expert', 'enterprise'].includes(userTier) },
      { type: 'random_forest', name: 'Random Forest', accuracy: 82.9, predictions: 3123, profitGenerated: 8765.43, enabled: ['pro', 'expert', 'enterprise'].includes(userTier) },
      { type: 'gradient_boost', name: 'Gradient Boost', accuracy: 84.6, predictions: 2987, profitGenerated: 9876.54, enabled: ['pro', 'expert', 'enterprise'].includes(userTier) },
      { type: 'prophet', name: 'Prophet Forecasting', accuracy: 86.1, predictions: 3567, profitGenerated: 15678.90, enabled: ['expert', 'enterprise'].includes(userTier) },
      { type: 'ensemble', name: 'Ensemble Meta-Model', accuracy: 91.3, predictions: 5678, profitGenerated: 34567.90, enabled: userTier === 'enterprise' }
    ];
    setMLModels(models);
    console.log('🧠 Initialized ML models:', models.length);
  };
  
  const initializeExchanges = () => {
    const exchangeList: Exchange[] = [
      {
        id: 'coinbase',
        name: 'Coinbase Pro',
        connected: true,
        hasKeys: true,
        enabled: true,
        fees: { maker: 0.005, taker: 0.005 },
        totalPairs: 200,
        enabledPairs: 8,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 10, requestsPerDay: 10000 }
      },
      {
        id: 'kraken',
        name: 'Kraken',
        connected: true,
        hasKeys: true,
        enabled: true,
        fees: { maker: 0.0016, taker: 0.0026 },
        totalPairs: 180,
        enabledPairs: 8,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 1, requestsPerDay: 5000 }
      },
      {
        id: 'binanceus',
        name: 'Binance US',
        connected: true,
        hasKeys: true,
        enabled: true,
        fees: { maker: 0.001, taker: 0.001 },
        totalPairs: 150,
        enabledPairs: 8,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 20, requestsPerDay: 100000 }
      },
      {
        id: 'cryptocom',
        name: 'Crypto.com',
        connected: false,
        hasKeys: false,
        enabled: false,
        fees: { maker: 0.004, taker: 0.004 },
        totalPairs: 120,
        enabledPairs: 0,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 15, requestsPerDay: 50000 }
      }
    ];
    setExchanges(exchangeList);
    console.log('💱 Initialized exchanges:', exchangeList.length);
  };
  
  const initializeSocialSignals = () => {
    setSocialSignals([
      { platform: 'Twitter', followers: 125000, sentiment: 85, trending: true },
      { platform: 'Reddit', members: 89000, sentiment: 72, trending: false },
      { platform: 'Telegram', members: 45000, sentiment: 91, trending: true }
    ]);
  };
  
  // MODIFIED: Trading controls with WebSocket integration
  const handleStartTrading = () => {
    if (!isTrading) {
      const tradingParams = {
        isPaper: isPaperTrading,
        pairs: ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'],
        riskLevel: 'medium',
        tradeSize: 100
      };
      
      // Start trading via WebSocket for real ML trading
      wsStartTrading(tradingParams);
      
      setIsTrading(true);
      console.log(`🚀 ${isPaperTrading ? 'Paper' : 'Live'} trading started with ML engine`);
      
      // Save state
      localStorage.setItem('memebot_is_trading', 'true');
      
      // Sync with backend database
      syncTradingState({
        isTrading: true,
        isPaperTrading,
        balance: isPaperTrading ? balance : liveBalance,
        liveBalance
      });
    }
  };
  
  const handleStopTrading = () => {
    if (isTrading) {
      // Stop trading via WebSocket
      wsStopTrading();
      
      setIsTrading(false);
      console.log('🛑 Trading stopped');
      
      // Save state
      localStorage.setItem('memebot_is_trading', 'false');
      
      // Sync with backend database
      syncTradingState({
        isTrading: false,
        isPaperTrading,
        balance: isPaperTrading ? balance : liveBalance,
        liveBalance
      });
    }
  };
  
  // MODIFIED: ML model toggle with WebSocket
  const handleToggleModel = (modelType: string) => {
    setMLModels(prev => {
      const updated = prev.map(model => {
        if (model.type === modelType) {
          const newEnabled = !model.enabled;
          
          // Toggle ML model via WebSocket
          wsToggleModel(modelType, newEnabled);
          
          return { ...model, enabled: newEnabled };
        }
        return model;
      });
      return updated;
    });
  };
  
  // YOUR EXISTING executeTrade function
  const executeTrade = (trade: any) => {
    const newTrade = {
      ...trade,
      id: `trade-${Date.now()}`,
      timestamp: Date.now()
    };
    
    const updatedTrades = [newTrade, ...trades].slice(0, 100);
    setTrades(updatedTrades);
    localStorage.setItem('memebot_trades', JSON.stringify(updatedTrades));
    
    // Update balance
    const currentBalance = isPaperTrading ? balance : liveBalance;
    const newBalance = currentBalance + (trade.profit || 0);
    
    if (isPaperTrading) {
      setBalance(newBalance);
    } else {
      setLiveBalance(newBalance);
    }
    
    // Update stats
    updateStats({
      totalTrades: persistentStats.totalTrades + 1,
      profitLoss: persistentStats.profitLoss + (trade.profit || 0),
      winRate: trade.profit > 0 ? 
        ((persistentStats.winRate * persistentStats.totalTrades + 100) / (persistentStats.totalTrades + 1)) :
        ((persistentStats.winRate * persistentStats.totalTrades) / (persistentStats.totalTrades + 1))
    });
    
    // Sync with database
    syncTrades(updatedTrades);
    syncTradingStats(persistentStats);
  };
  
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'trading', name: 'Trading Center', icon: TrendingUp },
    { id: 'exchanges', name: 'Exchanges', icon: Activity },
    { id: 'ml-models', name: 'ML Models', icon: Brain },
    { id: 'social', name: 'Social Media', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-10 h-10 text-purple-400" />
                <div>
                  <h1 className="text-3xl font-bold text-white">MemeMillionaireBot</h1>
                  <p className="text-sm text-gray-400">AI-Powered Meme Coin Trading</p>
                </div>
              </div>
              {/* NEW: WebSocket Status Indicator */}
              <WebSocketStatus />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowReportGenerator(true)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
              
              {!isTrading ? (
                <button
                  onClick={handleStartTrading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start {isPaperTrading ? 'Paper' : 'Live'} Trading
                </button>
              ) : (
                <button
                  onClick={handleStopTrading}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-lg flex items-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Stop Trading
                </button>
              )}
              
              {/* NEW: Refresh Stats Button */}
              <button
                onClick={refreshStats}
                className="p-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-5 h-5 ${wsConnected && isTrading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Trading Status Bar */}
          <div className="mt-4 bg-slate-800/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isTrading ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-sm text-gray-300">
                    {isTrading ? 'Trading Active' : 'Trading Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">
                    Mode: {isPaperTrading ? 'Paper Trading' : 'Live Trading'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">
                    ML Models: {mlModels.filter(m => m.enabled).length}/{mlModels.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    Exchanges: {exchanges.filter(e => e.connected).length}/{exchanges.length}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Current Balance</p>
                  <p className="text-lg font-bold text-white">
                    ${(isPaperTrading ? balance : liveBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-slate-700">
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400 bg-slate-800/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Main Content - ALL YOUR EXISTING COMPONENTS */}
        <main className="space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={persistentStats}
              trades={trades}
              balance={isPaperTrading ? balance : liveBalance}
              isPaperTrading={isPaperTrading}
              isTrading={isTrading}
              cards={cards}
              visibleCards={getVisibleCards()}
              onToggleCard={toggleCardVisibility}
              isCustomizing={isCustomizing}
              onToggleCustomization={toggleCustomization}
              onResetLayout={resetLayout}
              mlModels={mlModels}
              exchanges={exchanges}
              socialSignals={socialSignals}
              tradingPairs={tradingPairs}
              userTier={userTier}
              isAdmin={isAdmin}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
          )}
          
          {activeTab === 'trading' && (
            <TradingCenter
              balance={isPaperTrading ? balance : liveBalance}
              isPaperTrading={isPaperTrading}
              isTrading={isTrading}
              onStartTrading={handleStartTrading}
              onStopTrading={handleStopTrading}
              onExecuteTrade={executeTrade}
              exchanges={exchanges}
              mlModels={mlModels}
              tradingPairs={tradingPairs}
              userTier={userTier}
              isAdmin={isAdmin}
            />
          )}
          
          {activeTab === 'exchanges' && (
            <ExchangeManager
              exchanges={exchanges}
              onUpdateExchanges={setExchanges}
              userTier={userTier}
              isAdmin={isAdmin}
            />
          )}
          
          {activeTab === 'ml-models' && (
            <MLModelConfig
              models={mlModels}
              onToggleModel={handleToggleModel}
              userTier={userTier}
              isAdmin={isAdmin}
              isTraining={wsStats.activeModels > 0} // NEW: Show real training status
            />
          )}
          
          {activeTab === 'social' && (
            <SocialMediaSetup
              onSignalsUpdate={setSocialSignals}
              userTier={userTier}
              isAdmin={isAdmin}
            />
          )}
          
          {activeTab === 'settings' && (
            <SettingsPanel
              isPaperTrading={isPaperTrading}
              onTogglePaperTrading={setIsPaperTrading}
              userTier={userTier}
              isAdmin={isAdmin}
              onResetStats={resetStats}
            />
          )}
        </main>
        
        {/* Modals - YOUR EXISTING MODALS */}
        {showReportGenerator && (
          <ReportGenerator
            stats={persistentStats}
            trades={trades}
            mlModels={mlModels}
            exchanges={exchanges}
            onClose={() => setShowReportGenerator(false)}
          />
        )}
        
        {showUpgradeModal && (
          <UpgradeModal
            currentTier={userTier}
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={(tier) => {
              setUserTier(tier);
              setShowUpgradeModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
}