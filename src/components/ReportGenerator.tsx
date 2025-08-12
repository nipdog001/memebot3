import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Brain, 
  Building2, 
  Zap, 
  Target, 
  Shield, 
  Activity,
  Eye,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Crown,
  Star,
  X
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
  buyFee: number;
  sellFee: number;
  buyFeeRate: number;
  sellFeeRate: number;
  mlConfidence: number;
  decidingModels: string[];
  timestamp: number;
  positionSize: number;
}

interface ReportConfig {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  includeCharts: boolean;
  includeTrades: boolean;
  includeMLAnalysis: boolean;
  includeFeeAnalysis: boolean;
  includeExchangeBreakdown: boolean;
  includeSocialSignals: boolean;
  format: 'pdf' | 'csv' | 'json' | 'excel';
  groupBy: 'day' | 'week' | 'month' | 'exchange' | 'symbol';
}

interface ReportGeneratorProps {
  trades: Trade[];
  persistentStats: any;
  mlModels: any[];
  exchanges: any[];
  userTier: string;
  onClose: () => void;
}

export default function ReportGenerator({ 
  trades, 
  persistentStats, 
  mlModels, 
  exchanges, 
  userTier,
  onClose 
}: ReportGeneratorProps) {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    dateRange: 'month',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeCharts: true,
    includeTrades: true,
    includeMLAnalysis: true,
    includeFeeAnalysis: true,
    includeExchangeBreakdown: true,
    includeSocialSignals: userTier !== 'basic',
    format: 'csv', // Default to CSV which works reliably
    groupBy: 'day'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    generatePreviewData();
  }, [reportConfig, trades]);

  const generatePreviewData = () => {
    const filteredTrades = filterTradesByDateRange(trades);
    
    const summary = {
      totalTrades: filteredTrades.length,
      profitableTrades: filteredTrades.filter(t => t.netProfit > 0).length,
      totalProfit: filteredTrades.reduce((sum, t) => sum + t.netProfit, 0),
      totalFees: filteredTrades.reduce((sum, t) => sum + t.totalFees, 0),
      winRate: filteredTrades.length > 0 ? 
        (filteredTrades.filter(t => t.netProfit > 0).length / filteredTrades.length) * 100 : 0,
      avgTradeSize: filteredTrades.length > 0 ? 
        filteredTrades.reduce((sum, t) => sum + t.amount * t.buyPrice, 0) / filteredTrades.length : 0,
      bestTrade: filteredTrades.reduce((best, trade) => 
        trade.netProfit > (best?.netProfit || -Infinity) ? trade : best, null),
      worstTrade: filteredTrades.reduce((worst, trade) => 
        trade.netProfit < (worst?.netProfit || Infinity) ? trade : worst, null)
    };

    const exchangeBreakdown = exchanges.map(exchange => {
      const exchangeTrades = filteredTrades.filter(t => 
        t.buyExchange === exchange.name || t.sellExchange === exchange.name
      );
      return {
        name: exchange.name,
        trades: exchangeTrades.length,
        profit: exchangeTrades.reduce((sum, t) => sum + t.netProfit, 0),
        fees: exchangeTrades.reduce((sum, t) => sum + t.totalFees, 0)
      };
    });

    const symbolBreakdown = [...new Set(filteredTrades.map(t => t.symbol))].map(symbol => {
      const symbolTrades = filteredTrades.filter(t => t.symbol === symbol);
      return {
        symbol,
        trades: symbolTrades.length,
        profit: symbolTrades.reduce((sum, t) => sum + t.netProfit, 0),
        winRate: (symbolTrades.filter(t => t.netProfit > 0).length / symbolTrades.length) * 100
      };
    });

    const mlPerformance = mlModels.map(model => ({
      name: model.name,
      accuracy: model.accuracy,
      predictions: model.predictions,
      profitGenerated: model.profitGenerated,
      enabled: model.enabled
    }));

    setPreviewData({
      summary,
      exchangeBreakdown,
      symbolBreakdown,
      mlPerformance,
      filteredTrades: filteredTrades.slice(0, 10) // Preview first 10 trades
    });
  };

  const filterTradesByDateRange = (allTrades: Trade[]) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(reportConfig.endDate);

    switch (reportConfig.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = new Date(reportConfig.startDate);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.timestamp);
      return tradeDate >= startDate && tradeDate <= endDate;
    });
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const filteredTrades = filterTradesByDateRange(trades);
      
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          dateRange: reportConfig.dateRange,
          startDate: reportConfig.startDate,
          endDate: reportConfig.endDate,
          userTier,
          totalTrades: filteredTrades.length,
          platform: 'MemeMillionaireBot',
          version: '2.0'
        },
        summary: previewData.summary,
        trades: reportConfig.includeTrades ? filteredTrades : [],
        exchangeBreakdown: reportConfig.includeExchangeBreakdown ? previewData.exchangeBreakdown : [],
        symbolBreakdown: previewData.symbolBreakdown,
        mlPerformance: reportConfig.includeMLAnalysis ? previewData.mlPerformance : [],
        feeAnalysis: reportConfig.includeFeeAnalysis ? {
          totalFees: previewData.summary.totalFees,
          avgFeePerTrade: previewData.summary.totalFees / filteredTrades.length,
          feesByExchange: previewData.exchangeBreakdown.map((e: any) => ({
            exchange: e.name,
            fees: e.fees
          }))
        } : null
      };

      // Generate and download the report
      downloadReport(reportData);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (data: any) => {
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (reportConfig.format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        filename = `memebot-report-${reportConfig.dateRange}-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      
      case 'csv':
        content = generateCSVContent(data);
        filename = `memebot-report-${reportConfig.dateRange}-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      
      case 'excel':
        // For Excel, we'll generate CSV format with Excel-compatible headers
        content = generateExcelCompatibleCSV(data);
        filename = `memebot-report-${reportConfig.dateRange}-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      
      case 'pdf':
        // For PDF, we'll generate a text-based report
        content = generateTextReport(data);
        filename = `memebot-report-${reportConfig.dateRange}-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
      
      default:
        content = generateCSVContent(data);
        filename = `memebot-report-${reportConfig.dateRange}-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
    }

    // Create and download the file
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      alert(`Report downloaded successfully as ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  const generateCSVContent = (data: any) => {
    let csv = 'MemeMillionaireBot Trading Report\n\n';
    
    // Metadata
    csv += 'REPORT METADATA\n';
    csv += 'Generated At,Platform,Version,User Tier,Date Range\n';
    csv += `${data.metadata.generatedAt},${data.metadata.platform},${data.metadata.version},${data.metadata.userTier},${data.metadata.dateRange}\n\n`;
    
    // Summary
    csv += 'TRADING SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Trades,${data.summary.totalTrades}\n`;
    csv += `Profitable Trades,${data.summary.profitableTrades}\n`;
    csv += `Win Rate,${data.summary.winRate.toFixed(2)}%\n`;
    csv += `Total Profit,$${data.summary.totalProfit.toFixed(2)}\n`;
    csv += `Total Fees,$${data.summary.totalFees.toFixed(2)}\n`;
    csv += `Average Trade Size,$${data.summary.avgTradeSize.toFixed(2)}\n\n`;

    // Trades
    if (data.trades.length > 0) {
      csv += 'DETAILED TRADES\n';
      csv += 'Timestamp,Symbol,Buy Exchange,Sell Exchange,Amount,Buy Price,Sell Price,Net Profit,Total Fees,ML Confidence,Position Size\n';
      data.trades.forEach((trade: Trade) => {
        csv += `${new Date(trade.timestamp).toISOString()},${trade.symbol},${trade.buyExchange},${trade.sellExchange},${trade.amount},${trade.buyPrice},${trade.sellPrice},${trade.netProfit},${trade.totalFees},${(trade.mlConfidence * 100).toFixed(1)}%,${trade.positionSize.toFixed(2)}%\n`;
      });
      csv += '\n';
    }

    // Exchange Breakdown
    if (data.exchangeBreakdown.length > 0) {
      csv += 'EXCHANGE PERFORMANCE\n';
      csv += 'Exchange,Trades,Profit,Fees\n';
      data.exchangeBreakdown.forEach((exchange: any) => {
        csv += `${exchange.name},${exchange.trades},$${exchange.profit.toFixed(2)},$${exchange.fees.toFixed(2)}\n`;
      });
      csv += '\n';
    }

    // Symbol Breakdown
    csv += 'SYMBOL PERFORMANCE\n';
    csv += 'Symbol,Trades,Profit,Win Rate\n';
    data.symbolBreakdown.forEach((symbol: any) => {
      csv += `${symbol.symbol},${symbol.trades},$${symbol.profit.toFixed(2)},${symbol.winRate.toFixed(2)}%\n`;
    });

    return csv;
  };

  const generateExcelCompatibleCSV = (data: any) => {
    // Excel-compatible CSV with UTF-8 BOM
    const BOM = '\uFEFF';
    return BOM + generateCSVContent(data);
  };

  const generateTextReport = (data: any) => {
    let content = `MEMECOIN MILLIONAIRE BOT - TRADING REPORT\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += `Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}\n`;
    content += `Period: ${data.metadata.dateRange.toUpperCase()}\n`;
    content += `User Tier: ${data.metadata.userTier.toUpperCase()}\n`;
    content += `Platform: ${data.metadata.platform} v${data.metadata.version}\n\n`;
    
    content += `EXECUTIVE SUMMARY\n`;
    content += `${'-'.repeat(20)}\n`;
    content += `Total Trades: ${data.summary.totalTrades}\n`;
    content += `Profitable Trades: ${data.summary.profitableTrades}\n`;
    content += `Win Rate: ${data.summary.winRate.toFixed(2)}%\n`;
    content += `Total Profit: $${data.summary.totalProfit.toFixed(2)}\n`;
    content += `Total Fees: $${data.summary.totalFees.toFixed(2)}\n`;
    content += `Average Trade Size: $${data.summary.avgTradeSize.toFixed(2)}\n\n`;

    if (data.summary.bestTrade) {
      content += `Best Trade: ${data.summary.bestTrade.symbol} - $${data.summary.bestTrade.netProfit.toFixed(2)}\n`;
    }
    if (data.summary.worstTrade) {
      content += `Worst Trade: ${data.summary.worstTrade.symbol} - $${data.summary.worstTrade.netProfit.toFixed(2)}\n\n`;
    }

    content += `PERFORMANCE ANALYSIS\n`;
    content += `${'-'.repeat(20)}\n`;
    content += `This report contains comprehensive trading data and analysis.\n`;
    content += `For detailed breakdowns and charts, please use the CSV or JSON format.\n\n`;

    content += `DISCLAIMER\n`;
    content += `${'-'.repeat(12)}\n`;
    content += `This report is for informational purposes only.\n`;
    content += `Past performance does not guarantee future results.\n`;
    content += `Cryptocurrency trading involves substantial risk of loss.\n`;

    return content;
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">📊 Advanced Report Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Report Configuration</span>
              </h3>

              {/* Date Range */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date Range</label>
                  <select
                    value={reportConfig.dateRange}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      dateRange: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                    <option value="year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {reportConfig.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={reportConfig.startDate}
                        onChange={(e) => setReportConfig(prev => ({ 
                          ...prev, 
                          startDate: e.target.value 
                        }))}
                        className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End Date</label>
                      <input
                        type="date"
                        value={reportConfig.endDate}
                        onChange={(e) => setReportConfig(prev => ({ 
                          ...prev, 
                          endDate: e.target.value 
                        }))}
                        className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Export Format</label>
                  <select
                    value={reportConfig.format}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      format: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                  >
                    <option value="csv">CSV (Recommended)</option>
                    <option value="json">JSON Data</option>
                    <option value="excel">Excel Compatible CSV</option>
                    <option value="pdf">Text Report</option>
                  </select>
                  <div className="text-xs text-gray-400 mt-1">
                    {reportConfig.format === 'csv' && 'Best for spreadsheet analysis'}
                    {reportConfig.format === 'json' && 'Best for data processing'}
                    {reportConfig.format === 'excel' && 'Opens directly in Excel'}
                    {reportConfig.format === 'pdf' && 'Text-based summary report'}
                  </div>
                </div>

                {/* Group By */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Group Data By</label>
                  <select
                    value={reportConfig.groupBy}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      groupBy: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="exchange">By Exchange</option>
                    <option value="symbol">By Symbol</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Include Options */}
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4">Include in Report</h3>
              <div className="space-y-3">
                {[
                  { key: 'includeCharts', label: 'Performance Charts', icon: BarChart3 },
                  { key: 'includeTrades', label: 'Detailed Trade List', icon: Activity },
                  { key: 'includeMLAnalysis', label: 'ML Model Analysis', icon: Brain },
                  { key: 'includeFeeAnalysis', label: 'Fee Breakdown', icon: DollarSign },
                  { key: 'includeExchangeBreakdown', label: 'Exchange Analysis', icon: Building2 },
                  { key: 'includeSocialSignals', label: 'Social Signals', icon: Zap, disabled: userTier === 'basic' }
                ].map(option => (
                  <div key={option.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={reportConfig[option.key as keyof ReportConfig] as boolean}
                      onChange={(e) => setReportConfig(prev => ({ 
                        ...prev, 
                        [option.key]: e.target.checked 
                      }))}
                      disabled={option.disabled}
                      className="rounded"
                    />
                    <option.icon className={`h-4 w-4 ${option.disabled ? 'text-gray-500' : 'text-blue-400'}`} />
                    <label className={`text-sm ${option.disabled ? 'text-gray-500' : 'text-white'}`}>
                      {option.label}
                      {option.disabled && (
                        <span className="text-xs text-orange-400 ml-1">(Pro+)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Generate & Download Report</span>
                </>
              )}
            </button>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Report Preview</span>
              </h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {showPreview && previewData && (
              <div className="space-y-4">
                {/* Summary Preview */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">📈 Executive Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{previewData.summary.totalTrades}</div>
                      <div className="text-xs text-gray-400">Total Trades</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        previewData.summary.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(previewData.summary.totalProfit)}
                      </div>
                      <div className="text-xs text-gray-400">Total Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {formatPercentage(previewData.summary.winRate)}
                      </div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {formatCurrency(previewData.summary.totalFees)}
                      </div>
                      <div className="text-xs text-gray-400">Total Fees</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {formatCurrency(previewData.summary.avgTradeSize)}
                      </div>
                      <div className="text-xs text-gray-400">Avg Trade Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {previewData.summary.profitableTrades}
                      </div>
                      <div className="text-xs text-gray-400">Profitable Trades</div>
                    </div>
                  </div>
                </div>

                {/* Exchange Breakdown Preview */}
                {reportConfig.includeExchangeBreakdown && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">🏢 Exchange Performance</h4>
                    <div className="space-y-2">
                      {previewData.exchangeBreakdown.map((exchange: any) => (
                        <div key={exchange.name} className="flex items-center justify-between">
                          <span className="text-white">{exchange.name}</span>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-400">{exchange.trades} trades</span>
                            <span className={exchange.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatCurrency(exchange.profit)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symbol Breakdown Preview */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">🪙 Top Performing Symbols</h4>
                  <div className="space-y-2">
                    {previewData.symbolBreakdown.slice(0, 5).map((symbol: any) => (
                      <div key={symbol.symbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{symbol.symbol}</span>
                          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">MEME</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-400">{symbol.trades} trades</span>
                          <span className="text-blue-400">{formatPercentage(symbol.winRate)} win</span>
                          <span className={symbol.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {formatCurrency(symbol.profit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Trades Preview */}
                {reportConfig.includeTrades && (
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">📋 Recent Trades (Preview)</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {previewData.filteredTrades.map((trade: Trade) => (
                        <div key={trade.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{trade.symbol}</span>
                            <span className="text-gray-400">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">
                              {formatPercentage(trade.mlConfidence * 100)} ML
                            </span>
                            <span className={trade.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {formatCurrency(trade.netProfit)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Panel */}
            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">Report Features</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Comprehensive trading performance analysis</li>
                    <li>• Detailed profit/loss breakdowns by exchange and symbol</li>
                    <li>• ML model performance tracking and insights</li>
                    <li>• Fee analysis to optimize trading costs</li>
                    <li>• Export in multiple formats (CSV recommended for reliability)</li>
                    <li>• Historical data comparison and trends</li>
                    {userTier !== 'basic' && <li>• Social signal impact analysis (Pro+ feature)</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}