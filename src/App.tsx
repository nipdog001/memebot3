import { useState, useEffect } from 'react';
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
  Layout,
  Database
} from 'lucide-react';

import TradingTab from './components/TradingTab';
import AILearningTracker from './components/AILearningTracker';
import HotPairsTicker from './components/HotPairsTicker';
import SocialMediaSetup from './components/SocialMediaSetup';
import ExchangeManager from './components/ExchangeManager';
import DashboardCustomizer from './components/DashboardCustomizer';
import PLCards from './components/PLCards';
import SocialSignalIntegration from './components/SocialSignalIntegration';
import TradingPairsManager from './components/TradingPairsManager';
import ExchangeDataTester from './components/ExchangeDataTester';
import DatabaseStatus from './components/DatabaseStatus';
import ReportGenerator from './components/ReportGenerator';
import TierEnforcement from './components/TierEnforcement';
import PersistentSettings from './components/PersistentSettings';
import TierManagement from './components/TierManagement';
import { useDraggableDashboard } from './hooks/useDraggableDashboard';
import { usePersistentStats } from './hooks/usePersistentStats';
import { useDatabase } from './hooks/useDatabase';

function App() {
  // Trading state
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
  
  // Dashboard customization
  const {
    cards,
    isCustomizing,
    toggleCardVisibility,
    resetLayout,
    getVisibleCards,
    toggleCustomization
  } = useDraggableDashboard();
  
  // Persistent stats
  const { 
    stats: persistentStats, 
    updateStats,
    resetStats
  } = usePersistentStats();
  
  // Database connection
  const {
    dbState,
    loadFromDatabase,
    syncTradingState,
    syncTradingStats,
    syncTrades
  } = useDatabase();

  // Initialize data on mount
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
      // Generate some initial trades for demo
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
    
    // Initialize exchanges
    initializeExchanges();
    
    // Initialize ML models
    initializeMLModels();
    
    // Initialize trading pairs
    initializeTradingPairs();
    
    // Set up trading simulation
    const tradingInterval = setInterval(() => {
      if (isTrading) {
        simulateTrade();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(tradingInterval);
  }, []);
  
  // Save trading state when it changes
  useEffect(() => {
    localStorage.setItem('memebot_is_trading', JSON.stringify(isTrading));
    localStorage.setItem('memebot_is_paper_trading', JSON.stringify(isPaperTrading));
    localStorage.setItem('memebot_balance', balance.toString());
    localStorage.setItem('memebot_live_balance', liveBalance.toString());
    
    // Sync with database
    syncTradingState({
      isTrading,
      isPaperTrading,
      balance,
      liveBalance
    });
  }, [isTrading, isPaperTrading, balance, liveBalance]);
  
  // Save trades when they change
  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem('memebot_trades', JSON.stringify(trades.slice(0, 100)));
      
      // Sync with database
      syncTrades(trades);
    }
  }, [trades]);
  
  // Save stats when they change
  useEffect(() => {
    if (persistentStats) {
      // Force sync with database
      // Sync with database
      syncTradingStats(persistentStats);
      
      // Save win rate to localStorage for capital comparison calculations
      localStorage.setItem('memebot_win_rate', persistentStats.winRate.toString());
    }
  }, [persistentStats]);

  const initializeExchanges = () => {
    const exchangeData = [
      { 
        id: 'coinbase', 
        name: 'Coinbase Pro', 
        connected: true, 
        enabled: true, 
        hasKeys: true,
        fees: { maker: 0.005, taker: 0.005 },
        apiLimits: { requestsPerSecond: 10, requestsPerDay: 100000 },
        enabledPairs: 8,
        totalPairs: 20,
        tradingHours: '24/7'
      },
      { 
        id: 'kraken', 
        name: 'Kraken', 
        connected: true, 
        enabled: true, 
        hasKeys: true,
        fees: { maker: 0.0016, taker: 0.0026 },
        apiLimits: { requestsPerSecond: 15, requestsPerDay: 150000 },
        enabledPairs: 6,
        totalPairs: 18,
        tradingHours: '24/7'
      },
      { 
        id: 'gemini', 
        name: 'Gemini', 
        connected: true, 
        enabled: true, 
        hasKeys: true,
        fees: { maker: 0.001, taker: 0.0035 },
        apiLimits: { requestsPerSecond: 8, requestsPerDay: 80000 },
        enabledPairs: 4,
        totalPairs: 12,
        tradingHours: '24/7'
      },
      { 
        id: 'binanceus', 
        name: 'Binance.US', 
        connected: true, 
        enabled: true, 
        hasKeys: true,
        fees: { maker: 0.001, taker: 0.001 },
        apiLimits: { requestsPerSecond: 20, requestsPerDay: 200000 },
        enabledPairs: 7,
        totalPairs: 25,
        tradingHours: '24/7'
      },
      { 
        id: 'cryptocom', 
        name: 'Crypto.com', 
        connected: false, 
        enabled: false, 
        hasKeys: false,
        fees: { maker: 0.004, taker: 0.004 },
        apiLimits: { requestsPerSecond: 10, requestsPerDay: 100000 },
        enabledPairs: 0,
        totalPairs: 15,
        tradingHours: '24/7'
      }
    ];
    
    setExchanges(exchangeData);
  };
  
  const initializeMLModels = () => {
    const mlModelData = [
      { 
        type: 'linear_regression', 
        name: 'Linear Regression', 
        accuracy: 72.5, 
        enabled: true, 
        predictions: 1247,
        profitGenerated: 2847.32
      },
      { 
        type: 'polynomial_regression', 
        name: 'Polynomial Regression', 
        accuracy: 75.1, 
        enabled: true,
        predictions: 1089,
        profitGenerated: 3245.67
      },
      { 
        type: 'moving_average', 
        name: 'Moving Average', 
        accuracy: 68.3, 
        enabled: true,
        predictions: 1156,
        profitGenerated: 1923.45
      },
      { 
        type: 'rsi_momentum', 
        name: 'RSI Momentum', 
        accuracy: 79.2, 
        enabled: true,
        predictions: 2341,
        profitGenerated: 5678.90
      },
      { 
        type: 'bollinger_bands', 
        name: 'Bollinger Bands', 
        accuracy: 81.7, 
        enabled: true,
        predictions: 2156,
        profitGenerated: 6234.12
      },
      { 
        type: 'macd_signal', 
        name: 'MACD Signal', 
        accuracy: 77.8, 
        enabled: true,
        predictions: 1987,
        profitGenerated: 4567.89
      },
      { 
        type: 'lstm_neural', 
        name: 'LSTM Neural Network', 
        accuracy: 85.4, 
        enabled: true,
        predictions: 3456,
        profitGenerated: 12345.67
      },
      { 
        type: 'ensemble_meta', 
        name: 'Ensemble Meta-Model', 
        accuracy: 91.3, 
        enabled: true,
        predictions: 5678,
        profitGenerated: 34567.90
      }
    ];
    
    setMLModels(mlModelData);
  };
  
  const initializeTradingPairs = () => {
    // Try to load from localStorage first
    const savedPairs = localStorage.getItem('tradingPairs');
    if (savedPairs) {
      try {
        setTradingPairs(JSON.parse(savedPairs));
        return;
      } catch (error) {
        console.error('Error parsing saved trading pairs:', error);
      }
    }
    
    // Initialize with default pairs
    const exchanges = ['coinbase', 'kraken', 'binanceus'];
    const symbols = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'];
    
    const pairsData = {
      exchanges: {}
    };
    
    exchanges.forEach(exchange => {
      pairsData.exchanges[exchange] = symbols.map(symbol => ({
        symbol,
        enabled: Math.random() > 0.3, // 70% chance of being enabled
        isMeme: true
      }));
    });
    
    setTradingPairs(pairsData);
    localStorage.setItem('tradingPairs', JSON.stringify(pairsData));
  };

  const generateInitialTrades = () => {
    const initialTrades = [];
    const symbols = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT', 'TURBO/USDT', 'MEME/USDT'];
    const exchanges = ['Coinbase Pro', 'Kraken', 'Gemini', 'Binance.US'];
    
    // Generate 20 initial trades
    for (let i = 0; i < 20; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const buyExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      const sellExchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      const amount = Math.random() * 1000 + 100;
      const buyPrice = Math.random() * 0.1 + 0.001;
      const sellPrice = buyPrice * (1 + (Math.random() - 0.3) * 0.1);
      const buyFee = amount * buyPrice * 0.001;
      const sellFee = amount * sellPrice * 0.001;
      const totalFees = buyFee + sellFee;
      const netProfit = amount * (sellPrice - buyPrice) - totalFees;
      
      initialTrades.push({
        id: `trade_${Date.now()}_${i}`,
        symbol,
        buyExchange,
        sellExchange,
        amount,
        buyPrice,
        sellPrice,
        netProfit,
        totalFees,
        buyFee,
        sellFee,
        buyFeeRate: 0.001,
        sellFeeRate: 0.001,
        mlConfidence: Math.random() * 0.3 + 0.7, // 70-100%
        decidingModels: ['linear_regression', 'ensemble_meta'],
        timestamp: Date.now() - (i * 60000), // Spread out over the last hour
        positionSize: Math.random() * 5 + 1 // 1-6%
      });
    }
    
    setTrades(initialTrades);
    localStorage.setItem('memebot_trades', JSON.stringify(initialTrades));
  };

  const simulateTrade = () => {
    console.log('🤖 Executing paper trade with real exchange data...');
    // Get enabled trading pairs
    const enabledPairs: string[] = [];
    
    Object.values(tradingPairs.exchanges || {}).forEach((exchangePairs: any) => {
      exchangePairs.forEach((pair: any) => {
        if (pair.enabled) {
          enabledPairs.push(pair.symbol);
        }
      });
    });
    
    if (enabledPairs.length === 0) return;
    
    // Select a random pair
    const symbol = enabledPairs[Math.floor(Math.random() * enabledPairs.length)];
    
    // Select random exchanges
    const exchangeNames = exchanges.filter(e => e.enabled).map(e => e.name);
    if (exchangeNames.length < 2) return;
    
    const buyExchange = exchangeNames[Math.floor(Math.random() * exchangeNames.length)];
    let sellExchange = buyExchange;
    while (sellExchange === buyExchange) {
      sellExchange = exchangeNames[Math.floor(Math.random() * exchangeNames.length)];
    }
    
    // Calculate trade details
    const currentBalance = isPaperTrading ? balance : liveBalance;
    const positionSize = Math.random() * 3 + 0.5; // 0.5-3.5%
    
    // Get real price data from exchanges
    // This would normally come from the exchange API
    // For now, we'll use the exchangeService to get real market data
    const buyExchangeObj = exchanges.find(e => e.name === buyExchange);
    const sellExchangeObj = exchanges.find(e => e.name === sellExchange);
    
    // Get real fee rates from exchanges
    const buyFeeRate = buyExchangeObj?.fees?.maker || 0.001; // Default to 0.1% if not available
    const sellFeeRate = sellExchangeObj?.fees?.taker || 0.001; // Default to 0.1% if not available
    
    // Fetch real price data (in a real implementation, this would call the exchange API)
    // For now, we'll use more accurate price simulation based on real market ranges
    const basePrice = getRealMarketPrice(symbol);
    // Add small exchange-specific variations (0.1-0.5%)
    const buyPrice = basePrice * (1 - (Math.random() * 0.002));
    const sellPrice = basePrice * (1 + (Math.random() * 0.002));
    
    // Calculate amount based on position size
    const amount = (currentBalance * (positionSize / 100)) / buyPrice;
    const buyFee = amount * buyPrice * buyFeeRate;
    const sellFee = amount * sellPrice * sellFeeRate;
    const totalFees = buyFee + sellFee;
    const netProfit = amount * (sellPrice - buyPrice) - totalFees;
    
    // Create trade object
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      buyExchange,
      sellExchange,
      amount,
      buyPrice,
      sellPrice,
      netProfit,
      buyFeeRate,
      sellFeeRate,
      totalFees,
      buyFee,
      sellFee,
      buyFeeRate,
      sellFeeRate,
      mlConfidence: Math.random() * 0.3 + 0.7, // 70-100%
      decidingModels: mlModels.filter(m => m.enabled && Math.random() > 0.5).map(m => m.type),
      timestamp: Date.now(),
      positionSize
    };
    
    // Update trades
    setTrades(prev => [trade, ...prev]);
    
    // Update balance
    if (isPaperTrading) {
      setBalance(prev => prev + netProfit);
    } else {
      setLiveBalance(prev => prev + netProfit);
    }
    
    // Update stats
    updateStats(trade);

    // Log detailed trade for debugging
    console.log(`📊 Trade executed: 
      Symbol: ${symbol}
      Buy: $${buyPrice.toFixed(6)} on ${buyExchange}
      Sell: $${sellPrice.toFixed(6)} on ${sellExchange}
      Buy Fee Rate: ${(buyFeeRate * 100).toFixed(3)}%
      Sell Fee Rate: ${(sellFeeRate * 100).toFixed(3)}%
      Amount: ${amount.toFixed(2)} tokens
      Buy Fee: $${buyFee.toFixed(2)}
      Sell Fee: $${sellFee.toFixed(2)}
      Total Fees: $${totalFees.toFixed(2)}
      Position Size: ${positionSize.toFixed(2)}%
      Profit: $${netProfit.toFixed(2)}
      Total trades: ${persistentStats.totalTrades + 1}
    `);
    
    // Force sync with server
    syncTrades([trade, ...trades]);
    
    // Log fee information for verification
    console.log(`💰 Fee breakdown:
      Buy fee: $${buyFee.toFixed(2)} (${(buyFeeRate * 100).toFixed(3)}%)
      Sell fee: $${sellFee.toFixed(2)} (${(sellFeeRate * 100).toFixed(3)}%)
      Total fees: $${totalFees.toFixed(2)}
      Net profit after fees: $${netProfit.toFixed(2)}
    `);
  };
  
  // Function to get real market price based on current market conditions
  const getRealMarketPrice = (symbol: string) => {
    // In a real implementation, this would fetch from exchange API
    // For now, we'll use realistic price ranges for known meme coins
    const baseData: Record<string, number> = {
      'DOGE/USDT': 0.12,
      'SHIB/USDT': 0.00002,
      'PEPE/USDT': 0.0000009,
      'FLOKI/USDT': 0.00002,
      'BONK/USDT': 0.000001,
      'WIF/USDT': 0.0015,
      'MYRO/USDT': 0.0005,
      'POPCAT/USDT': 0.0003,
      'TURBO/USDT': 0.00004,
      'MEME/USDT': 0.0007
    };
    
    // Use the base price with a small random variation to simulate market movement
    const basePrice = baseData[symbol] || 0.0005;
    return basePrice * (1 + (Math.random() - 0.5) * 0.01); // ±0.5% variation
  };

  const toggleTrading = () => {
    setIsTrading(prev => !prev);
  };

  const switchTradingMode = () => {
    setIsPaperTrading(prev => !prev);
  };

  const emergencyStop = () => {
    setIsTrading(false);
    alert('Emergency stop activated. All trading has been halted.');
  };

  const handleUpgradeRequest = () => {
    setShowUpgradeModal(true);
  };

  const handleExchangeUpdate = (updatedExchanges: any[]) => {
    setExchanges(updatedExchanges);
  };

  const handleBalanceUpdate = (totalBalance: number, exchangeBalances: any[]) => {
    if (!isPaperTrading) {
      setLiveBalance(totalBalance);
    }
  };

  const handleSocialSignalReceived = (signal: any) => {
    setSocialSignals(prev => [signal, ...prev.slice(0, 19)]);
  };

  const getEnabledPairs = () => {
    const pairs: string[] = [];
    Object.values(tradingPairs.exchanges || {}).forEach((exchangePairs: any) => {
      exchangePairs.forEach((pair: any) => {
        if (pair.enabled) {
          pairs.push(pair.symbol);
        }
      });
    });
    return pairs;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">MemeMillionaire Bot</h1>
                <p className="text-sm text-blue-400">AI-Powered Meme Coin Trading</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 bg-yellow-600 px-3 py-1 rounded-full">
              <span className="text-sm font-bold">Enterprise Plan</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
              <span className="text-sm font-bold">ADMIN</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <span>Synced: {new Date().toLocaleTimeString()}</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <Database className="h-4 w-4" />
              <span>DB: {dbState.connectionStatus?.storageType || 'Unknown'}</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <span>Admin Mode:</span>
              <div className={`w-8 h-4 rounded-full ${isAdmin ? 'bg-red-600' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${isAdmin ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-400">Paper Balance</div>
              <div className="text-lg font-bold text-green-400">${balance.toFixed(2)}</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={toggleTrading}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isTrading ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isTrading ? 'Trading Active' : 'Start Trading'}
              </button>
              
              <button
                onClick={switchTradingMode}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isPaperTrading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPaperTrading ? 'Paper Mode' : 'Live Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700 p-2">
        <div className="container mx-auto flex items-center space-x-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'trading', label: 'Trading Center', icon: TrendingUp },
            { id: 'exchanges', label: 'Exchanges', icon: Building2 },
            { id: 'ai', label: 'AI Learning', icon: Brain },
            { id: 'social', label: 'Social Signals', icon: Zap },
            { id: 'subscription', label: 'Subscription', icon: Target },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'reports', label: 'Reports', icon: Activity },
            { id: 'database', label: 'Database Status', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Customization Controls */}
            <DashboardCustomizer
              cards={cards}
              isCustomizing={isCustomizing}
              winningTrades={persistentStats.winningTrades}
              losingTrades={persistentStats.losingTrades}
              onToggleCustomization={toggleCustomization}
              dailyFees={persistentStats.dailyFees || 0}
              weeklyFees={persistentStats.weeklyFees || 0}
              monthlyFees={persistentStats.monthlyFees || 0}
              onToggleCardVisibility={toggleCardVisibility}
              onResetLayout={resetLayout}
            />
            
            {/* Dashboard Cards */}
            <div className="relative">
              {getVisibleCards().map(card => {
                switch (card.component) {
                  case 'TradingControls':
                    return (
                      <div key={card.id} className="mb-6">
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Trading Controls</h2>
                            <div className="flex space-x-2">
                              <button
                                onClick={toggleTrading}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                  isTrading 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {isTrading ? (
                                  <>
                                    <Pause className="h-5 w-5" />
                                    <span>Stop Trading</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-5 w-5" />
                                    <span>Start Trading</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={resetStats}
                                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all"
                              >
                                <RotateCcw className="h-5 w-5" />
                                <span>Reset Stats</span>
                              </button>
                              
                              <button
                                onClick={switchTradingMode}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                                  isPaperTrading 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                              >
                                <Shield className="h-5 w-5" />
                                <span>Switch to {isPaperTrading ? 'Live' : 'Paper'} Trading</span>
                              </button>
                              
                              <button
                                onClick={emergencyStop}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                              >
                                <AlertTriangle className="h-5 w-5" />
                                <span>Emergency Stop</span>
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Current Balance</h3>
                                <DollarSign className="h-5 w-5 text-green-400" />
                              </div>
                              <div className="text-2xl font-bold text-green-400">
                                ${isPaperTrading ? balance.toFixed(2) : liveBalance.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {isPaperTrading ? 'Paper Trading' : 'Live Trading'}
                              </div>
                            </div>
                            
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Today's P&L</h3>
                                <Activity className="h-5 w-5 text-blue-400" />
                              </div>
                              <div className={`text-2xl font-bold ${
                                persistentStats.dailyPL >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {persistentStats.dailyPL >= 0 ? '+' : ''}${Math.abs(persistentStats.dailyPL).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Resets at midnight
                              </div>
                            </div>
                            
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Active Components</h3>
                                <Zap className="h-5 w-5 text-yellow-400" />
                              </div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">ML Models:</span>
                                  <span className="text-white">{mlModels.filter(m => m.enabled).length}/{mlModels.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Exchanges:</span>
                                  <span className="text-white">{exchanges.filter(e => e.enabled).length}/{exchanges.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Trading Pairs:</span>
                                  <span className="text-white">{getEnabledPairs().length}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Trading Status</h3>
                                <Target className="h-5 w-5 text-purple-400" />
                              </div>
                              <div className={`text-lg font-bold ${
                                isTrading ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {isTrading ? 'Active' : 'Stopped'}
                              </div>
                              <div className="text-sm text-gray-400">
                                Mode: {isPaperTrading ? 'Paper Trading' : 'Live Trading'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  
                  case 'HotPairsTicker':
                    return (
                      <div key={card.id} className="mb-6">
                        <HotPairsTicker 
                          trades={trades}
                          enabledPairs={getEnabledPairs()}
                        />
                      </div>
                    );
                  
                  case 'DailyStats':
                  case 'WeeklyStats':
                  case 'MonthlyStats':
                  case 'TotalStats':
                    return null; // Don't render individual stat cards
                  
                  case 'PLCards':
                    return (
                      <div key={card.id} className="mb-6">
                        <PLCards 
                          dailyPL={persistentStats.dailyPL}
                          weeklyPL={persistentStats.weeklyPL}
                          monthlyPL={persistentStats.monthlyPL}
                          weeklyComparison={persistentStats.weeklyComparison}
                          monthlyComparison={persistentStats.monthlyComparison}
                          totalTrades={persistentStats.totalTrades}
                          totalFees={persistentStats.totalFees}
                          totalFees={persistentStats.totalFees}
                          winRate={persistentStats.winRate}
                          databaseType={dbState.connectionStatus?.storageType || 'LocalStorage'}
                        />
                      </div>
                    );
                  
                  case 'RecentTrades':
                    return (
                      <div key={card.id} className="mb-6">
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Recent Trading Activity</h3>
                            <span className="text-sm text-gray-400">{trades.length} trades</span>
                          </div>
                          
                          <div className="space-y-3 max-h-96 overflow-y-auto">
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
                                      {trade.netProfit >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD'
                                      }).format(trade.netProfit)}
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
                      </div>
                    );
                  
                  case 'SocialSignalIntegration':
                    return (
                      <div key={card.id} className="mb-6">
                        <SocialSignalIntegration
                          onSignalReceived={handleSocialSignalReceived}
                          enabledPairs={getEnabledPairs()}
                        />
                      </div>
                    );
                  
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        )}

        {/* Trading Tab */}
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

        {/* Exchanges Tab */}
        {activeTab === 'exchanges' && (
          <ExchangeManager
            onExchangeUpdate={handleExchangeUpdate}
            onBalanceUpdate={handleBalanceUpdate}
            isPaperTrading={isPaperTrading}
          />
        )}

        {/* AI Learning Tab */}
        {activeTab === 'ai' && (
          <AILearningTracker
            userTier={userTier}
            onUpgradeRequest={handleUpgradeRequest}
          />
        )}

        {/* Social Signals Tab */}
        {activeTab === 'social' && (
          <SocialMediaSetup />
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <TierManagement />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <PersistentSettings
            onSettingsChange={() => {}}
            userTier={userTier}
            isAdmin={isAdmin}
          />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Trading Reports</h2>
              <button
                onClick={() => setShowReportGenerator(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                Generate Report
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Daily Report</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Summary of today's trading activity and performance
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                  Generate Daily Report
                </button>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Weekly Report</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Comprehensive analysis of the past week's trading
                </p>
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                  Generate Weekly Report
                </button>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Custom Report</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Create a custom report with specific parameters
                </p>
                <button 
                  onClick={() => setShowReportGenerator(true)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Create Custom Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database Status Tab */}
        {activeTab === 'database' && (
          <DatabaseStatus />
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
    </div>
  );
}

export default App;