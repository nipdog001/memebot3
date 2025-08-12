import React, { useState, useEffect, useRef } from 'react';
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
  Crown,
  Star,
  Users,
  MessageCircle,
  FileText,
  Eye,
  EyeOff,
  Coins,
  RefreshCw,
  Globe,
  Calculator,
  Spade as Upgrade,
  ToggleLeft,
  ToggleRight,
  Layout,
  Smartphone,
  Database
} from 'lucide-react';

import ExchangeManager from './components/ExchangeManager';
import TradingTab from './components/TradingTab';
import AILearningTracker from './components/AILearningTracker';
import HotPairsTicker from './components/HotPairsTicker';
import SocialSignalIntegration from './components/SocialSignalIntegration';
import IndividualSocialAccounts from './components/IndividualSocialAccounts';
import SocialMediaSetup from './components/SocialMediaSetup';
import PersistentSettings from './components/PersistentSettings';
import ReportGenerator from './components/ReportGenerator';
import TierManagement from './components/TierManagement';
import UserTierDisplay from './components/UserTierDisplay';
import TierConfigurationPanel from './components/TierConfigurationPanel';
import ExchangeDataTester from './components/ExchangeDataTester';
import DashboardCustomizer from './components/DashboardCustomizer';
import DashboardCard from './components/DashboardCard';
import PLCards from './components/PLCards';
import DatabaseStatus from './components/DatabaseStatus';
import TradingPairsManager from './components/TradingPairsManager';

import { usePersistentStats } from './hooks/usePersistentStats';
import { useDraggableDashboard } from './hooks/useDraggableDashboard';

interface Trade {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  amount: number;
  buyPrice: number;
  sellPrice: number;
  netProfit: number;
  totalFees: number;
  buyFee: number;
  sellFee: number;
  buyFeeRate: number;
  sellFeeRate: number;
  mlConfidence: number;
  decidingModels: string[];
  timestamp: number;
  positionSize: number;
}

interface PersistentStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalFees: number;
  dailyPL: number;
  weeklyPL: number;
  monthlyPL: number;
  winRate: number;
  lastResetDate: string;
  weeklyComparison: number;
  monthlyComparison: number;
}

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
  apiLimits: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
}

interface TradingPairs {
  exchanges: Record<string, any[]>;
  enabledPairs: number;
}

interface SocialSignal {
  id: string;
  platform: 'twitter' | 'telegram' | 'reddit';
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
  content: string;
  source: string;
}

interface UserSubscription {
  currentTier: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  trialDaysLeft?: number;
  usageStats: {
    tradesUsed: number;
    mlModelsUsed: number;
    exchangesConnected: number;
    apiCallsUsed: number;
  };
}

interface UserTier {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyDiscount: number;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  limits: {
    maxTrades: number;
    maxCapital: number;
    positionSizeMax: number;
    mlModels: number;
    exchanges: number;
    tradingPairs: number;
    socialPlatforms: number;
    apiCalls: number;
    supportLevel: string;
    riskManagement: string;
  };
}

const AVAILABLE_TIERS: UserTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for beginners learning crypto trading',
    price: 0,
    yearlyDiscount: 0,
    icon: Star,
    color: 'blue',
    features: ['paper_trading', 'basic_ml', 'basic_analytics'],
    limits: {
      maxTrades: 10,
      maxCapital: 1000,
      positionSizeMax: 1,
      mlModels: 3,
      exchanges: 1,
      tradingPairs: 5,
      socialPlatforms: 0,
      apiCalls: 100,
      supportLevel: 'community',
      riskManagement: 'basic'
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for serious traders',
    price: 49,
    yearlyDiscount: 20,
    icon: Zap,
    color: 'green',
    features: ['paper_trading', 'live_trading', 'advanced_ml', 'social_monitoring'],
    limits: {
      maxTrades: 100,
      maxCapital: 50000,
      positionSizeMax: 5,
      mlModels: 8,
      exchanges: 4,
      tradingPairs: 50,
      socialPlatforms: 2,
      apiCalls: 10000,
      supportLevel: 'email',
      riskManagement: 'advanced'
    }
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Professional-grade tools for expert traders',
    price: 149,
    yearlyDiscount: 25,
    icon: Crown,
    color: 'purple',
    features: ['all_features'],
    limits: {
      maxTrades: 1000,
      maxCapital: 500000,
      positionSizeMax: 10,
      mlModels: 15,
      exchanges: 10,
      tradingPairs: 200,
      socialPlatforms: 5,
      apiCalls: 100000,
      supportLevel: 'priority',
      riskManagement: 'professional'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for institutions',
    price: 499,
    yearlyDiscount: 30,
    icon: Building2,
    color: 'gold',
    features: ['all_features'],
    limits: {
      maxTrades: -1,
      maxCapital: -1,
      positionSizeMax: 25,
      mlModels: -1,
      exchanges: -1,
      tradingPairs: -1,
      socialPlatforms: -1,
      apiCalls: -1,
      supportLevel: 'dedicated',
      riskManagement: 'enterprise'
    }
  }
];

export default function App() {
  // Core trading state
  const [isTrading, setIsTrading] = useState(false); // Don't start trading by default
  const [isPaperTrading, setIsPaperTrading] = useState(true);
  const [balance, setBalance] = useState(10000);
  const [liveBalance, setLiveBalance] = useState(5000);
  const [exchangeBalances, setExchangeBalances] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeInterval, setTradeInterval] = useState<NodeJS.Timeout | null>(null);
  const [tradeFrequency, setTradeFrequency] = useState(1000); // 1 second between trades
  
  // System state
  const [mlModels, setMLModels] = useState<MLModel[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPairs>({ exchanges: {}, enabledPairs: 0 });
  const [socialSignals, setSocialSignals] = useState<SocialSignal[]>([]);
  
  // Statistics
  const { 
    stats: persistentStats, 
    updateStats, 
    resetStats,
    getTodaysStats,
    getWeeklyStats,
    getMonthlyStats
  } = usePersistentStats();

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // User and subscription state
  const [userTier, setUserTier] = useState('enterprise'); // Default to enterprise for admin
  const [isAdmin, setIsAdmin] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    currentTier: 'enterprise',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    autoRenew: true,
    usageStats: {
      tradesUsed: 45,
      mlModelsUsed: 8,
      exchangesConnected: 3,
      apiCallsUsed: 2500
    }
  });
  
  // Dashboard customization
  const {
    cards,
    isDragging,
    draggedCard,
    isCustomizing,
    updateCardPosition,
    updateCardSize,
    toggleCardVisibility,
    resetLayout,
    getVisibleCards,
    getCardById,
    startDragging,
    stopDragging,
    toggleCustomization
  } = useDraggableDashboard();

  // Cross-device sync
  const [syncStatus, setSyncStatus] = useState({
    isEnabled: true,
    lastSync: new Date(),
    connectedDevices: 3,
    isSyncing: false
  });

  // Database connection status
  const [dbStatus, setDbStatus] = useState({
    isConnected: false,
    type: 'unknown' as 'postgres' | 'sqlite' | 'json-file' | 'unknown',
    lastChecked: null as Date | null,
    error: null as string | null
  });

  // WebSocket connection
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load persistent data on mount and connect WebSocket
  const initialLoadCompleted = useRef(false);
  const socketConnectionAttempts = useRef(0);
  const maxSocketRetries = 3;
  
  useEffect(() => {
    loadPersistentData();
    initializeMLModels();
    initializeExchanges();
    
    // Connect WebSocket with proper URL
    connectWebSocket();
    
    initialLoadCompleted.current = true;
    
    // Set up sync interval
    const syncInterval = setInterval(() => {
      if (syncStatus.isEnabled && socket?.readyState === WebSocket.OPEN) {
        simulateSync();
      }
    }, 60000); // Every minute
    
    return () => {
      clearInterval(syncInterval);
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Prevent multiple initialization attempts
  useEffect(() => {
    if (initialLoadCompleted.current && !socket && socketConnectionAttempts.current < maxSocketRetries) {
      connectWebSocket();
    }
  }, [socket]);

  // Initialize trading pairs after exchanges are loaded
  useEffect(() => {
    if (exchanges.length > 0) {
      initializeTradingPairs();
    }
  }, [exchanges]);

  // Handle trading state changes - only start trading if exchanges are loaded
  useEffect(() => {
    if (isTrading && exchanges.length > 0) {
      startTradingSimulation();
    } else if (tradeInterval) {
      clearInterval(tradeInterval);
      setTradeInterval(null);
    }
    
    return () => {
      if (tradeInterval) {
        clearInterval(tradeInterval);
      }
    };
  }, [isTrading, tradeFrequency, exchanges]);

  // Auto-save persistent data
  useEffect(() => {
    savePersistentData();
  }, [balance, liveBalance, trades, userTier, isAdmin]);

  // Add HTTP-based polling for cross-device sync since WebSocket protocols don't match
  // FIXED: Removed window.location.reload() to prevent tab jumping
  useEffect(() => {
    // Poll server for stats updates every 10 seconds to reduce network traffic
    const syncInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/stats/detailed');
        if (response.ok) {
          const serverStats = await response.json();
          
          // Check if server stats are different from local
          if (serverStats.totalTrades !== persistentStats.totalTrades ||
              serverStats.totalProfit !== persistentStats.totalProfit) {
            console.log('Stats out of sync, updating from server...');
            
            // Update stats without reloading the page
            // Just update the stats object instead of reloading
            const updatedStats = {
              netProfit: 0, // Dummy value to satisfy the interface
              totalTrades: serverStats.totalTrades || persistentStats.totalTrades,
              winningTrades: serverStats.winningTrades || persistentStats.winningTrades,
              losingTrades: serverStats.losingTrades || persistentStats.losingTrades,
              totalProfit: serverStats.totalProfit || persistentStats.totalProfit,
              totalFees: serverStats.totalFees || persistentStats.totalFees,
              dailyPL: serverStats.dailyPL || persistentStats.dailyPL,
              weeklyPL: serverStats.weeklyPL || persistentStats.weeklyPL,
              monthlyPL: serverStats.monthlyPL || persistentStats.monthlyPL,
              winRate: serverStats.winRate || persistentStats.winRate
            };
            updateStats(updatedStats);
          }
        }
      } catch (error) {
        console.error('Sync polling error:', error);
        // Don't reload on error - just log it
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(syncInterval);
  }, [persistentStats.totalTrades, persistentStats.totalProfit, updateStats]);

  // Check database status periodically
  useEffect(() => {
    checkDatabaseStatus();
    
    const interval = setInterval(() => {
      checkDatabaseStatus(true); // Silent check
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for trading pairs updates via WebSocket
  useEffect(() => {
    const handleTradingPairsUpdate = (event: CustomEvent) => {
      console.log('Trading pairs update received:', event.detail);
      if (event.detail && event.detail.allPairs) {
        // Update trading pairs state
        setTradingPairs(event.detail.allPairs);
      }
    };

    // Listen for custom events
    window.addEventListener('tradingPairsUpdate', handleTradingPairsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tradingPairsUpdate', handleTradingPairsUpdate as EventListener);
    };
  }, []);

  // Add visibility change handler to manage WebSocket when tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden, closing WebSocket');
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      } else {
        console.log('Tab visible, reconnecting WebSocket');
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          setTimeout(connectWebSocket, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  // WebSocket connection
  const connectWebSocket = () => {
    // Prevent connection if tab is hidden
    if (document.hidden) {
      console.log('Tab is hidden, skipping WebSocket connection');
      return;
    }
    
    try {
      // Determine Socket.IO URL based on environment
      let socketUrl;
      if (window.location.hostname === 'localhost') {
        socketUrl = 'ws://localhost:3001/ws';
      } else {
        // Production - use same host
        socketUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}${window.location.host}`;
      }
      
      console.log('Connecting to Socket.IO:', socketUrl);
      
      // Create WebSocket connection
      const newSocket = new WebSocket(socketUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected!');
        setIsConnected(true);
        
        // Request initial sync
        newSocket.send(JSON.stringify({ type: 'requestSync' }));
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'welcome') {
            console.log('Welcome message received:', data);
          }
          
          if (data.type === 'statsUpdate') {
            console.log('Stats update received:', data);
            if (data.data && typeof data.data === 'object') {
              updateStats(data.data);
            }
          }
          
          if (data.type === 'userStateUpdate') {
            console.log('User state update received:', data);
          }
          
          if (data.type === 'forceSync') {
            console.log('Force sync received:', data);
            if (data.data && data.data.stats) {
              updateStats(data.data.stats);
            }
          }
          
          if (data.type === 'tradingStatusUpdate') {
            console.log('Trading status update:', data);
            if (data.data && data.data.isActive !== undefined) {
              setIsTrading(data.data.isActive);
            }
          }
          
          if (data.type === 'statsReset') {
            console.log('Stats reset received:', data);
            resetStats();
            setTrades([]);
            setBalance(10000);
            setLiveBalance(5000);
          }
          
          if (data.type === 'tradingPairsUpdate') {
            console.log('Trading pairs update via WebSocket:', data);
            window.dispatchEvent(new CustomEvent('tradingPairsUpdate', { detail: data }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      };

      setSocket(newSocket);
      
      // Store socket globally for debugging
      (window as any).socket = newSocket;
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const checkDatabaseStatus = async (silent = false) => {
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/database/status?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setDbStatus({
          isConnected: data.status === 'connected',
          type: data.type || 'sqlite', // Default to sqlite if not specified
          lastChecked: new Date(),
          error: null
        });
      }
    } catch (error) {
      if (!silent) {
        console.error('Error checking database status:', error);
        setDbStatus({
          isConnected: false,
          type: 'unknown',
          lastChecked: new Date(),
          error: null
        });
      }
    }
  };

  const simulateSync = () => {
    setSyncStatus(prev => ({
      ...prev,
      isSyncing: true
    }));
    
    // Simulate network delay
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        isSyncing: false
      }));
      
      console.log('📱 Cross-device sync completed');
    }, 1000);
  };

  // FIXED: Removed window.location.reload() to prevent tab jumping
  const forceSyncAllDevices = async () => {
    try {
      // Don't clear local storage - this causes state loss
      localStorage.clear();
      
      // Force sync from server
      const response = await fetch('/api/sync/force', { method: 'POST' });
      if (response.ok) {
        console.log('Force sync completed');
        
        // Reload data from server instead of reloading page
        loadPersistentData();
        
        // Emit sync event via WebSocket if connected
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.emit('forceSync');
        }
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  };

  const loadPersistentData = () => {
    try {
      // Load balances
      const savedBalance = localStorage.getItem('memebot_balance');
      const savedLiveBalance = localStorage.getItem('memebot_live_balance');
      const savedTrades = localStorage.getItem('memebot_trades');
      const savedUserTier = localStorage.getItem('memebot_user_tier');
      const savedIsAdmin = localStorage.getItem('memebot_is_admin');
      const savedIsTrading = localStorage.getItem('memebot_is_trading');
      const savedIsPaperTrading = localStorage.getItem('memebot_is_paper_trading');

      if (savedBalance) setBalance(parseFloat(savedBalance));
      if (savedLiveBalance) setLiveBalance(parseFloat(savedLiveBalance));
      if (savedTrades) setTrades(JSON.parse(savedTrades));
      if (savedUserTier) setUserTier(savedUserTier);
      if (savedIsAdmin) setIsAdmin(JSON.parse(savedIsAdmin));
      if (savedIsTrading) setIsTrading(JSON.parse(savedIsTrading));
      if (savedIsPaperTrading) setIsPaperTrading(JSON.parse(savedIsPaperTrading));

      console.log('📊 Loaded persistent data successfully');
    } catch (error) {
      console.error('Error loading persistent data:', error);
    }
  };

  const savePersistentData = () => {
    try {
      localStorage.setItem('memebot_balance', balance.toString());
      localStorage.setItem('memebot_live_balance', liveBalance.toString());
      localStorage.setItem('memebot_trades', JSON.stringify(trades));
      localStorage.setItem('memebot_user_tier', userTier);
      localStorage.setItem('memebot_is_admin', JSON.stringify(isAdmin));
      localStorage.setItem('memebot_is_trading', JSON.stringify(isTrading));
      localStorage.setItem('memebot_is_paper_trading', JSON.stringify(isPaperTrading));
      
      // Simulate cross-device sync
      if (syncStatus.isEnabled) {
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date()
        }));
      }
    } catch (error) {
      console.error('Error saving persistent data:', error);
    }
  };

  const initializeMLModels = () => {
    const models: MLModel[] = [
      { type: 'linear', name: 'Linear Regression', accuracy: 72.5, predictions: 1247, profitGenerated: 2847.32, enabled: true },
      { type: 'polynomial', name: 'Polynomial Regression', accuracy: 75.1, predictions: 1089, profitGenerated: 3245.67, enabled: true },
      { type: 'moving_avg', name: 'Moving Average', accuracy: 68.3, predictions: 1156, profitGenerated: 1923.45, enabled: true },
      { type: 'rsi', name: 'RSI Momentum', accuracy: 79.2, predictions: 2341, profitGenerated: 5678.90, enabled: userTier !== 'basic' },
      { type: 'bollinger', name: 'Bollinger Bands', accuracy: 81.7, predictions: 2156, profitGenerated: 6234.12, enabled: userTier !== 'basic' },
      { type: 'macd', name: 'MACD Signal', accuracy: 77.8, predictions: 1987, profitGenerated: 4567.89, enabled: userTier !== 'basic' },
      { type: 'lstm', name: 'LSTM Neural Network', accuracy: 85.4, predictions: 3456, profitGenerated: 12345.67, enabled: ['expert', 'enterprise'].includes(userTier) },
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
        id: 'gemini',
        name: 'Gemini',
        connected: true,
        hasKeys: true,
        enabled: true,
        fees: { maker: 0.001, taker: 0.0035 },
        totalPairs: 80,
        enabledPairs: 8,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 5, requestsPerDay: 7200 }
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
        connected: true,
        hasKeys: true,
        enabled: true,
        fees: { maker: 0.004, taker: 0.004 },
        totalPairs: 8,
        tradingHours: '24/7',
        apiLimits: { requestsPerSecond: 100, requestsPerDay: 500000 }
      }
    ];
    setExchanges(exchangeList);
    console.log('📊 Initialized exchanges:', exchangeList.length);
  };

  const initializeTradingPairs = () => {
    // Try to load from localStorage first
    const savedPairs = localStorage.getItem('tradingPairs');
    if (savedPairs) {
      try {
        const parsedPairs = JSON.parse(savedPairs);
        setTradingPairs(parsedPairs);
        console.log('📊 Loaded trading pairs from localStorage:', parsedPairs.enabledPairs);
        return;
      } catch (error) {
        console.error('Error parsing saved trading pairs:', error);
      }
    }
    
    // Initialize with default data if no saved data
    const memeCoins = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'];
    
    const pairs: TradingPairs = {
      exchanges: {},
      enabledPairs: 0
    };

    // Only add pairs for connected and enabled exchanges
    exchanges.forEach(exchange => {
      if (exchange.connected && exchange.enabled) {
        pairs.exchanges[exchange.id] = memeCoins.map(symbol => ({
          symbol,
          base: symbol.split('/')[0],
          quote: symbol.split('/')[1],
          exchange: exchange.id,
          enabled: true,
          isMeme: true,
          price: Math.random() * 0.1 + 0.001,
          volume24h: Math.random() * 1000000,
          priceChange24h: (Math.random() - 0.5) * 20,
          minAmount: 1,
          minCost: 1
        }));
      }
    });

    pairs.enabledPairs = Object.values(pairs.exchanges).flat().filter((p: any) => p.enabled).length;
    setTradingPairs(pairs);
    
    // Save to localStorage
    localStorage.setItem('tradingPairs', JSON.stringify(pairs));
    console.log('📊 Initialized trading pairs:', pairs.enabledPairs);
  };

  // Trading controls
  const toggleTrading = () => {
    if (!isTrading && exchanges.length === 0) {
      alert('Please wait for exchanges to initialize before starting trading.');
      return;
    }
    
    // Update the trading state
    const newTradingState = !isTrading;
    setIsTrading(newTradingState);
    
    // Save the trading state to localStorage
    localStorage.setItem('memebot_is_trading', JSON.stringify(newTradingState));
    
    // Send trading state via WebSocket if connected
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'trading_toggle',
        isTrading: newTradingState
      }));
    } else {
      console.warn('WebSocket not connected, trading state change will not be synced');
    }
    
    return newTradingState;
  };

  const switchTradingMode = () => {
    if (userTier === 'basic' && !isPaperTrading) {
      alert('Live trading requires Pro tier or higher. Please upgrade your subscription.');
      setShowUpgradeModal(true);
      return;
    }
    
    if (!isPaperTrading) {
      const confirmed = confirm('⚠️ SWITCHING TO PAPER TRADING\n\nYou are about to switch from live trading to paper trading mode. This will:\n\n• Stop all live trading activities\n• Switch to simulation mode\n• Use virtual balance instead of real money\n\nDo you want to continue?');
      if (!confirmed) return;
    } else {
      const confirmed = confirm('⚠️ SWITCHING TO LIVE TRADING\n\nYou are about to switch to live trading mode. This will:\n\n• Use real money from connected exchanges\n• Execute actual trades\n• Incur real fees and potential losses\n\nMake sure you understand the risks. Do you want to continue?');
      if (!confirmed) return;
    }
    
    setIsPaperTrading(!isPaperTrading);
    setIsTrading(false); // Stop trading when switching modes
    
    // Save the paper trading state
    localStorage.setItem('memebot_is_paper_trading', JSON.stringify(!isPaperTrading));
  };

  const emergencyStop = () => {
    const confirmed = confirm('🚨 EMERGENCY STOP\n\nThis will immediately:\n\n• Stop all trading activities\n• Cancel pending orders\n• Halt all automated trading\n\nDo you want to execute emergency stop?');
    
    if (confirmed) {
      setIsTrading(false);
      
      // Save the trading state
      localStorage.setItem('memebot_is_trading', 'false');
      
      // Send emergency stop via WebSocket if connected
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'trading_toggle',
          isTrading: false
        }));
      }
      
      alert('🛑 Emergency stop executed! All trading activities have been halted.');
    }
  };

  const startTradingSimulation = () => {
    // Clear any existing interval
    if (tradeInterval) {
      clearInterval(tradeInterval);
    }
    
    // Set a very aggressive trading frequency for admin/god mode
    const frequency = isAdmin ? 500 : 3000; // 500ms for admin, 3s for regular users
    
    // Create a new interval with the updated frequency
    const interval = setInterval(() => {
      if (!isTrading) {
        clearInterval(interval);
        return;
      }

      // Generate trades very frequently in admin/god mode
      if (isAdmin || Math.random() < 0.7) { // 70% chance of trade for admin
        const trade = generateSimulatedTrade();
        if (trade) {
          setTrades(prev => [trade, ...prev.slice(0, 99)]); // Keep last 100 trades
          updateBalance(trade);
          updateStats(trade);
        }
      }
    }, frequency);
    
    setTradeInterval(interval);
    console.log(`🚀 Started trading simulation with ${frequency}ms frequency (Admin mode: ${isAdmin})`);
  };

  const generateSimulatedTrade = (): Trade | null => {
    // Get enabled exchanges
    let enabledExchanges = exchanges.filter(e => e.enabled && e.connected);
    
    if (enabledExchanges.length === 0) {
      console.error('No enabled exchanges found');
      return null;
    }
    
    // Get enabled pairs
    let enabledPairs: any[] = [];
    Object.values(tradingPairs.exchanges || {}).forEach(exchangePairs => {
      enabledPairs = [...enabledPairs, ...exchangePairs.filter((p: any) => p.enabled)];
    });
    
    // If no enabled pairs, return null
    if (enabledPairs.length === 0) {
      console.warn('No enabled pairs found');
      return null;
    }
    
    const pair = enabledPairs[Math.floor(Math.random() * enabledPairs.length)];
    const symbol = pair.symbol;
    
    // Get buy and sell exchanges (only from connected and enabled exchanges)
    const buyExchange = enabledExchanges[Math.floor(Math.random() * enabledExchanges.length)];
    const sellExchange = enabledExchanges[Math.floor(Math.random() * enabledExchanges.length)];
    
    const amount = Math.random() * 1000 + 100;
    const buyPrice = Math.random() * 0.1 + 0.001;
    const sellPrice = buyPrice * (1 + (Math.random() * 0.08 - 0.01));
    
    const buyFeeRate = buyExchange.fees.taker;
    const sellFeeRate = sellExchange.fees.taker;
    const buyFee = buyPrice * amount * buyFeeRate;
    const sellFee = sellPrice * amount * sellFeeRate;
    const totalFees = buyFee + sellFee;
    
    const grossProfit = (sellPrice - buyPrice) * amount;
    const netProfit = grossProfit - totalFees;
    
    const mlConfidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
    const decidingModels = mlModels.filter(m => m.enabled && Math.random() > 0.3).map(m => m.name).slice(0, 3);

    // Update ML model stats - CRITICAL FIX
    decidingModels.forEach(modelName => {
      setMLModels(prevModels => 
        prevModels.map(model => {
          if (model.name === modelName) {
            return {
              ...model,
              predictions: model.predictions + 1,
              profitGenerated: model.profitGenerated + netProfit,
              // Slightly adjust accuracy based on trade result
              accuracy: model.accuracy + (netProfit > 0 ? Math.random() * 0.1 : -Math.random() * 0.05)
            };
          }
          return model;
        })
      );
    });

    return {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      buyExchange: buyExchange.name,
      sellExchange: sellExchange.name,
      amount,
      buyPrice,
      sellPrice,
      netProfit,
      totalFees,
      buyFee,
      sellFee,
      buyFeeRate,
      sellFeeRate,
      mlConfidence,
      decidingModels,
      timestamp: Date.now(),
      positionSize: (amount * buyPrice / (isPaperTrading ? balance : liveBalance)) * 100
    };
  };

  const updateBalance = (trade: Trade) => {
    if (isPaperTrading) {
      setBalance(prev => prev + trade.netProfit);
    } else {
      setLiveBalance(prev => prev + trade.netProfit);
    }
  };

  const handleExchangeUpdate = (updatedExchanges: any[]) => {
    // Convert the exchange format from ExchangeManager to our format
    const convertedExchanges = updatedExchanges.map(ex => ({
      id: ex.id,
      name: ex.name,
      connected: ex.isConnected,
      hasKeys: ex.hasApiKey,
      enabled: ex.enabled,
      fees: ex.fees,
      totalPairs: 50, // Default value
      enabledPairs: ex.enabled ? 8 : 0, // 8 meme coins if enabled
      tradingHours: '24/7',
      apiLimits: {
        requestsPerSecond: ex.rateLimit?.requests / (ex.rateLimit?.interval / 1000) || 10,
        requestsPerDay: ex.rateLimit?.requests * 86400 / ex.rateLimit?.interval || 10000
      }
    }));
    
    setExchanges(convertedExchanges);
  };

  const handleBalanceUpdate = (totalBalance: number, exchangeBalanceList: any[]) => {
    if (!isPaperTrading) {
      setLiveBalance(totalBalance);
      setExchangeBalances(exchangeBalanceList);
    }
  };

  const handleSocialSignal = (signal: SocialSignal) => {
    setSocialSignals(prev => [signal, ...prev.slice(0, 49)]);
  };

  const handleUpgrade = (tierId: string) => {
    setUserTier(tierId);
    setUserSubscription(prev => ({
      ...prev,
      currentTier: tierId,
      status: 'active'
    }));
    alert(`Successfully upgraded to ${AVAILABLE_TIERS.find(t => t.id === tierId)?.name} tier!`);
  };

  const handleResetStats = () => {
    const confirmed = confirm('Are you sure you want to reset all statistics? This cannot be undone.');
    if (confirmed) {
      resetStats();
      setTrades([]);
      setBalance(10000);
      setLiveBalance(5000);
      
      // Reset ML model stats
      setMLModels(prevModels => 
        prevModels.map(model => ({
          ...model,
          predictions: 0,
          profitGenerated: 0
        }))
      );
      
      alert('Statistics reset successfully!');
    }
  };

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
    if (!isAdmin) {
      // Switching to admin mode - unlock enterprise tier
      setUserTier('enterprise');
      setUserSubscription(prev => ({
        ...prev,
        currentTier: 'enterprise',
        status: 'active'
      }));
      
      // Restart trading with faster frequency
      if (isTrading && exchanges.length > 0) {
        if (tradeInterval) {
          clearInterval(tradeInterval);
        }
        startTradingSimulation();
      }
    } else {
      // Switching from admin mode - adjust trading frequency
      if (isTrading && exchanges.length > 0) {
        if (tradeInterval) {
          clearInterval(tradeInterval);
        }
        startTradingSimulation();
      }
    }
  };

  const currentBalance = isPaperTrading ? balance : liveBalance;
  const enabledPairs = Object.values(tradingPairs.exchanges || {}).flat().filter((p: any) => p.enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Logo with Actual MemeMillionaire Bot Image */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/ChatGPT Image Jun 12, 2025, 02_25_19 PM (1).png" 
                  alt="MemeMillionaire Bot" 
                  className="h-10 w-10 rounded-lg"
                  onError={(e) => {
                    // Fallback to the robot logo if the main logo fails to load
                    e.currentTarget.src = "/ChatGPT Image Jun 12, 2025, 02_25_16 PM (1).png";
                  }}
                />
                <div>
                  <h1 className="text-xl font-bold text-white">MemeMillionaire Bot</h1>
                  <div className="text-xs text-blue-400">AI-Powered Meme Coin Trading</div>
                </div>
              </div>
              
              {/* User Tier Display */}
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  userTier === 'basic' ? 'bg-blue-600 text-white' :
                  userTier === 'pro' ? 'bg-green-600 text-white' :
                  userTier === 'expert' ? 'bg-purple-600 text-white' :
                  'bg-yellow-600 text-black'
                }`}>
                  {AVAILABLE_TIERS.find(t => t.id === userTier)?.name} Plan
                </div>
                {isAdmin && (
                  <div className="px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white">
                    ADMIN
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* WebSocket Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Cross-Device Sync Status */}
              {syncStatus.isEnabled && (
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-400">
                    {syncStatus.isSyncing ? 'Syncing...' : `Synced: ${syncStatus.lastSync.toLocaleTimeString()}`}
                  </span>
                </div>
              )}

              {/* Database Status Indicator */}
              <div className="flex items-center space-x-2">
                <Database className={`h-4 w-4 ${dbStatus.isConnected ? 'text-green-400' : 'text-yellow-400'}`} />
                <span className="text-xs text-gray-400">
                  DB: {dbStatus.type === 'postgres' ? 'PostgreSQL' : dbStatus.type === 'sqlite' ? 'SQLite' : 'Unknown'}
                </span>
              </div>

              {/* Admin Toggle Button */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Admin Mode:</span>
                <button
                  onClick={() => toggleAdminMode()}
                  className={`p-1 rounded-full transition-all ${
                    isAdmin ? 'bg-red-600' : 'bg-gray-600'
                  }`}
                >
                  {isAdmin ? (
                    <ToggleRight className="h-6 w-6 text-white" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Current Balance */}
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {isPaperTrading ? 'Paper Balance' : 'Live Balance'}
                </div>
                <div className={`text-lg font-bold ${
                  currentBalance >= (isPaperTrading ? 10000 : 5000) ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${currentBalance.toFixed(2)}
                </div>
              </div>

              {/* Trading Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isTrading ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {isTrading ? 'Trading Active' : 'Trading Stopped'}
              </div>

              {/* Trading Mode */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPaperTrading ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'
              }`}>
                {isPaperTrading ? 'Paper Mode' : 'Live Mode'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'trading', label: 'Trading Center', icon: TrendingUp },
              { id: 'exchanges', label: 'Exchanges', icon: Building2 },
              { id: 'ai_learning', label: 'AI Learning', icon: Brain },
              { id: 'social', label: 'Social Signals', icon: MessageCircle },
              { id: 'subscription', label: 'Subscription', icon: Crown },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'database', label: 'Database Status', icon: Database },
              ...(isAdmin ? [
                { id: 'tier_management', label: 'Tier Management', icon: Crown },
                { id: 'tier_config', label: 'Tier Config', icon: Settings },
                { id: 'exchange_tester', label: 'Exchange Tester', icon: Globe }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Hot Pairs Ticker */}
            <HotPairsTicker trades={trades} enabledPairs={enabledPairs.map((p: any) => p.symbol)} />

            {/* P&L Cards - Enhanced with Win/Loss Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <PLCards 
                dailyPL={persistentStats.dailyPL}
                weeklyPL={persistentStats.weeklyPL}
                monthlyPL={persistentStats.monthlyPL}
                weeklyComparison={persistentStats.weeklyComparison}
                monthlyComparison={persistentStats.monthlyComparison}
                totalTrades={persistentStats.totalTrades}
                winRate={persistentStats.winRate}
                totalFees={persistentStats.totalFees}
              />
            </div>

            {/* Trading Pairs Manager - NEW COMPONENT */}
            <TradingPairsManager key="trading-pairs-manager" />

            {/* Trading Controls */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Trading Controls</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {mlModels.filter(m => m.enabled).length} ML Models • 
                    {exchanges.filter(e => e.connected).length} Exchanges • 
                    {enabledPairs.length} Pairs
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleTrading}
                  disabled={exchanges.length === 0}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    exchanges.length === 0 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isTrading 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isTrading ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  <span>
                    {exchanges.length === 0 
                      ? 'Loading Exchanges...' 
                      : isTrading 
                        ? 'Stop Trading' 
                        : 'Start Trading'
                    }
                  </span>
                </button>
                
                <button
                  onClick={switchTradingMode}
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
                  onClick={emergencyStop}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Emergency Stop</span>
                </button>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Recent Trading Activity</h3>
                <button
                  onClick={handleResetStats}
                  className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Stats</span>
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {trades.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {isTrading ? 'Waiting for trading signals...' : 'Start trading to see activity'}
                  </div>
                ) : (
                  trades.slice(0, 10).map(trade => (
                    <div key={trade.id} className="bg-slate-700 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">{trade.symbol}</span>
                          <span className="text-xs bg-orange-600 px-2 py-1 rounded">MEME</span>
                        </div>
                        <div className={`font-bold ${
                          trade.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {trade.netProfit >= 0 ? '+' : ''}${trade.netProfit.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                        <div>
                          <div>Route: {trade.buyExchange} → {trade.sellExchange}</div>
                          <div>ML Confidence: {(trade.mlConfidence * 100).toFixed(1)}%</div>
                        </div>
                        <div>
                          <div>Fees: ${trade.totalFees.toFixed(2)}</div>
                          <div>Time: {new Date(trade.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Social Signal Integration */}
            <SocialSignalIntegration 
              onSignalReceived={handleSocialSignal}
              enabledPairs={enabledPairs.map((p: any) => p.symbol)}
            />
          </div>
        )}

        {/* Trading Center */}
        {activeTab === 'trading' && (
          <TradingTab
            isTrading={isTrading}
            isPaperTrading={isPaperTrading}
            balance={balance}
            liveBalance={liveBalance}
            trades={trades}
            mlModels={mlModels}
            exchanges={exchanges}
            tradingPairs={tradingPairs}
            onToggleTrading={toggleTrading}
            onSwitchTradingMode={switchTradingMode}
            onEmergencyStop={emergencyStop}
            onBack={() => setActiveTab('dashboard')}
            isAdmin={isAdmin}
            userTier={userTier}
          />
        )}

        {/* Exchange Manager */}
        {activeTab === 'exchanges' && (
          <ExchangeManager 
            onExchangeUpdate={handleExchangeUpdate}
            onBalanceUpdate={handleBalanceUpdate}
            isPaperTrading={isPaperTrading}
          />
        )}

        {/* AI Learning Tracker */}
        {activeTab === 'ai_learning' && (
          <AILearningTracker 
            userTier={userTier}
            onUpgradeRequest={() => setShowUpgradeModal(true)}
          />
        )}

        {/* Social Media */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <IndividualSocialAccounts onAccountsChange={() => {}} />
            <SocialMediaSetup />
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <UserTierDisplay
              userSubscription={userSubscription}
              availableTiers={AVAILABLE_TIERS}
              onUpgrade={handleUpgrade}
              onManageSubscription={() => setShowUpgradeModal(true)}
            />
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <PersistentSettings 
            onSettingsChange={() => {}}
            userTier={userTier}
            isAdmin={isAdmin}
          />
        )}

        {/* Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Trading Reports</h2>
                <button
                  onClick={() => setShowReportGenerator(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Generate Report</span>
                </button>
              </div>
              <p className="text-gray-400">
                Generate comprehensive trading reports with detailed analytics, performance metrics, and export capabilities.
              </p>
            </div>
          </div>
        )}

        {/* Database Status */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <DatabaseStatus />
          </div>
        )}

        {/* Admin: Tier Management */}
        {activeTab === 'tier_management' && isAdmin && (
          <TierManagement />
        )}

        {/* Admin: Tier Configuration */}
        {activeTab === 'tier_config' && isAdmin && (
          <TierConfigurationPanel />
        )}

        {/* Admin: Exchange Data Tester */}
        {activeTab === 'exchange_tester' && isAdmin && (
          <ExchangeDataTester />
        )}
      </main>

      {/* Report Generator Modal */}
      {showReportGenerator && (
        <ReportGenerator
          trades={trades}
          persistentStats={persistentStats}
          mlModels={mlModels}
          exchanges={exchanges}
          userTier={userTier}
          onClose={() => setShowReportGenerator(false)}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upgrade Your Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {AVAILABLE_TIERS.map(tier => (
                <div 
                  key={tier.id} 
                  className={`bg-slate-700 rounded-lg border-2 ${
                    tier.id === userTier ? 'border-blue-500' : 'border-slate-600'
                  } p-6`}
                >
                  <div className="text-center mb-4">
                    <tier.icon className="h-8 w-8 text-white mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                    <p className="text-sm text-gray-400">{tier.description}</p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-white">
                      ${tier.price}
                      <span className="text-lg text-gray-400">/month</span>
                    </div>
                    {tier.yearlyDiscount > 0 && (
                      <div className="text-sm text-green-400">
                        Save {tier.yearlyDiscount}% yearly
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (tier.id !== userTier) {
                        handleUpgrade(tier.id);
                        setShowUpgradeModal(false);
                      }
                    }}
                    disabled={tier.id === userTier}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      tier.id === userTier
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {tier.id === userTier ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}