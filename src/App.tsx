// src/App.tsx - Using your actual component file names
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Import your actual components with correct names
import DashboardCard from './components/DashboardCard';
import DashboardCustomizer from './components/DashboardCustomizer';
import DatabaseStatus from './components/DatabaseStatus';
import ExchangeManager from './components/ExchangeManager';
import HotPairsTicker from './components/HotPairsTicker';
import AILearningTracker from './components/AILearningTracker';
import SocialMediaSetup from './components/SocialMediaSetup';
import TradingSettings from './components/TradingSettings';
import PersistentSettings from './components/PersistentSettings';
import ReportGenerator from './components/ReportGenerator';
import TierConfigurationPanel from './components/TierConfigurationPanel';
import TradingTab from './components/TradingTab';
import RecentTrades from './components/RecentTrades';
import TradingControls from './components/TradingControls';
import MLTradingAgent from './components/MLTradingAgent';
import PerformanceCharts from './components/PerformanceCharts';
import VisualChartsTab from './components/VisualChartsTab';
import PLCards from './components/PLCards';
import IndividualSocialAccounts from './components/IndividualSocialAccounts';
import SocialSignalIntegration from './components/SocialSignalIntegration';
import TradingPairsManager from './components/TradingPairsManager';
import UserTierDisplay from './components/UserTierDisplay';
import TierEnforcement from './components/TierEnforcement';
import TierManagement from './components/TierManagement';
import ExchangeDataTester from './components/ExchangeDataTester';

// Create wrapper components for missing ones or use alternatives
const Dashboard = ({ ...props }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <PLCards {...props} />
      <DashboardCard {...props} />
    </div>
    <HotPairsTicker />
    <AILearningTracker mlModels={props.mlModels} />
    <RecentTrades trades={props.trades} />
    <PerformanceCharts />
  </div>
);

const TradingCenter = ({ ...props }: any) => (
  <div className="space-y-6">
    <TradingTab {...props} />
    <TradingControls {...props} />
    <TradingPairsManager {...props} />
    <MLTradingAgent {...props} />
  </div>
);

const SettingsPanel = ({ ...props }: any) => (
  <div className="space-y-6">
    <TradingSettings {...props} />
    <PersistentSettings {...props} />
    <TierConfigurationPanel {...props} />
    <UserTierDisplay {...props} />
  </div>
);

const MLModelConfig = MLTradingAgent; // Use MLTradingAgent as ML config
const UpgradeModal = TierManagement; // Use TierManagement as upgrade modal

// Hooks - create simple versions if they don't exist
const useDraggableDashboard = () => {
  const [cards] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  return {
    cards,
    isCustomizing,
    toggleCardVisibility: () => {},
    resetLayout: () => {},
    getVisibleCards: () => [],
    toggleCustomization: () => setIsCustomizing(!isCustomizing)
  };
};

const usePersistentStats = () => {
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitLoss: 0,
    winRate: 0,
    totalVolume: 0,
    successRate: 0,
    activeAlerts: 0,
    roi: 0
  });
  return {
    stats,
    updateStats: (newStats: any) => setStats({ ...stats, ...newStats }),
    resetStats: () => setStats({
      totalTrades: 0,
      profitLoss: 0,
      winRate: 0,
      totalVolume: 0,
      successRate: 0,
      activeAlerts: 0,
      roi: 0
    })
  };
};

const useDatabase = () => {
  return {
    dbState: 'connected',
    loadFromDatabase: async () => null,
    syncTradingState: async (state: any) => {},
    syncTradingStats: async (stats: any) => {},
    syncTrades: async (trades: any[]) => {}
  };
};

// WebSocket hook inline
const useWebSocketStats = () => {
  const [stats, setStats] = useState({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    winRate: 0,
    currentBalance: 10000,
    liveBalance: 5000,
    paperBalance: 10000,
    mlModelStats: [],
    exchangeStatus: {},
    activeModels: 0,
    predictions24h: 0,
    lastUpdate: Date.now()
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastPrediction, setLastPrediction] = useState<any>(null);
  const [lastTrade, setLastTrade] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/ws`
      : 'ws://localhost:3001/ws';
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    try {
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        ws.current?.send(JSON.stringify({
          type: 'request_stats'
        }));
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
      
      ws.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        ws.current = null;
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, []);
  
  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'initial_stats':
      case 'stats_update':
        setStats(message.data);
        break;
        
      case 'ml_prediction':
        setLastPrediction(message.data);
        setStats(prev => ({
          ...prev,
          predictions24h: prev.predictions24h + 1
        }));
        break;
        
      case 'trade_executed':
        setLastTrade(message.data);
        setStats(prev => {
          const newStats = { ...prev };
          newStats.totalTrades++;
          
          if (message.data.profit > 0) {
            newStats.winningTrades++;
            newStats.totalProfit += message.data.profit;
          } else {
            newStats.losingTrades++;
            newStats.totalLoss += Math.abs(message.data.profit);
          }
          
          newStats.winRate = newStats.totalTrades > 0 
            ? (newStats.winningTrades / newStats.totalTrades) * 100 
            : 0;
          
          if (message.data.isPaper) {
            newStats.paperBalance += message.data.profit;
          } else {
            newStats.liveBalance += message.data.profit;
          }
          
          return newStats;
        });
        break;
        
      case 'training_complete':
        console.log('🎓 ML training complete:', message.data);
        setStats(prev => ({
          ...prev,
          mlModelStats: message.data.models
        }));
        break;
    }
  };
  
  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }, []);
  
  const startTrading = useCallback((params: any) => {
    sendMessage({
      type: 'start_trading',
      params: params
    });
  }, [sendMessage]);
  
  const stopTrading = useCallback(() => {
    sendMessage({
      type: 'stop_trading'
    });
  }, [sendMessage]);
  
  const toggleModel = useCallback((modelType: string, enabled: boolean) => {
    sendMessage({
      type: 'toggle_model',
      modelType: modelType,
      enabled: enabled
    });
  }, [sendMessage]);
  
  const refreshStats = useCallback(() => {
    sendMessage({
      type: 'request_stats'
    });
  }, [sendMessage]);
  
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshStats();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, refreshStats]);
  
  return {
    stats,
    isConnected,
    lastPrediction,
    lastTrade,
    startTrading,
    stopTrading,
    toggleModel,
    refreshStats,
    sendMessage
  };
};

interface MLModel {
  type: string;
  name: string;
  accuracy: number;
  predictions: number;
  profitGenerated: number;
  enabled: boolean;
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
  // Core state
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
  
  // Use hooks
  const {
    cards,
    isCustomizing,
    toggleCardVisibility,
    resetLayout,
    getVisibleCards,
    toggleCustomization
  } = useDraggableDashboard();
  
  const { 
    stats: persistentStats, 
    updateStats,
    resetStats
  } = usePersistentStats();
  
  const {
    dbState,
    loadFromDatabase,
    syncTradingState,
    syncTradingStats,
    syncTrades
  } = useDatabase();
  
  // WebSocket integration
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
  
  // Update stats when WebSocket data arrives
  useEffect(() => {
    if (wsStats && wsStats.lastUpdate > 0) {
      updateStats({
        totalTrades: wsStats.totalTrades,
        profitLoss: wsStats.totalProfit - wsStats.totalLoss,
        winRate: wsStats.winRate,
        totalVolume: wsStats.totalTrades * 100,
        successRate: wsStats.winRate,
        activeAlerts: 0,
        roi: ((wsStats.totalProfit - wsStats.totalLoss) / 10000) * 100
      });
      
      if (wsStats.mlModelStats && wsStats.mlModelStats.length > 0) {
        setMLModels(prev => {
          return prev.map(model => {
            const realStats = wsStats.mlModelStats.find((m: any) => m.type === model.type);
            if (realStats) {
              return {
                ...model,
                accuracy: realStats.accuracy,
                predictions: realStats.predictions,
                profitGenerated: realStats.profitGenerated
              };
            }
            return model;
          });
        });
      }
      
      setBalance(wsStats.paperBalance);
      setLiveBalance(wsStats.liveBalance);
    }
  }, [wsStats, updateStats]);
  
  // Handle new ML predictions
  useEffect(() => {
    if (lastPrediction) {
      console.log('🎯 New ML Prediction:', lastPrediction);
      
      if (lastPrediction.prediction && lastPrediction.prediction.confidence > 0.8) {
        console.log(`⚡ HIGH CONFIDENCE ${lastPrediction.prediction.action} signal for ${lastPrediction.symbol}`);
      }
    }
  }, [lastPrediction]);
  
  // Handle new trades from WebSocket
  useEffect(() => {
    if (wsLastTrade) {
      console.log('💰 Trade Executed:', wsLastTrade);
      setTrades(prev => [wsLastTrade, ...prev].slice(0, 100));
    }
  }, [wsLastTrade]);
  
  // Initialize data on mount
  useEffect(() => {
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
    
    initializeMLModels();
    initializeExchanges();
    initializeSocialSignals();
  }, []);
  
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
  
  const initializeMLModels = () => {
    const models: MLModel[] = [
      { type: 'linear_regression', name: 'Linear Regression', accuracy: 72.5, predictions: 1247, profitGenerated: 2847.32, enabled: true },
      { type: 'polynomial_regression', name: 'Polynomial Regression', accuracy: 75.1, predictions: 1089, profitGenerated: 3245.67, enabled: true },
      { type: 'moving_average', name: 'Moving Average', accuracy: 68.3, predictions: 1156, profitGenerated: 1923.45, enabled: true },
      { type: 'rsi_momentum', name: 'RSI Momentum', accuracy: 79.2, predictions: 2341, profitGenerated: 5678.90, enabled: true },
      { type: 'bollinger_bands', name: 'Bollinger Bands', accuracy: 81.7, predictions: 2156, profitGenerated: 6234.12, enabled: true },
      { type: 'macd_signal', name: 'MACD Signal', accuracy: 77.8, predictions: 1987, profitGenerated: 4567.89, enabled: true },
      { type: 'lstm_neural', name: 'LSTM Neural Network', accuracy: 85.4, predictions: 3456, profitGenerated: 12345.67, enabled: true },
      { type: 'ensemble', name: 'Ensemble Meta-Model', accuracy: 91.3, predictions: 5678, profitGenerated: 34567.90, enabled: true }
    ];
    setMLModels(models);
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
      }
    ];
    setExchanges(exchangeList);
  };
  
  const initializeSocialSignals = () => {
    setSocialSignals([
      { platform: 'Twitter', followers: 125000, sentiment: 85, trending: true },
      { platform: 'Reddit', members: 89000, sentiment: 72, trending: false },
      { platform: 'Telegram', members: 45000, sentiment: 91, trending: true }
    ]);
  };
  
  // Trading controls with WebSocket
  const handleStartTrading = () => {
    if (!isTrading) {
      const tradingParams = {
        isPaper: isPaperTrading,
        pairs: ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'],
        riskLevel: 'medium',
        tradeSize: 100
      };
      
      wsStartTrading(tradingParams);
      setIsTrading(true);
      
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
      wsStopTrading();
      setIsTrading(false);
      
      syncTradingState({
        isTrading: false,
        isPaperTrading,
        balance: isPaperTrading ? balance : liveBalance,
        liveBalance
      });
    }
  };
  
  // ML model toggle with WebSocket
  const handleToggleModel = (modelType: string) => {
    setMLModels(prev => {
      const updated = prev.map(model => {
        if (model.type === modelType) {
          const newEnabled = !model.enabled;
          wsToggleModel(modelType, newEnabled);
          return { ...model, enabled: newEnabled };
        }
        return model;
      });
      return updated;
    });
  };
  
  const executeTrade = (trade: any) => {
    const newTrade = {
      ...trade,
      id: `trade-${Date.now()}`,
      timestamp: Date.now()
    };
    
    const updatedTrades = [newTrade, ...trades].slice(0, 100);
    setTrades(updatedTrades);
    localStorage.setItem('memebot_trades', JSON.stringify(updatedTrades));
    
    const currentBalance = isPaperTrading ? balance : liveBalance;
    const newBalance = currentBalance + (trade.profit || 0);
    
    if (isPaperTrading) {
      setBalance(newBalance);
    } else {
      setLiveBalance(newBalance);
    }
    
    updateStats({
      totalTrades: persistentStats.totalTrades + 1,
      profitLoss: persistentStats.profitLoss + (trade.profit || 0),
      winRate: trade.profit > 0 ? 
        ((persistentStats.winRate * persistentStats.totalTrades + 100) / (persistentStats.totalTrades + 1)) :
        ((persistentStats.winRate * persistentStats.totalTrades) / (persistentStats.totalTrades + 1))
    });
    
    syncTrades(updatedTrades);
    syncTradingStats(persistentStats);
  };
  
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'trading', name: 'Trading', icon: TrendingUp },
    { id: 'exchanges', name: 'Exchanges', icon: Activity },
    { id: 'ml-models', name: 'ML Models', icon: Brain },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings },
    { id: 'charts', name: 'Charts', icon: Activity }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6">
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
              <WebSocketStatus />
            </div>
            
            <div className="flex items-center gap-4">
              {activeTab === 'dashboard' && (
                <DashboardCustomizer 
                  isCustomizing={isCustomizing}
                  onToggle={toggleCustomization}
                />
              )}
              
              <button
                onClick={() => setShowReportGenerator(true)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Report
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
              
              <button
                onClick={refreshStats}
                className="p-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                title="Refresh Stats"
              >
                <RefreshCw className={`w-5 h-5 ${wsConnected && isTrading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
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
              <div className="text-right">
                <p className="text-xs text-gray-400">Current Balance</p>
                <p className="text-lg font-bold text-white">
                  ${(isPaperTrading ? balance : liveBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </header>
        
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
        
        <main className="space-y-6">
          <DatabaseStatus />
          
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
            <div className="space-y-6">
              <ExchangeManager
                exchanges={exchanges}
                onUpdateExchanges={setExchanges}
                userTier={userTier}
                isAdmin={isAdmin}
              />
              <ExchangeDataTester />
            </div>
          )}
          
          {activeTab === 'ml-models' && (
            <MLModelConfig
              models={mlModels}
              onToggleModel={handleToggleModel}
              userTier={userTier}
              isAdmin={isAdmin}
              isTraining={wsStats.activeModels > 0}
            />
          )}
          
          {activeTab === 'social' && (
            <div className="space-y-6">
              <SocialMediaSetup
                onSignalsUpdate={setSocialSignals}
                userTier={userTier}
                isAdmin={isAdmin}
              />
              <IndividualSocialAccounts />
              <SocialSignalIntegration signals={socialSignals} />
            </div>
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
          
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <VisualChartsTab />
              <PerformanceCharts />
            </div>
          )}
        </main>
        
        {/* Modals */}
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
            onUpgrade={(tier: string) => {
              setUserTier(tier);
              setShowUpgradeModal(false);
            }}
          />
        )}
        
        {/* Tier enforcement overlay */}
        <TierEnforcement userTier={userTier} />
      </div>
    </div>
  );
}