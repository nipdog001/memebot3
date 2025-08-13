// src/hooks/useWebSocketStats.js
// WebSocket hook for real-time stats synchronization with backend
// JavaScript version - no TypeScript

import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocketStats = () => {
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
  const [lastPrediction, setLastPrediction] = useState(null);
  const [lastTrade, setLastTrade] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Connect to WebSocket
  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }
    
    // Railway-ready WebSocket URL
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
        
        // Request initial stats
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
        
        // Attempt to reconnect
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
  
  // Handle incoming messages
  const handleMessage = (message) => {
    switch (message.type) {
      case 'initial_stats':
      case 'stats_update':
        setStats(message.data);
        updateLocalStorage(message.data);
        break;
        
      case 'ml_prediction':
        setLastPrediction(message.data);
        // Update ML model stats
        setStats(prev => ({
          ...prev,
          predictions24h: prev.predictions24h + 1
        }));
        break;
        
      case 'trade_executed':
        setLastTrade(message.data);
        // Update trade stats
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
        
      case 'exchange_update':
        console.log('📊 Exchange status update:', message.data);
        setStats(prev => ({
          ...prev,
          exchangeStatus: message.data
        }));
        break;
    }
  };
  
  // Update localStorage for persistence
  const updateLocalStorage = (statsData) => {
    try {
      localStorage.setItem('memebot_ws_stats', JSON.stringify({
        totalTrades: statsData.totalTrades,
        winningTrades: statsData.winningTrades,
        losingTrades: statsData.losingTrades,
        totalProfit: statsData.totalProfit,
        totalLoss: statsData.totalLoss,
        winRate: statsData.winRate,
        currentBalance: statsData.currentBalance,
        liveBalance: statsData.liveBalance,
        paperBalance: statsData.paperBalance,
        lastUpdate: statsData.lastUpdate
      }));
      
      // Update balance in localStorage for compatibility with existing code
      localStorage.setItem('memebot_balance', statsData.paperBalance.toString());
      localStorage.setItem('memebot_live_balance', statsData.liveBalance.toString());
      
      // Save ML model stats
      if (statsData.mlModelStats && statsData.mlModelStats.length > 0) {
        localStorage.setItem('memebot_ml_models_ws', JSON.stringify(statsData.mlModelStats));
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };
  
  // Send message to server
  const sendMessage = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log('📤 Sent to server:', message.type);
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
      // Try to reconnect
      connect();
    }
  }, [connect]);
  
  // Start trading
  const startTrading = useCallback((params) => {
    sendMessage({
      type: 'start_trading',
      params: params
    });
  }, [sendMessage]);
  
  // Stop trading
  const stopTrading = useCallback(() => {
    sendMessage({
      type: 'stop_trading'
    });
  }, [sendMessage]);
  
  // Toggle ML model
  const toggleModel = useCallback((modelType, enabled) => {
    sendMessage({
      type: 'toggle_model',
      modelType: modelType,
      enabled: enabled
    });
  }, [sendMessage]);
  
  // Request fresh stats
  const refreshStats = useCallback(() => {
    sendMessage({
      type: 'request_stats'
    });
  }, [sendMessage]);
  
  // Execute manual trade (optional feature)
  const executeTrade = useCallback((trade) => {
    sendMessage({
      type: 'execute_trade',
      trade: trade
    });
  }, [sendMessage]);
  
  // Update settings
  const updateSettings = useCallback((settings) => {
    sendMessage({
      type: 'update_settings',
      settings: settings
    });
  }, [sendMessage]);
  
  // Load initial stats from localStorage
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem('memebot_ws_stats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setStats(prev => ({ ...prev, ...parsed }));
      }
      
      const savedModels = localStorage.getItem('memebot_ml_models_ws');
      if (savedModels) {
        const models = JSON.parse(savedModels);
        setStats(prev => ({ ...prev, mlModelStats: models }));
      }
    } catch (error) {
      console.error('Error loading saved stats:', error);
    }
  }, []);
  
  // Connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);
  
  // Periodic stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        refreshStats();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, refreshStats]);
  
  // Heartbeat to keep connection alive
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 45000); // Send ping every 45 seconds
    
    return () => clearInterval(heartbeat);
  }, []);
  
  return {
    stats,
    isConnected,
    lastPrediction,
    lastTrade,
    startTrading,
    stopTrading,
    toggleModel,
    refreshStats,
    executeTrade,
    updateSettings,
    sendMessage
  };
};