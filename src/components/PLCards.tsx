import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  BarChart3, 
  Activity, 
  DollarSign, 
  Database
} from 'lucide-react';

interface PLCardsProps {
  dailyPL: number;
  weeklyPL: number;
  monthlyPL: number;
  weeklyComparison: number;
  monthlyComparison: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalFees: number;
  dailyFees: number;
  weeklyFees: number;
  monthlyFees: number;
  winRate: number;
  databaseType: string;
}

export default function PLCards({ 
  dailyPL, 
  weeklyPL, 
  monthlyPL, 
  weeklyComparison, 
  monthlyComparison,
  totalTrades,
  winningTrades,
  losingTrades,
  totalFees,
  dailyFees,
  weeklyFees,
  monthlyFees,
  winRate,
  databaseType
}: PLCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Daily P&L */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-w-[220px] flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-white">Today's P&L</h3>
          </div>
          <div className={`flex items-center space-x-1 ${
            dailyPL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {dailyPL >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
        
        <div className={`text-3xl font-bold mb-2 ${
          (dailyPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(dailyPL || 0) >= 0 ? '+' : ''}{formatCurrency(dailyPL || 0)}
        </div>
        
        <div className="text-sm text-gray-400">
          Resets at midnight
        </div>
        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>Win/Loss: <span className="text-green-400">{winningTrades}</span>/<span className="text-red-400">{losingTrades}</span></span>
          <span>Fees: <span className="text-red-400">{formatCurrency(dailyFees || 0)}</span></span>
        </div>
      </div>

      {/* Weekly P&L */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-w-[220px] flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-white">Weekly P&L</h3>
          </div>
          <div className={`flex items-center space-x-1 ${
            weeklyPL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {weeklyPL >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
        
        <div className={`text-3xl font-bold mb-2 ${
          (weeklyPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(weeklyPL || 0) >= 0 ? '+' : ''}{formatCurrency(weeklyPL || 0)}
        </div>
        
        <div className="flex items-center space-x-1 text-sm">
          <span className="text-gray-400">vs previous:</span>
          <span className={(weeklyComparison || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
            {(weeklyComparison || 0) >= 0 ? '+' : ''}{formatPercentage(weeklyComparison || 0)}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>Win/Loss: <span className="text-green-400">{winningTrades}</span>/<span className="text-red-400">{losingTrades}</span></span>
          <span>Fees: <span className="text-red-400">{formatCurrency(weeklyFees || 0)}</span></span>
        </div>
      </div>

      {/* Monthly P&L */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-w-[220px] flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-white">Monthly P&L</h3>
          </div>
          <div className={`flex items-center space-x-1 ${
            monthlyPL >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {monthlyPL >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        </div>
        
        <div className={`text-3xl font-bold mb-2 ${
          (monthlyPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(monthlyPL || 0) >= 0 ? '+' : ''}{formatCurrency(monthlyPL || 0)}
        </div>
        
        <div className="flex items-center space-x-1 text-sm">
          <span className="text-gray-400">vs previous:</span>
          <span className={(monthlyComparison || 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
            {(monthlyComparison || 0) >= 0 ? '+' : ''}{formatPercentage(monthlyComparison || 0)}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex justify-between">
          <span>Win/Loss: <span className="text-green-400">{winningTrades}</span>/<span className="text-red-400">{losingTrades}</span></span>
          <span>Fees: <span className="text-red-400">{formatCurrency(monthlyFees || 0)}</span></span>
        </div>
      </div>

      {/* Total Stats */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 min-w-[220px] flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            <h3 className="font-semibold text-white">Total Statistics</h3>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Trades:</span>
            <span className="text-white font-medium">{(totalTrades || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Win Rate:</span>
            <span className="text-green-400 font-medium">{winningTrades || 0}/{totalTrades || 0} ({formatPercentage(winRate || 0)})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Fees:</span>
            <span className="text-red-400 font-medium">{formatCurrency(totalFees || 0)}</span>
          </div>
          <div className="flex justify-between">
            {databaseType && (
              <div className="flex justify-between">
                <span className="text-gray-400">Database:</span>
                <span className="text-blue-400 font-medium">
                  {databaseType || "Unknown"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}