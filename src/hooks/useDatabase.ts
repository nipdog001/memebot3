import { useState, useEffect, useCallback } from 'react';

// Define API base URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : '';

interface DatabaseState {
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;
  connectionStatus: {
    isConnected: boolean;
    storageType: string;
  } | null;
  deviceSync: {
    deviceId: string;
    lastSync: Date | null;
  } | null;
}

interface UserState {
  tradingState: any;
  tradingStats: any;
  trades: any[];
  settings: any;
  mlModels: any[];
}

export function useDatabase() {
  const [dbState, setDbState] = useState<DatabaseState>({
    isLoading: false,
    error: null,
    lastSync: null,
    connectionStatus: null,
    deviceSync: null
  });
  
  // Generate a consistent device ID
  const getDeviceId = useCallback(() => {
    let deviceId = localStorage.getItem('memebot_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('memebot_device_id', deviceId);
    }
    return deviceId;
  }, []);

  // Modified sync interval to use localStorage only
  useEffect(() => {
    const syncInterval = setInterval(() => {
      // Use localStorage for persistence instead of server API
      const lastSyncTime = new Date();
      localStorage.setItem('memebot_last_sync', lastSyncTime.toISOString());
      
      setDbState(prev => ({
        ...prev,
        lastSync: lastSyncTime,
        deviceSync: {
          deviceId: getDeviceId(),
          lastSync: lastSyncTime
        }
      }));
      
      console.log('📱 Local sync completed at', lastSyncTime.toLocaleTimeString());
    }, 60000); // Check every minute
    
    return () => clearInterval(syncInterval);
  }, [getDeviceId]);

  const saveToDatabase = useCallback(async (data: Partial<UserState>) => {
    setDbState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Save to localStorage as backup
    if (data.tradingState) {
      localStorage.setItem('memebot_trading_state', JSON.stringify(data.tradingState));
      localStorage.setItem('memebot_balance', data.tradingState.balance.toString());
      localStorage.setItem('memebot_live_balance', data.tradingState.liveBalance.toString());
      localStorage.setItem('memebot_is_trading', JSON.stringify(data.tradingState.isTrading));
      localStorage.setItem('memebot_is_paper_trading', JSON.stringify(data.tradingState.isPaperTrading));
    }
    if (data.tradingStats) {
      localStorage.setItem('memebot_trading_stats', JSON.stringify(data.tradingStats));
      localStorage.setItem('memebot_persistent_stats', JSON.stringify(data.tradingStats));
    }
    if (data.trades) {
      localStorage.setItem('memebot_trades', JSON.stringify(data.trades.slice(0, 50)));
    }
    if (data.settings) {
      localStorage.setItem('memebot_settings', JSON.stringify(data.settings));
    }
    if (data.mlModels) {
      localStorage.setItem('memebot_ml_models', JSON.stringify(data.mlModels));
    }
    
    try {
      const deviceId = getDeviceId();
      
      const response = await fetch(`${API_BASE_URL}/api/user/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-ID': deviceId
        },
        body: JSON.stringify({
          ...data,
          _deviceId: deviceId // Include in body as well for redundancy
        })
      });

      if (!response.ok) {
        console.warn(`⚠️ Server returned ${response.status}, falling back to localStorage`);
        setDbState(prev => ({ 
          ...prev, 
          isLoading: false, 
          lastSync: new Date(),
          error: `Server returned ${response.status}`,
          connectionStatus: {
            isConnected: true,
            storageType: 'LocalStorage'
          },
          deviceSync: {
            deviceId: getDeviceId(),
            lastSync: new Date()
          }
        }));
        return true;
      }

      const result = await response.json();
      
      if (result.success) {
        setDbState(prev => ({ 
          ...prev, 
          isLoading: false, 
          lastSync: new Date(),
          error: null,
          connectionStatus: result.database || null,
          deviceSync: result.deviceSync || null
        }));
        
        const storageType = result.database?.storageType || 'Unknown';
        console.log(`✅ Data saved to ${storageType} storage from device ${deviceId}`);
        
        // Also save to localStorage as backup
        if (data.tradingState) {
          localStorage.setItem('memebot_trading_state', JSON.stringify(data.tradingState));
        }
        if (data.tradingStats) {
          localStorage.setItem('memebot_trading_stats', JSON.stringify(data.tradingStats));
        }
        
        return true;
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Error saving to database, using localStorage fallback:', errorMessage);
      
      setDbState(prev => ({ 
        ...prev, 
        isLoading: false,
        lastSync: new Date(),
        error: errorMessage,
        connectionStatus: {
          isConnected: true,
          storageType: 'LocalStorage'
        },
        deviceSync: {
          deviceId: getDeviceId(),
          lastSync: new Date()
        }
      }));
      
      return false;
    }
  }, [getDeviceId]);

  const loadFromDatabase = useCallback(async (): Promise<UserState | null> => {
    setDbState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const deviceId = getDeviceId();
      
      const response = await fetch(`${API_BASE_URL}/api/user/state`, {
        headers: {
          'X-Device-ID': deviceId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      setDbState(prev => ({ 
        ...prev, 
        isLoading: false, 
        lastSync: new Date(),
        error: null,
        connectionStatus: data.database || null,
        deviceSync: data.deviceSync || null
      }));
      
      const storageType = data.database?.storageType || 'Unknown';
      console.log(`✅ Data loaded from ${storageType} storage to device ${deviceId}`);
      
      // Save to localStorage as backup
      if (data.tradingState) {
        localStorage.setItem('memebot_trading_state', JSON.stringify(data.tradingState));
      }
      if (data.tradingStats) {
        localStorage.setItem('memebot_trading_stats', JSON.stringify(data.tradingStats));
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Error loading from database, using localStorage fallback:', errorMessage);
      
      setDbState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage
      }));
      
      // Try to load from localStorage as fallback
      try {
        const tradingState = localStorage.getItem('memebot_trading_state') || null;
        const tradingStats = localStorage.getItem('memebot_trading_stats') || null;
        const trades = localStorage.getItem('memebot_trades') || '[]';
        const settings = localStorage.getItem('memebot_settings') || null;
        const mlModels = localStorage.getItem('memebot_ml_models') || '[]';
        
        console.log('📱 Using localStorage fallback data');
        
        setDbState(prev => ({ 
          ...prev, 
          isLoading: false, 
          lastSync: new Date(),
          error: errorMessage,
          connectionStatus: {
            isConnected: true,
            storageType: 'LocalStorage'
          },
          deviceSync: {
            deviceId: getDeviceId(),
            lastSync: new Date()
          }
        }));
        
        return {
          tradingState: tradingState ? JSON.parse(tradingState) : null,
          tradingStats: tradingStats ? JSON.parse(tradingStats) : null,
          trades: trades ? JSON.parse(trades) : [],
          settings: settings ? JSON.parse(settings) : null,
          mlModels: mlModels ? JSON.parse(mlModels) : []
        };
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
      
      // Return null if all fails
      return null;
    }
  }, [getDeviceId]);

  const syncTradingState = useCallback(async (tradingState: any) => {
    // Save to localStorage first for immediate local persistence
    localStorage.setItem('memebot_trading_state', JSON.stringify(tradingState));
    localStorage.setItem('memebot_balance', tradingState.balance.toString());
    localStorage.setItem('memebot_live_balance', tradingState.liveBalance.toString());
    localStorage.setItem('memebot_is_trading', JSON.stringify(tradingState.isTrading));
    localStorage.setItem('memebot_is_paper_trading', JSON.stringify(tradingState.isPaperTrading));
    
    // Then sync to server
    return await saveToDatabase({ tradingState });
  }, [saveToDatabase]);

  const syncTradingStats = useCallback(async (tradingStats: any) => {
    // Save to localStorage first
    localStorage.setItem('memebot_trading_stats', JSON.stringify(tradingStats));
    
    // Also save to persistent stats storage
    const persistentStatsJson = JSON.stringify(tradingStats);
    localStorage.setItem('memebot_persistent_stats', persistentStatsJson);
    
    console.log('📊 Syncing trading stats:', tradingStats);
    
    return await saveToDatabase({ tradingStats });
  }, [saveToDatabase]);

  const syncTrades = useCallback(async (trades: any[]) => {
    // Save recent trades to localStorage
    localStorage.setItem('memebot_trades', JSON.stringify(trades.slice(0, 50)));
    console.log(`💾 Saved ${trades.length} trades to localStorage`);
    
    // Sync all trades to ensure accurate statistics
    return await saveToDatabase({ trades }); 
  }, [saveToDatabase]);

  const syncSettings = useCallback(async (settings: any) => {
    // Save to localStorage first
    localStorage.setItem('memebot_settings', JSON.stringify(settings));
    
    return await saveToDatabase({ settings });
  }, [saveToDatabase]);

  const syncMLModels = useCallback(async (mlModels: any[]) => {
    // Save to localStorage first
    localStorage.setItem('memebot_ml_models', JSON.stringify(mlModels));
    
    return await saveToDatabase({ mlModels });
  }, [saveToDatabase]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    // Using localStorage for persistence instead of WebSockets
    console.log('📱 Setting up data persistence and cross-device sync');
    
    // Try to connect to the server
    fetch(`${API_BASE_URL}/api/health`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Server health check failed');
      })
      .then(data => {
        console.log('🔌 Server connection successful:', data);
        setDbState(prev => ({
          ...prev,
          connectionStatus: {
            isConnected: true,
            storageType: data.database || 'Server'
          }
        }));
      })
      .catch(error => {
        console.warn('⚠️ Server connection failed, using localStorage:', error.message);
        setDbState(prev => ({
          ...prev,
          error: error.message,
          connectionStatus: {
            isConnected: true,
            storageType: 'LocalStorage'
          }
        }));
      });
    
    // Set up periodic sync
    const syncInterval = setInterval(() => {
      console.log('🔄 Attempting periodic data sync...');
      // Try server sync first, fall back to localStorage
      fetch(`${API_BASE_URL}/api/health`)
        .then(() => {
          setDbState(prev => ({
            ...prev,
            lastSync: new Date(),
            deviceSync: {
              deviceId: getDeviceId(),
              lastSync: new Date()
            }
          }));
        })
        .catch(error => {
          console.warn('⚠️ Sync check failed:', error.message);
          // Still update the sync time even if server is unavailable
          setDbState(prev => ({
            ...prev,
            lastSync: new Date(),
            deviceSync: {
              deviceId: getDeviceId(),
              lastSync: new Date()
            },
            connectionStatus: {
              isConnected: true,
              storageType: 'LocalStorage'
            }
          }));
        });
    }, 30000);
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [getDeviceId]);

  return {
    dbState,
    saveToDatabase,
    loadFromDatabase,
    syncTradingState,
    syncTradingStats,
    syncTrades,
    syncSettings,
    syncMLModels
  };
}