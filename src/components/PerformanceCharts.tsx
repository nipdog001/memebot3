import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Activity, 
  Brain,
  DollarSign,
  Target,
  Award,
  Zap
} from 'lucide-react';

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
  mlConfidence: number;
  decidingModels: string[];
  timestamp: number;
  positionSize: number;
}

interface MLModelPerformance {
  name: string;
  totalTrades: number;
  winningTrades: number;
  totalProfit: number;
  averageProfit: number;
  winRate: number;
  averageConfidence: number;
  profitPerTrade: number;
  totalFees: number;
  netProfit: number;
}

interface PerformanceChartsProps {
  trades: Trade[];
}

export default function PerformanceCharts({ trades }: PerformanceChartsProps) {
  const [mlPerformance, setMlPerformance] = useState<MLModelPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [symbolPerformance, setSymbolPerformance] = useState<any[]>([]);
  const [exchangePerformance, setExchangePerformance] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState('ml-models');

  useEffect(() => {
    calculateMLPerformance();
    calculateTimeSeriesData();
    calculateSymbolPerformance();
    calculateExchangePerformance();
  }, [trades]);

  const calculateMLPerformance = () => {
    const modelStats: { [key: string]: MLModelPerformance } = {};

    // Initialize all known models
    const allModels = [
      'Linear Regression', 'Polynomial Regression', 'Moving Average',
      'RSI Momentum', 'Bollinger Bands', 'MACD Signal',
      'LSTM Neural Network', 'Random Forest', 'Gradient Boosting',
      'Transformer Model', 'Ensemble Meta-Model', 'Reinforcement Learning'
    ];

    allModels.forEach(modelName => {
      modelStats[modelName] = {
        name: modelName,
        totalTrades: 0,
        winningTrades: 0,
        totalProfit: 0,
        averageProfit: 0,
        winRate: 0,
        averageConfidence: 0,
        profitPerTrade: 0,
        totalFees: 0,
        netProfit: 0
      };
    });

    // Process trades to calculate model performance
    trades.forEach(trade => {
      if (trade.decidingModels && Array.isArray(trade.decidingModels)) {
        trade.decidingModels.forEach(modelName => {
          if (modelStats[modelName]) {
            modelStats[modelName].totalTrades++;
            modelStats[modelName].totalProfit += trade.netProfit;
            modelStats[modelName].totalFees += trade.totalFees;
            modelStats[modelName].netProfit += (trade.netProfit - trade.totalFees);
            
            if (trade.netProfit > 0) {
              modelStats[modelName].winningTrades++;
            }
          }
        });
      }
    });

    // Calculate derived metrics
    Object.values(modelStats).forEach(model => {
      if (model.totalTrades > 0) {
        model.winRate = (model.winningTrades / model.totalTrades) * 100;
        model.averageProfit = model.totalProfit / model.totalTrades;
        model.profitPerTrade = model.netProfit / model.totalTrades;
      }
    });

    // Sort by total profit and filter out models with no trades
    const performanceArray = Object.values(modelStats)
      .filter(model => model.totalTrades > 0)
      .sort((a, b) => b.totalProfit - a.totalProfit);

    setMlPerformance(performanceArray);
  };

  const calculateTimeSeriesData = () => {
    // Group trades by day for time series
    const dailyData: { [key: string]: { profit: number, trades: number, fees: number } } = {};

    trades.forEach(trade => {
      const date = new Date(trade.timestamp).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = { profit: 0, trades: 0, fees: 0 };
      }
      dailyData[date].profit += trade.netProfit;
      dailyData[date].trades++;
      dailyData[date].fees += trade.totalFees;
    });

    const timeSeriesArray = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        ...data,
        cumulativeProfit: 0 // Will be calculated below
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate cumulative profit
    let cumulative = 0;
    timeSeriesArray.forEach(day => {
      cumulative += day.profit;
      day.cumulativeProfit = cumulative;
    });

    setTimeSeriesData(timeSeriesArray.slice(-30)); // Last 30 days
  };

  const calculateSymbolPerformance = () => {
    const symbolStats: { [key: string]: any } = {};

    trades.forEach(trade => {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = {
          symbol: trade.symbol,
          totalTrades: 0,
          winningTrades: 0,
          totalProfit: 0,
          totalFees: 0,
          winRate: 0
        };
      }

      symbolStats[trade.symbol].totalTrades++;
      symbolStats[trade.symbol].totalProfit += trade.netProfit;
      symbolStats[trade.symbol].totalFees += trade.totalFees;
      
      if (trade.netProfit > 0) {
        symbolStats[trade.symbol].winningTrades++;
      }
    });

    // Calculate win rates and sort
    const symbolArray = Object.values(symbolStats).map((symbol: any) => ({
      ...symbol,
      winRate: (symbol.winningTrades / symbol.totalTrades) * 100
    })).sort((a, b) => b.totalProfit - a.totalProfit);

    setSymbolPerformance(symbolArray);
  };

  const calculateExchangePerformance = () => {
    const exchangeStats: { [key: string]: any } = {};

    trades.forEach(trade => {
      // Count for buy exchange
      if (!exchangeStats[trade.buyExchange]) {
        exchangeStats[trade.buyExchange] = {
          exchange: trade.buyExchange,
          totalTrades: 0,
          totalProfit: 0,
          totalFees: 0
        };
      }
      exchangeStats[trade.buyExchange].totalTrades++;
      exchangeStats[trade.buyExchange].totalProfit += trade.netProfit / 2; // Split between buy and sell
      exchangeStats[trade.buyExchange].totalFees += trade.buyFee;

      // Count for sell exchange
      if (!exchangeStats[trade.sellExchange]) {
        exchangeStats[trade.sellExchange] = {
          exchange: trade.sellExchange,
          totalTrades: 0,
          totalProfit: 0,
          totalFees: 0
        };
      }
      exchangeStats[trade.sellExchange].totalTrades++;
      exchangeStats[trade.sellExchange].totalProfit += trade.netProfit / 2; // Split between buy and sell
      exchangeStats[trade.sellExchange].totalFees += trade.sellFee;
    });

    const exchangeArray = Object.values(exchangeStats)
      .sort((a: any, b: any) => b.totalProfit - a.totalProfit);

    setExchangePerformance(exchangeArray);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getModelCategoryColor = (modelName: string) => {
    if (['Linear Regression', 'Polynomial Regression', 'Moving Average'].includes(modelName)) {
      return 'bg-blue-500';
    } else if (['RSI Momentum', 'Bollinger Bands', 'MACD Signal'].includes(modelName)) {
      return 'bg-green-500';
    } else if (['LSTM Neural Network', 'Random Forest', 'Gradient Boosting'].includes(modelName)) {
      return 'bg-purple-500';
    } else {
      return 'bg-yellow-500';
    }
  };

  const renderMLModelChart = () => {
    const maxProfit = Math.max(...mlPerformance.map(m => m.totalProfit));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">🧠 ML Model Performance Analysis</h3>
        
        {/* Top Performing Models */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {mlPerformance.slice(0, 3).map((model, index) => (
            <div key={model.name} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Award className={`h-5 w-5 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-orange-400'}`} />
                  <span className="font-medium text-white text-sm">{model.name}</span>
                </div>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Profit:</span>
                  <span className="text-green-400 font-bold">{formatCurrency(model.totalProfit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-white">{model.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Trades:</span>
                  <span className="text-white">{model.totalTrades}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Model Performance Chart */}
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-4">Model Profit Comparison</h4>
          <div className="space-y-3">
            {mlPerformance.map(model => (
              <div key={model.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium text-sm">{model.name}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">{model.totalTrades} trades</span>
                    <span className={`text-sm font-bold ${model.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(model.totalProfit)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-600 rounded-full h-3 relative">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${getModelCategoryColor(model.name)}`}
                      style={{ width: `${Math.max(5, (Math.abs(model.totalProfit) / maxProfit) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 w-12">{model.winRate.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTimeSeriesChart = () => {
    const maxProfit = Math.max(...timeSeriesData.map(d => Math.abs(d.cumulativeProfit)));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">📈 Performance Over Time</h3>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-4">Cumulative Profit (Last 30 Days)</h4>
          <div className="space-y-2">
            {timeSeriesData.map((day, index) => (
              <div key={day.date} className="flex items-center space-x-3">
                <div className="w-20 text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-slate-600 rounded-full h-2 relative">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      day.cumulativeProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(2, (Math.abs(day.cumulativeProfit) / maxProfit) * 100)}%` }}
                  ></div>
                </div>
                <div className="w-20 text-xs text-right">
                  <span className={day.cumulativeProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {formatCurrency(day.cumulativeProfit)}
                  </span>
                </div>
                <div className="w-12 text-xs text-gray-400 text-right">
                  {day.trades}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSymbolChart = () => {
    const maxProfit = Math.max(...symbolPerformance.map(s => Math.abs(s.totalProfit)));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">🪙 Symbol Performance</h3>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-4">Profit by Trading Pair</h4>
          <div className="space-y-3">
            {symbolPerformance.slice(0, 10).map(symbol => (
              <div key={symbol.symbol} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{symbol.symbol}</span>
                    <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">MEME</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">{symbol.totalTrades} trades</span>
                    <span className="text-xs text-blue-400">{symbol.winRate.toFixed(1)}% win</span>
                    <span className={`text-sm font-bold ${symbol.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(symbol.totalProfit)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        symbol.totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(5, (Math.abs(symbol.totalProfit) / maxProfit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderExchangeChart = () => {
    const maxProfit = Math.max(...exchangePerformance.map(e => Math.abs(e.totalProfit)));

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">🏢 Exchange Performance</h3>
        
        <div className="bg-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-4">Profit by Exchange</h4>
          <div className="space-y-3">
            {exchangePerformance.map(exchange => (
              <div key={exchange.exchange} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium capitalize">{exchange.exchange}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-400">{exchange.totalTrades} trades</span>
                    <span className="text-xs text-red-400">-{formatCurrency(exchange.totalFees)} fees</span>
                    <span className={`text-sm font-bold ${exchange.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(exchange.totalProfit)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        exchange.totalProfit >= 0 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(5, (Math.abs(exchange.totalProfit) / maxProfit) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">📊 Performance Analytics</h2>
        </div>
        <div className="text-sm text-gray-400">
          {trades.length} trades analyzed
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="flex space-x-1 bg-slate-700 rounded-lg p-1 mb-6">
        {[
          { id: 'ml-models', label: 'ML Models', icon: Brain },
          { id: 'time-series', label: 'Time Series', icon: TrendingUp },
          { id: 'symbols', label: 'Symbols', icon: Target },
          { id: 'exchanges', label: 'Exchanges', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeChart === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="min-h-[400px]">
        {activeChart === 'ml-models' && renderMLModelChart()}
        {activeChart === 'time-series' && renderTimeSeriesChart()}
        {activeChart === 'symbols' && renderSymbolChart()}
        {activeChart === 'exchanges' && renderExchangeChart()}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{mlPerformance.length}</div>
          <div className="text-xs text-gray-400">Active Models</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{symbolPerformance.length}</div>
          <div className="text-xs text-gray-400">Trading Pairs</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{exchangePerformance.length}</div>
          <div className="text-xs text-gray-400">Exchanges</div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{timeSeriesData.length}</div>
          <div className="text-xs text-gray-400">Days Tracked</div>
        </div>
      </div>
    </div>
  );
}