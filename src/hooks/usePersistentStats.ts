import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';

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
  dailyFees: number;
  weeklyPL: number;
  weeklyFees: number;
  monthlyPL: number;
  monthlyFees: number;
  winRate: number;
  lastResetDate: string;
  weeklyComparison: number;
  monthlyComparison: number;
}

const STORAGE_KEY = 'memebot_persistent_stats';

export function usePersistentStats() {
  const { syncTradingStats } = useDatabase();
  const [stats, setStats] = useState<PersistentStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading persistent stats:', error);
    }
    
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalFees: 0,
      dailyPL: 0,
      dailyFees: 0,
      weeklyPL: 0,
      weeklyFees: 0,
      monthlyPL: 0,
      monthlyFees: 0,
      winRate: 0,
      lastResetDate: new Date().toISOString(),
      weeklyComparison: 0,
      monthlyComparison: 0
    };
  });

  const updateStats = (trade: Trade) => {
    setStats(prevStats => {
      const newStats = { ...prevStats };
      
      // Update basic counters
      newStats.totalTrades += 1;
      newStats.totalProfit += trade.netProfit;
      newStats.totalFees += trade.totalFees;
      
      if (trade.netProfit > 0) {
        newStats.winningTrades += 1;
      } else {
        newStats.losingTrades += 1;
      }
      
      // Calculate win rate
      newStats.winRate = newStats.totalTrades > 0 
        ? (newStats.winningTrades / newStats.totalTrades) * 100 
        : 0;
      
      // Update daily P&L
      newStats.dailyPL += trade.netProfit;
      newStats.dailyFees += trade.totalFees;
      
      // Update weekly P&L
      newStats.weeklyPL += trade.netProfit;
      newStats.weeklyFees += trade.totalFees;
      
      // Update monthly P&L
      newStats.monthlyPL += trade.netProfit;
      newStats.monthlyFees += trade.totalFees;
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
        // Sync with database
        syncTradingStats(newStats);
      } catch (error) {
        console.error('Error saving persistent stats:', error);
      }
      
      return newStats;
    });
  };

  const resetStats = () => {
    console.log('🔄 Resetting all trading statistics...');
    const resetStats: PersistentStats = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalFees: 0,
      dailyPL: 0,
      dailyFees: 0,
      weeklyPL: 0,
      weeklyFees: 0,
      monthlyPL: 0,
      monthlyFees: 0,
      winRate: 0,
      lastResetDate: new Date().toISOString(),
      weeklyComparison: 0,
      monthlyComparison: 0
    };
    
    setStats(resetStats);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetStats));
      // Sync with database
      if (syncTradingStats) {
        syncTradingStats(resetStats);
      }
      
      // Force reload of the page to ensure all components update
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error saving reset stats:', error);
    }
  };

  const getTodaysStats = () => {
    // For now, return daily P&L
    return {
      profit: stats.dailyPL,
      trades: stats.totalTrades,
      winRate: stats.winRate
    };
  };

  const getWeeklyStats = () => {
    return {
      profit: stats.weeklyPL,
      comparison: stats.weeklyComparison
    };
  };

  const getMonthlyStats = () => {
    return {
      profit: stats.monthlyPL,
      comparison: stats.monthlyComparison
    };
  };

  return {
    stats,
    updateStats,
    resetStats,
    getTodaysStats,
    getWeeklyStats,
    getMonthlyStats
  };
}