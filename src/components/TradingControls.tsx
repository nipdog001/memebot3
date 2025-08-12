import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  Shield, 
  Brain, 
  RefreshCw,
  RotateCcw,
  Check,
  X,
  Info
} from 'lucide-react';
import mlTradingEngine from '../services/mlTradingEngine';

interface TradingControlsProps {
  isTrading: boolean;
  isPaperTrading: boolean;
  balance: number;
  liveBalance: number;
  onToggleTrading: (isTrading: boolean) => void;
  onToggleTradingMode: (isPaperTrading: boolean) => void;
  onBalanceChange: (balance: number) => void;
  onResetStats: () => void;
  userTier: string;
}

export default function TradingControls({
  isTrading,
  isPaperTrading,
  balance,
  liveBalance,
  onToggleTrading,
  onToggleTradingMode,
  onBalanceChange,
  onResetStats,
  userTier
}: TradingControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [mlConfidence, setMlConfidence] = useState(75);
  const [positionSize, setPositionSize] = useState(2.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('memebot_persistent_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.mlConfidenceThreshold) {
          setMlConfidence(settings.mlConfidenceThreshold);
        }
        if (settings.positionSize) {
          setPositionSize(settings.positionSize);
        }
        console.log('📊 Loaded trading control settings:', {
          mlConfidence: settings.mlConfidenceThreshold,
          positionSize: settings.positionSize
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Update balance from localStorage when component mounts or stats change
  useEffect(() => {
    const updateBalanceFromStorage = () => {
      try {
        const savedBalance = localStorage.getItem('memebot_balance');
        if (savedBalance) {
          const parsedBalance = parseFloat(savedBalance);
          if (!isNaN(parsedBalance)) {
            onBalanceChange(parsedBalance);
            console.log('💰 Updated balance from localStorage:', parsedBalance);
          }
        }
      } catch (error) {
        console.error('Error updating balance from storage:', error);
      }
    };
    
    // Update balance on mount
    updateBalanceFromStorage();
    
    // Listen for balance updates from stats calculations
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.balance) {
        onBalanceChange(event.detail.balance);
      }
    };
    
    // Listen for stats updates
    const handleStatsUpdate = () => {
      updateBalanceFromStorage();
    };
    
    window.addEventListener('statsUpdated', handleStatsUpdate);
    window.addEventListener('tradeAdded', handleStatsUpdate);
    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('statsUpdated', handleStatsUpdate);
      window.removeEventListener('tradeAdded', handleStatsUpdate);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [balance, onBalanceChange]);

  const handleToggleTrading = () => {
    if (!isTrading) {
      // Starting trading
      console.log('🚀 Starting trading - clearing reset flags');
      
      // Clear reset flags when starting trading
      localStorage.removeItem('memebot_reset_timestamp');
      localStorage.removeItem('memebot_force_reset');
      localStorage.removeItem('memebot_disable_sync');
      
      setIsLoading(true);
      
      // Start ML trading engine
      if (mlTradingEngine) {
        mlTradingEngine.setThreshold(mlConfidence);
        mlTradingEngine.startAutoTrading(5000); // 5 seconds interval
        console.log('🤖 ML Trading Engine started with fresh state');
      }
      
      setTimeout(() => {
        onToggleTrading(true);
        setIsLoading(false);
      }, 1000);
    } else {
      // Stopping trading
      setIsLoading(true);
      
      // Stop ML trading engine
      if (mlTradingEngine) {
        mlTradingEngine.stopAutoTrading();
      }
      
      setTimeout(() => {
        onToggleTrading(false);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleToggleTradingMode = () => {
    if (isPaperTrading) {
      // Switching to live trading
      if (userTier === 'basic') {
        alert('Live trading requires Pro tier or higher. Please upgrade your subscription.');
        return;
      }
      
      setShowConfirmation('live');
    } else {
      // Switching to paper trading
      setShowConfirmation('paper');
    }
  };

  const confirmTradingModeChange = (confirm: boolean) => {
    if (confirm) {
      onToggleTradingMode(!isPaperTrading);
    }
    setShowConfirmation(null);
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBalance = parseFloat(e.target.value);
    if (!isNaN(newBalance) && newBalance > 0) {
      onBalanceChange(newBalance);
      // Also update localStorage immediately
      localStorage.setItem('memebot_balance', newBalance.toString());
    }
  };

  const handleResetStats = () => {
    if (confirm('Are you sure you want to reset all trading statistics? This action cannot be undone.')) {
      console.log('🚨 FORCE RESET: Clearing ALL data immediately');
      
      // FORCE clear all localStorage immediately
      try {
        localStorage.clear(); // Nuclear option - clear everything
        console.log('🗑️ localStorage completely cleared');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      
      // Reset to clean state
      localStorage.setItem('memebot_balance', '10000');
      localStorage.setItem('memebot_trades', '[]');
      localStorage.setItem('memebot_persistent_stats', JSON.stringify({
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalFees: 0,
        dailyPL: 0,
        weeklyPL: 0,
        monthlyPL: 0,
        winRate: 0,
        currentBalance: 10000,
        startingBalance: 10000
      }));
      
      onResetStats();
      
      // Force immediate page reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const saveSettings = () => {
    try {
      // Get existing settings and merge with new values
      const existingSettings = localStorage.getItem('memebot_persistent_settings');
      let allSettings = {};
      
      if (existingSettings) {
        allSettings = JSON.parse(existingSettings);
      }
      
      // Merge with new settings
      const updatedSettings = {
        ...allSettings,
        mlConfidenceThreshold: mlConfidence,
        positionSize: positionSize
      };
      
      // Save merged settings
      localStorage.setItem('memebot_persistent_settings', JSON.stringify(updatedSettings));
      
      console.log('💾 Trading control settings saved:', updatedSettings);
      
      // Update ML trading engine
      if (mlTradingEngine) {
        mlTradingEngine.setThreshold(mlConfidence);
      }
      
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Trading Controls</h3>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setShowResetConfirmation(true)}
            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trading Status */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-400" />
              <h4 className="font-semibold text-white">Trading Status</h4>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isTrading ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {isTrading ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
          
          <button
            onClick={handleToggleTrading}
            disabled={isLoading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              isTrading 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : isTrading ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            <span>{isLoading ? 'Processing...' : isTrading ? 'Stop Trading' : 'Start Trading'}</span>
          </button>
        </div>

        {/* Trading Mode */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {isPaperTrading ? (
                <Shield className="h-4 w-4 text-blue-400" />
              ) : (
                <DollarSign className="h-4 w-4 text-red-400" />
              )}
              <h4 className="font-semibold text-white">Trading Mode</h4>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isPaperTrading ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isPaperTrading ? 'PAPER TRADING' : 'LIVE TRADING'}
            </div>
          </div>
          
          <button
            onClick={handleToggleTradingMode}
            disabled={userTier === 'basic' && !isPaperTrading}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              isPaperTrading 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } ${userTier === 'basic' && !isPaperTrading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPaperTrading ? (
              <>
                <DollarSign className="h-5 w-5" />
                <span>Switch to Live Trading</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Switch to Paper Trading</span>
              </>
            )}
          </button>
          
          {userTier === 'basic' && isPaperTrading && (
            <div className="mt-2 text-xs text-orange-400">
              Live trading requires Pro tier or higher
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <h4 className="font-semibold text-white">
                {isPaperTrading ? 'Paper Balance' : 'Live Balance'}
              </h4>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-green-400 mb-2">
            {formatCurrency(isPaperTrading ? balance : liveBalance)}
          </div>
          
          <div className="text-xs text-gray-400 mb-2">
            Running total from all trades
          </div>
          
          {isPaperTrading && (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={balance}
                onChange={handleBalanceChange}
                min="100"
                step="100"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
              />
              <button
                onClick={() => {
                  onBalanceChange(10000);
                  localStorage.setItem('memebot_balance', '10000');
                  // Force update the display
                  window.dispatchEvent(new CustomEvent('balanceUpdated', { 
                    detail: { balance: 10000 } 
                  }));
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all whitespace-nowrap"
              >
                Reset to $10K
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white">Trading Settings</h4>
            <button
              onClick={saveSettings}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                ML Confidence Threshold (%)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={mlConfidence}
                  onChange={(e) => setMlConfidence(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-medium w-16">
                  {mlConfidence}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Only execute trades when AI confidence is above this threshold
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Position Size (% of balance)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={positionSize}
                  onChange={(e) => setPositionSize(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-medium w-16">
                  {positionSize.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Percentage of balance to use for each trade
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">
                {showConfirmation === 'live' ? 'Switch to Live Trading?' : 'Switch to Paper Trading?'}
              </h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              {showConfirmation === 'live' ? (
                <>
                  <span className="text-red-400 font-bold">WARNING:</span> You are about to switch to live trading with real money. 
                  Are you sure you want to continue?
                </>
              ) : (
                'You are about to switch to paper trading (simulation). Your live trading positions will be preserved.'
              )}
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => confirmTradingModeChange(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmTradingModeChange(true)}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-all ${
                  showConfirmation === 'live' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-bold text-white">Reset All Statistics?</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              <span className="text-red-400 font-bold">WARNING:</span> This will reset all trading statistics, including profit/loss, win rate, and trade history. This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleResetStats();
                  setShowResetConfirmation(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
              >
                Reset All Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}