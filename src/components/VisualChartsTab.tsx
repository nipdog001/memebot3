import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Brain,
  Building2,
  Target,
  RefreshCw,
  Calendar,
  Filter,
  Eye,
  Download
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
  timestamp: number;
  decidingModels?: string[];
}

interface VisualChartsTabProps {
  trades: Trade[];
  persistentStats: any;
  mlModels: any[];
}

interface ChartData {
  dailyPerformance: Array<{
    date: string;
    profit: number;
    trades: number;
    fees: number;
    cumulativeProfit: number;
  }>;
  symbolDistribution: Array<{
    symbol: string;
    profit: number;
    trades: number;
    percentage: number;
    winRate: number;
  }>;
  exchangePerformance: Array<{
    exchange: string;
    profit: number;
    trades: number;
    fees: number;
  }>;
  mlModelPerformance: Array<{
    name: string;
    accuracy: number;
    predictions: number;
    profitGenerated: number;
    category: string;
  }>;
}

export default function VisualChartsTab({ trades, persistentStats, mlModels }: VisualChartsTabProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activeChart, setActiveChart] = useState('daily');
  const [dateRange, setDateRange] = useState('30'); // days
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    generateChartData();
  }, [trades, dateRange]);

  const generateChartData = () => {
    setIsLoading(true);
    
    try {
      // Filter trades by date range
      const daysBack = parseInt(dateRange);
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      const filteredTrades = trades.filter(trade => new Date(trade.timestamp) >= cutoffDate);

      // Generate daily performance data
      const dailyData: { [key: string]: { profit: number, trades: number, fees: number } } = {};
      
      filteredTrades.forEach(trade => {
        const date = new Date(trade.timestamp).toDateString();
        if (!dailyData[date]) {
          dailyData[date] = { profit: 0, trades: 0, fees: 0 };
        }
        dailyData[date].profit += trade.netProfit;
        dailyData[date].trades++;
        dailyData[date].fees += trade.totalFees;
      });

      const dailyPerformance = Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString(),
          profit: data.profit,
          trades: data.trades,
          fees: data.fees,
          cumulativeProfit: 0 // Will be calculated below
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate cumulative profit
      let cumulative = 0;
      dailyPerformance.forEach(day => {
        cumulative += day.profit;
        day.cumulativeProfit = cumulative;
      });

      // Generate symbol distribution data
      const symbolData: { [key: string]: { profit: number, trades: number, wins: number } } = {};
      
      filteredTrades.forEach(trade => {
        if (!symbolData[trade.symbol]) {
          symbolData[trade.symbol] = { profit: 0, trades: 0, wins: 0 };
        }
        symbolData[trade.symbol].profit += trade.netProfit;
        symbolData[trade.symbol].trades++;
        if (trade.netProfit > 0) {
          symbolData[trade.symbol].wins++;
        }
      });

      const totalProfit = Math.abs(Object.values(symbolData).reduce((sum, data) => sum + Math.abs(data.profit), 0));
      
      const symbolDistribution = Object.entries(symbolData)
        .map(([symbol, data]) => ({
          symbol,
          profit: data.profit,
          trades: data.trades,
          percentage: totalProfit > 0 ? (Math.abs(data.profit) / totalProfit) * 100 : 0,
          winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
        }))
        .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit))
        .slice(0, 10);

      // Generate exchange performance data
      const exchangeData: { [key: string]: { profit: number, trades: number, fees: number } } = {};
      
      filteredTrades.forEach(trade => {
        // Count for buy exchange
        if (!exchangeData[trade.buyExchange]) {
          exchangeData[trade.buyExchange] = { profit: 0, trades: 0, fees: 0 };
        }
        exchangeData[trade.buyExchange].profit += trade.netProfit / 2;
        exchangeData[trade.buyExchange].trades++;
        exchangeData[trade.buyExchange].fees += trade.buyFee || (trade.totalFees / 2);

        // Count for sell exchange
        if (!exchangeData[trade.sellExchange]) {
          exchangeData[trade.sellExchange] = { profit: 0, trades: 0, fees: 0 };
        }
        exchangeData[trade.sellExchange].profit += trade.netProfit / 2;
        exchangeData[trade.sellExchange].trades++;
        exchangeData[trade.sellExchange].fees += trade.sellFee || (trade.totalFees / 2);
      });

      const exchangePerformance = Object.entries(exchangeData)
        .map(([exchange, data]) => ({
          exchange,
          profit: data.profit,
          trades: data.trades,
          fees: data.fees
        }))
        .sort((a, b) => b.profit - a.profit);

      // Generate ML model performance data
      const mlModelPerformance = mlModels.map(model => ({
        name: model.name,
        accuracy: model.accuracy,
        predictions: model.predictions,
        profitGenerated: model.profitGenerated,
        category: getModelCategory(model.name)
      })).sort((a, b) => b.profitGenerated - a.profitGenerated);

      setChartData({
        dailyPerformance,
        symbolDistribution,
        exchangePerformance,
        mlModelPerformance
      });
    } catch (error) {
      console.error('Error generating chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModelCategory = (modelName: string) => {
    if (['Linear Regression', 'Polynomial Regression', 'Moving Average'].includes(modelName)) {
      return 'basic';
    } else if (['RSI Momentum', 'Bollinger Bands', 'MACD Signal'].includes(modelName)) {
      return 'intermediate';
    } else if (['LSTM Neural Network', 'Random Forest', 'Gradient Boosting'].includes(modelName)) {
      return 'advanced';
    } else {
      return 'expert';
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const renderDailyPerformanceChart = () => {
    if (!chartData?.dailyPerformance.length) {
      return (
        <div className="text-center py-8 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No daily performance data available</p>
        </div>
      );
    }

    const maxProfit = Math.max(...chartData.dailyPerformance.map(d => Math.abs(d.profit)));
    const maxCumulative = Math.max(...chartData.dailyPerformance.map(d => Math.abs(d.cumulativeProfit)));

    return (
      <div className="space-y-6">
        {/* Daily Profit/Loss Bar Chart */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📊 Daily Profit/Loss</h3>
          <div className="space-y-3">
            {chartData.dailyPerformance.slice(-14).map((day, index) => {
              const barWidth = maxProfit > 0 ? (Math.abs(day.profit) / maxProfit) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-xs text-gray-400 text-right">
                    {day.date}
                  </div>
                  <div className="flex-1 bg-slate-600 rounded-full h-6 relative">
                    <div 
                      className={`h-6 rounded-full transition-all duration-300 ${
                        day.profit >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(5, barWidth)}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {formatCurrency(day.profit)}
                    </div>
                  </div>
                  <div className="w-16 text-xs text-gray-400 text-center">
                    {day.trades} trades
                  </div>
                  <div className="w-16 text-xs text-red-400 text-right">
                    {formatCurrency(day.fees)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative Performance Line Chart */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📈 Cumulative Performance</h3>
          <div className="space-y-2">
            {chartData.dailyPerformance.slice(-14).map((day, index) => {
              const barWidth = maxCumulative > 0 ? (Math.abs(day.cumulativeProfit) / maxCumulative) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-20 text-xs text-gray-400 text-right">
                    {day.date}
                  </div>
                  <div className="flex-1 bg-slate-600 rounded-full h-4 relative">
                    <div 
                      className={`h-4 rounded-full transition-all duration-300 ${
                        day.cumulativeProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.max(5, barWidth)}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                      {formatCurrency(day.cumulativeProfit)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSymbolDistributionChart = () => {
    if (!chartData?.symbolDistribution.length) {
      return (
        <div className="text-center py-8 text-gray-400">
          <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No symbol distribution data available</p>
        </div>
      );
    }

    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500'
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Pie Chart */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🥧 Profit Distribution</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-48 h-48">
              <div className="w-full h-full rounded-full bg-gradient-conic from-green-500 via-blue-500 via-purple-500 via-yellow-500 to-red-500 opacity-80"></div>
              <div className="absolute inset-8 bg-slate-700 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {chartData.symbolDistribution.length}
                  </div>
                  <div className="text-sm text-gray-400">Symbols</div>
                  <div className="text-lg font-bold text-green-400 mt-1">
                    {formatCurrency(chartData.symbolDistribution.reduce((sum, s) => sum + s.profit, 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Symbol Legend and Details */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">📊 Symbol Performance</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {chartData.symbolDistribution.map((symbol, index) => (
              <div key={symbol.symbol} className="flex items-center space-x-3 p-3 bg-slate-600 rounded-lg">
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{symbol.symbol}</span>
                    <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">MEME</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {symbol.trades} trades • {formatPercentage(symbol.winRate)} win rate
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${symbol.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(symbol.profit)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatPercentage(symbol.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderExchangePerformanceChart = () => {
    if (!chartData?.exchangePerformance.length) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No exchange performance data available</p>
        </div>
      );
    }

    const maxProfit = Math.max(...chartData.exchangePerformance.map(e => Math.abs(e.profit)));

    return (
      <div className="bg-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">🏢 Exchange Performance</h3>
        <div className="space-y-4">
          {chartData.exchangePerformance.map((exchange, index) => {
            const barWidth = maxProfit > 0 ? (Math.abs(exchange.profit) / maxProfit) * 100 : 0;
            
            return (
              <div key={exchange.exchange} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium capitalize">{exchange.exchange}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-400">{exchange.trades} trades</span>
                    <span className="text-red-400">{formatCurrency(exchange.fees)} fees</span>
                    <span className={`font-bold ${exchange.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(exchange.profit)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-600 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-300 ${
                        exchange.profit >= 0 ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(5, barWidth)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMLModelChart = () => {
    if (!chartData?.mlModelPerformance.length) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No ML model performance data available</p>
        </div>
      );
    }

    const maxProfit = Math.max(...chartData.mlModelPerformance.map(m => Math.abs(m.profitGenerated)));
    const maxAccuracy = Math.max(...chartData.mlModelPerformance.map(m => m.accuracy));

    const getCategoryColor = (category: string) => {
      switch (category) {
        case 'basic': return 'bg-blue-500';
        case 'intermediate': return 'bg-green-500';
        case 'advanced': return 'bg-purple-500';
        case 'expert': return 'bg-yellow-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="space-y-6">
        {/* Model Profit Chart */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🧠 ML Model Profit Generation</h3>
          <div className="space-y-3">
            {chartData.mlModelPerformance.slice(0, 10).map((model, index) => {
              const barWidth = maxProfit > 0 ? (Math.abs(model.profitGenerated) / maxProfit) * 100 : 0;
              
              return (
                <div key={model.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(model.category)}`}></div>
                      <span className="text-white font-medium text-sm">{model.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-blue-400">{formatPercentage(model.accuracy)} accuracy</span>
                      <span className="text-gray-400">{model.predictions} predictions</span>
                      <span className={`font-bold ${model.profitGenerated >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(model.profitGenerated)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-600 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${getCategoryColor(model.category)}`}
                        style={{ width: `${Math.max(5, barWidth)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Accuracy Chart */}
        <div className="bg-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">🎯 ML Model Accuracy</h3>
          <div className="space-y-3">
            {chartData.mlModelPerformance
              .sort((a, b) => b.accuracy - a.accuracy)
              .slice(0, 10)
              .map((model, index) => {
                const barWidth = (model.accuracy / 100) * 100;
                
                return (
                  <div key={model.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(model.category)}`}></div>
                        <span className="text-white font-medium text-sm">{model.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-400 font-bold">{formatPercentage(model.accuracy)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-600 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">📊 Visual Analytics Dashboard</h1>
            <p className="text-blue-100">Comprehensive charts and performance visualization</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded text-white"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            <button
              onClick={generateChartData}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
        {[
          { id: 'daily', label: 'Daily Performance', icon: BarChart3 },
          { id: 'symbols', label: 'Symbol Distribution', icon: PieChart },
          { id: 'exchanges', label: 'Exchange Performance', icon: Building2 },
          { id: 'ml-models', label: 'ML Model Performance', icon: Brain }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeChart === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{trades.length}</div>
          <div className="text-sm text-gray-400">Total Trades</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className={`text-2xl font-bold ${persistentStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(persistentStats.totalProfit || 0)}
          </div>
          <div className="text-sm text-gray-400">Total Profit</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {formatPercentage(persistentStats.winRate || 0)}
          </div>
          <div className="text-sm text-gray-400">Win Rate</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {formatCurrency(persistentStats.totalFees || 0)}
          </div>
          <div className="text-sm text-gray-400">Total Fees</div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mr-3" />
            <span className="text-white">Loading chart data...</span>
          </div>
        ) : (
          <>
            {activeChart === 'daily' && renderDailyPerformanceChart()}
            {activeChart === 'symbols' && renderSymbolDistributionChart()}
            {activeChart === 'exchanges' && renderExchangePerformanceChart()}
            {activeChart === 'ml-models' && renderMLModelChart()}
          </>
        )}
      </div>

      {/* Chart Export */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Export Chart Data</h3>
            <p className="text-sm text-gray-400">Download chart data for external analysis</p>
          </div>
          <button
            onClick={() => {
              if (chartData) {
                const dataStr = JSON.stringify(chartData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `chart-data-${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}