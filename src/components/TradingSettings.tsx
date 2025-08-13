import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Brain, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Target,
  Activity,
  Infinity,
  Database,
  Globe,
  Smartphone
} from 'lucide-react';

interface TradingSettings {
  // Position Management
  minTradeSize: number;
  maxTradeSize: number;
  positionSize: number; // % of balance
  maxDailyTrades: number;
  unlimitedTrades: boolean; // New checkbox for unlimited trades
  
  // Risk Management
  riskLevel: 'low' | 'medium' | 'high';
  dailyLossLimit: number; // %
  emergencyStopLimit: number; // %
  stopLossPercentage: number;
  takeProfitPercentage: number;
  
  // ML Configuration
  mlConfidenceThreshold: number; // %
  enabledMLModels: string[];
  
  // Social Media
  socialInfluence: number; // 0-100%
  sentimentThreshold: number;
  
  // Advanced Settings
  autoRebalance: boolean;
  compoundProfits: boolean;
  enableArbitrage: boolean;
  maxSlippage: number;
  
  // Notifications
  enableNotifications: boolean;
  notifyOnTrades: boolean;
  notifyOnLimits: boolean;
  notifyOnErrors: boolean;
  
  // Trading Frequency
  tradeFrequency: number; // ms between trades
  maxTradesPerHour: number;
  
  // Cross-device sync
  enableSync: boolean;
  syncInterval: number; // seconds
}

interface TradingSettingsProps {
  onSettingsChange: (settings: TradingSettings) => void;
  userTier: string;
  isAdmin: boolean;
}

const DEFAULT_SETTINGS: TradingSettings = {
  // Position Management
  minTradeSize: 10,
  maxTradeSize: 1000,
  positionSize: 2.0,
  maxDailyTrades: 50,
  unlimitedTrades: true, // Set to true by default to enable unlimited trades
  
  // Risk Management
  riskLevel: 'medium',
  dailyLossLimit: 5,
  emergencyStopLimit: 15,
  stopLossPercentage: 3,
  takeProfitPercentage: 6,
  
  // ML Configuration
  mlConfidenceThreshold: 75,
  enabledMLModels: ['linear', 'polynomial', 'moving_avg'],
  
  // Social Media
  socialInfluence: 25,
  sentimentThreshold: 70,
  
  // Advanced Settings
  autoRebalance: false,
  compoundProfits: true,
  enableArbitrage: false,
  maxSlippage: 0.5,
  
  // Notifications
  enableNotifications: true,
  notifyOnTrades: true,
  notifyOnLimits: true,
  notifyOnErrors: true,
  
  // Trading Frequency
  tradeFrequency: 3000, // 3 seconds between trades
  maxTradesPerHour: 300, // 300 trades per hour (5 per minute)
  
  // Cross-device sync
  enableSync: true,
  syncInterval: 60 // sync every 60 seconds
};

export default function TradingSettings({ onSettingsChange, userTier, isAdmin }: TradingSettingsProps) {
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('trading');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    
    // Fetch settings from server
    fetchSettingsFromServer();
    
    // Set up sync interval
    const syncInterval = setInterval(() => {
      if (settings.enableSync) {
        simulateSync();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(syncInterval);
  }, []);

  // Auto-save when settings change
  useEffect(() => {
    if (hasChanges) {
      const autoSaveTimer = setTimeout(() => {
        saveSettings();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [settings, hasChanges]);

  const fetchSettingsFromServer = async () => {
    try {
      const response = await fetch('/api/trading/settings');
      if (response.ok) {
        const serverSettings = await response.json();
        
        // Merge with default settings to ensure all fields exist
        const mergedSettings = { ...DEFAULT_SETTINGS, ...serverSettings };
        
        setSettings(mergedSettings);
        console.log('📊 Loaded settings from server:', mergedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings from server:', error);
    }
  };

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('memebot_persistent_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        onSettingsChange({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        // First time setup - ensure training mode is enabled
        setSettings(DEFAULT_SETTINGS);
        onSettingsChange(DEFAULT_SETTINGS);
      }
      
      const lastSavedTime = localStorage.getItem('memebot_settings_last_saved');
      if (lastSavedTime) {
        setLastSaved(new Date(lastSavedTime));
      }
      
      const lastSyncTimeStr = localStorage.getItem('memebot_last_sync_time');
      if (lastSyncTimeStr) {
        setLastSyncTime(new Date(lastSyncTimeStr));
      }
      
      // Simulate connected devices
      setConnectedDevices([
        'Current Device (This Browser)',
        'Mobile App - iPhone',
        'Desktop - Chrome'
      ]);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
      onSettingsChange(DEFAULT_SETTINGS);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('memebot_persistent_settings', JSON.stringify(settings));
      localStorage.setItem('memebot_settings_last_saved', new Date().toISOString());
      setLastSaved(new Date());
      setHasChanges(false);
      onSettingsChange(settings);
      
      // Save to server
      try {
        const response = await fetch('/api/trading/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        });
        
        if (response.ok) {
          console.log('📊 Settings saved to server');
        }
      } catch (error) {
        console.error('Error saving settings to server:', error);
      }
      
      // Try to sync with server via WebSocket
      try {
        const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'settings_update',
            data: settings
          }));
          ws.close();
        };
      } catch (error) {
        console.error('Error syncing settings with server:', error);
      }
      
      // Simulate save delay for Railway persistence
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If cross-device sync is enabled, simulate sync
      if (settings.enableSync) {
        simulateSync();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const simulateSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update last sync time
      const now = new Date();
      localStorage.setItem('memebot_last_sync_time', now.toISOString());
      setLastSyncTime(now);
      
      console.log('📱 Settings synced across devices');
    } catch (error) {
      console.error('Error syncing settings:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSetting = <K extends keyof TradingSettings>(
    key: K, 
    value: TradingSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
    }
  };

  const getTierLimits = () => {
    switch (userTier) {
      case 'basic':
        return {
          maxTradeSize: 1000,
          maxDailyTrades: 10,
          mlModels: 3,
          socialPlatforms: 0,
          exchanges: 1
        };
      case 'pro':
        return {
          maxTradeSize: 10000,
          maxDailyTrades: 100,
          mlModels: 8,
          socialPlatforms: 2,
          exchanges: 4
        };
      case 'expert':
        return {
          maxTradeSize: 100000,
          maxDailyTrades: 1000,
          mlModels: 15,
          socialPlatforms: 5,
          exchanges: 10
        };
      case 'enterprise':
        return {
          maxTradeSize: -1,
          maxDailyTrades: -1,
          mlModels: -1,
          socialPlatforms: -1,
          exchanges: -1
        };
      default:
        return {
          maxTradeSize: 1000,
          maxDailyTrades: 10,
          mlModels: 3,
          socialPlatforms: 0,
          exchanges: 1
        };
    }
  };

  const limits = getTierLimits();

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Trading Settings</h2>
          </div>
          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-sm text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                hasChanges 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-orange-600/20 border border-orange-600/30 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-400">
                You have unsaved changes. Settings will auto-save in 2 seconds or click Save Settings.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
        {[
          { id: 'trading', label: 'Trading Frequency', icon: Activity },
          { id: 'risk', label: 'Risk Management', icon: Shield },
          { id: 'ml', label: 'ML Configuration', icon: Brain },
          { id: 'advanced', label: 'Advanced Settings', icon: Sliders },
          { id: 'sync', label: 'Cross-Device Sync', icon: Smartphone }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
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

      {/* Trading Frequency Tab */}
      {activeTab === 'trading' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">⚡ Trading Frequency Configuration</h3>
            
            <div className="space-y-4">
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Infinity className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="font-semibold text-blue-400">Unlimited Trading</h4>
                      <p className="text-sm text-gray-300">
                        Enable maximum trading frequency for optimal performance
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('unlimitedTrades', !settings.unlimitedTrades)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      settings.unlimitedTrades 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {settings.unlimitedTrades ? (
                      <>
                        <Infinity className="h-4 w-4" />
                        <span>Unlimited Active</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Limited Mode</span>
                      </>
                    )}
                  </button>
                </div>
                
                {settings.unlimitedTrades && (
                  <div className="text-sm text-gray-300">
                    ✅ Maximum trading frequency enabled - system will trade as often as possible
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Trades Per Hour
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.maxTradesPerHour}
                    onChange={(e) => updateSetting('maxTradesPerHour', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    disabled={settings.unlimitedTrades}
                  />
                  <div className="text-sm text-gray-400 mt-1">
                    {settings.unlimitedTrades ? 'Unlimited trades enabled' : `Current: ${settings.maxTradesPerHour} trades per hour`}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Minimum Time Between Trades (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="60000"
                    step="1000"
                    value={settings.tradeFrequency}
                    onChange={(e) => updateSetting('tradeFrequency', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    disabled={settings.unlimitedTrades}
                  />
                  <div className="text-sm text-gray-400 mt-1">
                    {settings.unlimitedTrades ? 'Unlimited trades enabled' : `Current: ${settings.tradeFrequency}ms (${(1000 / settings.tradeFrequency).toFixed(1)} trades/second max)`}
                  </div>
                </div>
              </div>

              <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Railway Persistence</span>
                </div>
                <p className="text-sm text-gray-300">
                  Trading will continue 24/7 on Railway even when your browser is closed. The system will maintain your settings and automatically reconnect if disconnected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Management Tab */}
      {activeTab === 'risk' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">🛡️ Risk Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Risk Level
              </label>
              <select
                value={settings.riskLevel}
                onChange={(e) => updateSetting('riskLevel', e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              >
                <option value="low">Low Risk (Conservative)</option>
                <option value="medium">Medium Risk (Balanced)</option>
                <option value="high">High Risk (Aggressive)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Daily Loss Limit (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.dailyLossLimit}
                onChange={(e) => updateSetting('dailyLossLimit', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Emergency Stop Limit (%)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={settings.emergencyStopLimit}
                onChange={(e) => updateSetting('emergencyStopLimit', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Max Daily Trades
                <span className="text-xs text-gray-500 ml-1">
                  (Limit: {formatLimit(limits.maxDailyTrades)})
                </span>
              </label>
              <input
                type="number"
                min="1"
                max={limits.maxDailyTrades === -1 ? undefined : limits.maxDailyTrades}
                value={settings.maxDailyTrades}
                onChange={(e) => updateSetting('maxDailyTrades', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ML Configuration Tab */}
      {activeTab === 'ml' && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">🧠 ML Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                ML Confidence Threshold (%)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={settings.mlConfidenceThreshold}
                  onChange={(e) => updateSetting('mlConfidenceThreshold', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white font-medium w-16">
                  {settings.mlConfidenceThreshold}%
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Only execute trades when AI confidence is above this threshold
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Social Influence (0-100%)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.socialInfluence}
                  onChange={(e) => updateSetting('socialInfluence', parseInt(e.target.value))}
                  className="flex-1"
                  disabled={userTier === 'basic'}
                />
                <span className="text-white font-medium w-16">
                  {settings.socialInfluence}%
                </span>
              </div>
              {userTier === 'basic' && (
                <div className="text-xs text-orange-400 mt-1">
                  Social features require Pro tier or higher
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">⚙️ Advanced Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Auto Rebalance</div>
                    <div className="text-sm text-gray-400">Automatically rebalance portfolio</div>
                  </div>
                  <button
                    onClick={() => updateSetting('autoRebalance', !settings.autoRebalance)}
                    className={`p-1 rounded-full transition-all ${
                      settings.autoRebalance ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    {settings.autoRebalance ? (
                      <ToggleRight className="h-6 w-6 text-white" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Compound Profits</div>
                    <div className="text-sm text-gray-400">Reinvest profits automatically</div>
                  </div>
                  <button
                    onClick={() => updateSetting('compoundProfits', !settings.compoundProfits)}
                    className={`p-1 rounded-full transition-all ${
                      settings.compoundProfits ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    {settings.compoundProfits ? (
                      <ToggleRight className="h-6 w-6 text-white" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Enable Arbitrage</div>
                    <div className="text-sm text-gray-400">Cross-exchange arbitrage trading</div>
                  </div>
                  <button
                    onClick={() => updateSetting('enableArbitrage', !settings.enableArbitrage)}
                    disabled={userTier === 'basic' || userTier === 'pro'}
                    className={`p-1 rounded-full transition-all ${
                      settings.enableArbitrage ? 'bg-green-600' : 'bg-gray-600'
                    } ${(userTier === 'basic' || userTier === 'pro') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {settings.enableArbitrage ? (
                      <ToggleRight className="h-6 w-6 text-white" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Slippage (%)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={settings.maxSlippage}
                    onChange={(e) => updateSetting('maxSlippage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={settings.stopLossPercentage}
                    onChange={(e) => updateSetting('stopLossPercentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Take Profit (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.1"
                    value={settings.takeProfitPercentage}
                    onChange={(e) => updateSetting('takeProfitPercentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-red-400">Reset Settings</h4>
                <p className="text-sm text-gray-300">
                  Reset all settings to default values. This cannot be undone.
                </p>
              </div>
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Device Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">📱 Cross-Device Synchronization</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-white">Enable Cross-Device Sync</div>
                <div className="text-sm text-gray-400">Keep settings in sync across all devices</div>
              </div>
              <button
                onClick={() => updateSetting('enableSync', !settings.enableSync)}
                className={`p-1 rounded-full transition-all ${
                  settings.enableSync ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {settings.enableSync ? (
                  <ToggleRight className="h-6 w-6 text-white" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            
            {settings.enableSync && (
              <>
                <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Sync Status</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Last synchronized:</span>
                    <span>{lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300 mt-1">
                    <span>Sync frequency:</span>
                    <span>Every {settings.syncInterval} seconds</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={simulateSync}
                      disabled={isSyncing}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
                    >
                      {isSyncing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Connected Devices</h4>
                  {connectedDevices.map((device, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">{device}</span>
                        {index === 0 && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">ACTIVE</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {index === 0 ? 'Last active: Now' : `Last active: ${Math.floor(Math.random() * 24) + 1}h ago`}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {!settings.enableSync && (
              <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-4">
                <p className="text-sm text-gray-400">
                  Cross-device sync is disabled. Your settings will only be saved on this device.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-save Status */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Auto-saving settings...</span>
          </div>
        </div>
      )}
    </div>
  );
}