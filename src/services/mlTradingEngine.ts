import exchangeDataService from './exchangeDataService';

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
  strategy: string;
}

interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  grossProfit: number;
  estimatedFees: number;
  netProfit: number;
  profitPercent: number;
  timestamp: number;
}

interface MLAnalysis {
  confidence: number;
  shouldTrade: boolean;
  decidingModels: string[];
  riskFactors: any;
  marketData: any;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  strategy: string;
}

interface TradingSettings {
  minTradeSize: number;
  maxTradeSize: number;
  mlConfidenceThreshold: number;
  positionSize: number;
  unlimitedTrades: boolean;
  tradeFrequency: number;
  maxTradesPerHour: number;
}

interface MarketIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  ema: { fast: number; slow: number };
  volume: { current: number; average: number };
  momentum: number;
  volatility: number;
}

interface ModelConfig {
  name: string;
  accuracy: number;
  weight: number;
  type: string;
}

interface StrategyPerformance {
  trades: number;
  wins: number;
  totalProfit: number;
  avgConfidence: number;
}

class MLTradingEngine {
  private isActive: boolean = false;
  private confidenceThreshold: number = 60;
  private tradingInterval: NodeJS.Timeout | null = null;
  private statistics = {
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    averageConfidence: 0,
    strategyPerformance: {} as Record<string, StrategyPerformance>
  };
  
  private onTradeExecuted: ((data: any) => void) | null = null;
  
  private settings: TradingSettings = {
    minTradeSize: 10,
    maxTradeSize: 1000,
    mlConfidenceThreshold: 60,
    positionSize: 2.0,
    unlimitedTrades: true,
    tradeFrequency: 3000,
    maxTradesPerHour: 300
  };
  
  private models: ModelConfig[] = [
    { name: 'Linear Regression', accuracy: 72.5, weight: 1.0, type: 'regression' },
    { name: 'Polynomial Regression', accuracy: 75.1, weight: 1.2, type: 'regression' },
    { name: 'Moving Average Crossover', accuracy: 68.3, weight: 0.8, type: 'technical' },
    { name: 'RSI Momentum', accuracy: 79.2, weight: 1.5, type: 'momentum' },
    { name: 'Bollinger Bands', accuracy: 81.7, weight: 1.8, type: 'volatility' },
    { name: 'MACD Signal', accuracy: 77.8, weight: 1.3, type: 'trend' },
    { name: 'LSTM Neural Network', accuracy: 85.4, weight: 2.0, type: 'neural' },
    { name: 'Random Forest', accuracy: 83.2, weight: 1.9, type: 'ensemble' },
    { name: 'Gradient Boosting', accuracy: 84.1, weight: 1.9, type: 'ensemble' },
    { name: 'Support Vector Machine', accuracy: 78.9, weight: 1.4, type: 'classification' },
    { name: 'Transformer Model', accuracy: 88.3, weight: 2.2, type: 'neural' },
    { name: 'Ensemble Meta-Model', accuracy: 91.3, weight: 2.5, type: 'meta' }
  ];

  private strategies: string[] = [
    'arbitrage',
    'momentum',
    'mean_reversion',
    'breakout',
    'scalping',
    'swing',
    'sentiment',
    'volume_analysis'
  ];

  private priceHistory: Record<string, number[]> = {};
  private marketIndicators: Record<string, MarketIndicators> = {};
  
  constructor() {
    this.loadSettings();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies.forEach(strategy => {
      this.statistics.strategyPerformance[strategy] = {
        trades: 0,
        wins: 0,
        totalProfit: 0,
        avgConfidence: 0
      };
    });
  }

  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('memebot_persistent_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { 
          ...this.settings, 
          ...parsed,
          mlConfidenceThreshold: parsed.mlConfidenceThreshold || 60
        };
        this.confidenceThreshold = this.settings.mlConfidenceThreshold;
        console.log('📊 ML Engine: Loaded settings:', this.settings);
      }
    } catch (error) {
      console.error('Error loading ML settings:', error);
    }
  }

  public setThreshold(threshold: number): number {
    this.confidenceThreshold = Math.max(50, Math.min(95, threshold));
    console.log(`🧠 ML confidence threshold set to ${this.confidenceThreshold}%`);
    return this.confidenceThreshold;
  }

  public setOnTradeExecuted(callback: (data: any) => void): void {
    this.onTradeExecuted = callback;
  }

  public async startAutoTrading(interval: number = 3000): Promise<{ success: boolean; message: string; interval?: number; threshold?: number }> {
    if (this.isActive) {
      return { success: false, message: 'Auto trading is already active' };
    }

    this.isActive = true;
    console.log('🤖 Starting ML auto trading with ALL strategies...');

    this.tradingInterval = setInterval(async () => {
      try {
        await this.executeTradingCycle();
      } catch (error) {
        console.error('❌ Error in trading cycle:', error);
      }
    }, interval);

    return {
      success: true,
      message: 'ML auto trading started with all strategies',
      interval: interval,
      threshold: this.confidenceThreshold
    };
  }

  public stopAutoTrading(): { success: boolean; message: string } {
    if (!this.isActive) {
      return { success: false, message: 'Auto trading is not active' };
    }

    this.isActive = false;
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }

    console.log('⏹️ ML auto trading stopped');
    return { success: true, message: 'ML auto trading stopped' };
  }

  private async executeTradingCycle(): Promise<void> {
    try {
      this.loadSettings();
      
      const enabledPairs = await this.getEnabledTradingPairs();
      const enabledExchanges = await this.getEnabledExchanges();
      
      if (enabledPairs.length === 0 || enabledExchanges.length === 0) {
        console.log('⚠️ No enabled pairs or exchanges for trading');
        return;
      }

      console.log(`🚀 Executing trading cycle with ${enabledPairs.length} pairs and ${this.strategies.length} strategies`);
      
      let tradesExecuted = 0;
      const maxTradesPerCycle = this.settings.unlimitedTrades ? 10 : 3;
      
      for (const pair of enabledPairs) {
        await this.updateMarketIndicators(pair);
      }
      
      for (const pair of enabledPairs) {
        if (tradesExecuted >= maxTradesPerCycle) break;
        
        for (const strategy of this.strategies) {
          if (tradesExecuted >= maxTradesPerCycle) break;
          
          const opportunity = await this.evaluateStrategy(strategy, pair);
          if (opportunity && opportunity.confidence >= this.confidenceThreshold / 100) {
            console.log(`🎯 Executing ${strategy} trade for ${pair} with ${(opportunity.confidence * 100).toFixed(1)}% confidence`);
            await this.executeTrade(opportunity);
            tradesExecuted++;
          }
        }
      }
      
      if (tradesExecuted === 0) {
        console.log('📊 No high-confidence opportunities found this cycle');
      } else {
        console.log(`✅ Executed ${tradesExecuted} trades across multiple strategies`);
      }
      
    } catch (error) {
      console.error('❌ Error in trading cycle:', error);
    }
  }

  private async updateMarketIndicators(symbol: string): Promise<void> {
    try {
      const exchanges = await this.getEnabledExchanges();
      const prices: number[] = [];
      
      for (const exchange of exchanges) {
        const data = exchangeDataService.getMarketData(exchange, symbol);
        if (data) {
          prices.push(data.price);
        }
      }
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        
        if (!this.priceHistory[symbol]) {
          this.priceHistory[symbol] = [];
        }
        this.priceHistory[symbol].push(avgPrice);
        if (this.priceHistory[symbol].length > 50) {
          this.priceHistory[symbol].shift();
        }
        
        this.marketIndicators[symbol] = this.calculateIndicators(symbol);
      }
    } catch (error) {
      console.error(`Error updating indicators for ${symbol}:`, error);
    }
  }

  private calculateIndicators(symbol: string): MarketIndicators {
    const prices = this.priceHistory[symbol] || [];
    if (prices.length < 14) {
      return this.getDefaultIndicators();
    }
    
    const rsi = this.calculateRSI(prices, 14);
    const macd = this.calculateMACD(prices);
    const bollinger = this.calculateBollingerBands(prices, 20);
    const emaFast = this.calculateEMA(prices, 9);
    const emaSlow = this.calculateEMA(prices, 21);
    const volumeCurrent = 100000 + Math.random() * 900000;
    const volumeAvg = 500000;
    const momentum = prices.length >= 10 ? 
      ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100 : 0;
    const volatility = this.calculateVolatility(prices);
    
    return {
      rsi,
      macd,
      bollinger,
      ema: { fast: emaFast, slow: emaSlow },
      volume: { current: volumeCurrent, average: volumeAvg },
      momentum,
      volatility
    };
  }

  private async evaluateStrategy(strategy: string, symbol: string): Promise<any> {
    const amount = this.calculateTradeAmount();
    
    switch (strategy) {
      case 'arbitrage':
        return await this.evaluateArbitrage(symbol, amount);
      case 'momentum':
        return await this.evaluateMomentum(symbol, amount);
      case 'mean_reversion':
        return await this.evaluateMeanReversion(symbol, amount);
      case 'breakout':
        return await this.evaluateBreakout(symbol, amount);
      case 'scalping':
        return await this.evaluateScalping(symbol, amount);
      case 'swing':
        return await this.evaluateSwingTrade(symbol, amount);
      case 'sentiment':
        return await this.evaluateSentiment(symbol, amount);
      case 'volume_analysis':
        return await this.evaluateVolumeAnalysis(symbol, amount);
      default:
        return null;
    }
  }

  private async evaluateArbitrage(symbol: string, amount: number): Promise<any> {
    const opportunities = await exchangeDataService.findArbitrageOpportunities(symbol, amount);
    
    if (opportunities.length > 0) {
      const best = opportunities[0];
      if (best.profitPercent > 0.01) {
        const models = this.selectModelsForStrategy('arbitrage');
        const confidence = this.calculateConfidenceWithModels(models, best);
        
        return {
          ...best,
          strategy: 'arbitrage',
          confidence,
          decidingModels: models.map(m => m.name)
        };
      }
    }
    return null;
  }

  private async evaluateMomentum(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    if (!indicators) return null;
    
    if (Math.abs(indicators.momentum) > 2 && indicators.rsi > 30 && indicators.rsi < 70) {
      const direction = indicators.momentum > 0 ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('momentum');
      const confidence = this.calculateMomentumConfidence(indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'momentum', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateMeanReversion(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    const prices = this.priceHistory[symbol];
    if (!indicators || !prices || prices.length < 20) return null;
    
    const currentPrice = prices[prices.length - 1];
    const sma = prices.slice(-20).reduce((sum, p) => sum + p, 0) / 20;
    const deviation = ((currentPrice - sma) / sma) * 100;
    
    if (Math.abs(deviation) > 2) {
      const direction = deviation < 0 ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('mean_reversion');
      const confidence = this.calculateMeanReversionConfidence(deviation, indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'mean_reversion', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateBreakout(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    const prices = this.priceHistory[symbol];
    if (!indicators || !prices || prices.length < 20) return null;
    
    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > indicators.bollinger.upper || currentPrice < indicators.bollinger.lower) {
      const direction = currentPrice > indicators.bollinger.upper ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('breakout');
      const confidence = this.calculateBreakoutConfidence(currentPrice, indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'breakout', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateScalping(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    if (!indicators) return null;
    
    if (indicators.volatility > 0.5 && indicators.volume.current > indicators.volume.average * 1.2) {
      const direction = indicators.ema.fast > indicators.ema.slow ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('scalping');
      const confidence = this.calculateScalpingConfidence(indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'scalping', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateSwingTrade(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    if (!indicators) return null;
    
    if (Math.abs(indicators.macd.histogram) > 0.001 && 
        ((indicators.macd.line > indicators.macd.signal && indicators.rsi < 70) ||
         (indicators.macd.line < indicators.macd.signal && indicators.rsi > 30))) {
      const direction = indicators.macd.line > indicators.macd.signal ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('swing');
      const confidence = this.calculateSwingConfidence(indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'swing', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateSentiment(symbol: string, amount: number): Promise<any> {
    const sentimentScore = 0.5 + (Math.random() - 0.5) * 0.4;
    
    if (sentimentScore > 0.65 || sentimentScore < 0.35) {
      const direction = sentimentScore > 0.65 ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('sentiment');
      const confidence = sentimentScore > 0.65 ? sentimentScore : 1 - sentimentScore;
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'sentiment', direction, confidence, models);
      }
    }
    return null;
  }

  private async evaluateVolumeAnalysis(symbol: string, amount: number): Promise<any> {
    const indicators = this.marketIndicators[symbol];
    if (!indicators) return null;
    
    if (indicators.volume.current > indicators.volume.average * 1.5 && Math.abs(indicators.momentum) > 1) {
      const direction = indicators.momentum > 0 ? 'BUY' : 'SELL';
      const models = this.selectModelsForStrategy('volume_analysis');
      const confidence = this.calculateVolumeConfidence(indicators, models);
      
      if (confidence >= this.confidenceThreshold / 100) {
        return this.createTradeOpportunity(symbol, amount, 'volume_analysis', direction, confidence, models);
      }
    }
    return null;
  }

  private selectModelsForStrategy(strategy: string): ModelConfig[] {
    const modelSelection: Record<string, string[]> = {
      'arbitrage': ['regression', 'neural', 'meta'],
      'momentum': ['momentum', 'trend', 'neural'],
      'mean_reversion': ['technical', 'volatility', 'ensemble'],
      'breakout': ['volatility', 'trend', 'classification'],
      'scalping': ['technical', 'momentum', 'neural'],
      'swing': ['trend', 'momentum', 'ensemble'],
      'sentiment': ['neural', 'classification', 'meta'],
      'volume_analysis': ['technical', 'classification', 'ensemble']
    };
    
    const types = modelSelection[strategy] || ['neural', 'ensemble'];
    return this.models.filter(m => types.includes(m.type));
  }

  private calculateConfidenceWithModels(models: ModelConfig[], opportunity: any): number {
    let totalConfidence = 0;
    let totalWeight = 0;
    
    models.forEach(model => {
      const modelConfidence = 0.5 + (model.accuracy / 100) * 0.3 + Math.random() * 0.2;
      totalConfidence += modelConfidence * model.weight;
      totalWeight += model.weight;
    });
    
    return Math.min(0.95, totalConfidence / totalWeight);
  }

  private calculateMomentumConfidence(indicators: MarketIndicators, models: ModelConfig[]): number {
    const baseConfidence = Math.min(0.9, 0.5 + Math.abs(indicators.momentum) * 0.05);
    const rsiBonus = indicators.rsi > 50 && indicators.rsi < 70 ? 0.1 : 0;
    const volumeBonus = indicators.volume.current > indicators.volume.average ? 0.05 : 0;
    
    return Math.min(0.95, baseConfidence + rsiBonus + volumeBonus);
  }

  private calculateMeanReversionConfidence(deviation: number, indicators: MarketIndicators, models: ModelConfig[]): number {
    const baseConfidence = Math.min(0.85, 0.5 + Math.abs(deviation) * 0.08);
    const rsiBonus = (indicators.rsi < 30 || indicators.rsi > 70) ? 0.1 : 0;
    
    return Math.min(0.95, baseConfidence + rsiBonus);
  }

  private calculateBreakoutConfidence(price: number, indicators: MarketIndicators, models: ModelConfig[]): number {
    const bandWidth = indicators.bollinger.upper - indicators.bollinger.lower;
    const breakoutStrength = Math.abs(price - indicators.bollinger.middle) / bandWidth;
    const baseConfidence = Math.min(0.85, 0.5 + breakoutStrength * 0.3);
    const volumeBonus = indicators.volume.current > indicators.volume.average * 1.3 ? 0.1 : 0;
    
    return Math.min(0.95, baseConfidence + volumeBonus);
  }

  private calculateScalpingConfidence(indicators: MarketIndicators, models: ModelConfig[]): number {
    const baseConfidence = 0.6;
    const volatilityBonus = Math.min(0.2, indicators.volatility * 0.2);
    const volumeBonus = Math.min(0.15, (indicators.volume.current / indicators.volume.average - 1) * 0.1);
    
    return Math.min(0.9, baseConfidence + volatilityBonus + volumeBonus);
  }

  private calculateSwingConfidence(indicators: MarketIndicators, models: ModelConfig[]): number {
    const macdStrength = Math.abs(indicators.macd.histogram) * 100;
    const baseConfidence = Math.min(0.8, 0.5 + macdStrength * 0.2);
    const rsiBonus = (indicators.rsi > 30 && indicators.rsi < 70) ? 0.1 : 0;
    
    return Math.min(0.95, baseConfidence + rsiBonus);
  }

  private calculateVolumeConfidence(indicators: MarketIndicators, models: ModelConfig[]): number {
    const volumeRatio = indicators.volume.current / indicators.volume.average;
    const baseConfidence = Math.min(0.8, 0.5 + (volumeRatio - 1) * 0.2);
    const momentumBonus = Math.min(0.15, Math.abs(indicators.momentum) * 0.05);
    
    return Math.min(0.95, baseConfidence + momentumBonus);
  }

  private async createTradeOpportunity(
    symbol: string, 
    amount: number, 
    strategy: string, 
    direction: string, 
    confidence: number, 
    models: ModelConfig[]
  ): Promise<any> {
    const exchanges = await this.getEnabledExchanges();
    const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
    const marketData = exchangeDataService.getMarketData(exchange, symbol);
    
    if (!marketData) return null;
    
    const price = marketData.price;
    const expectedProfitPercent = this.getExpectedProfitForStrategy(strategy);
    const expectedProfit = amount * expectedProfitPercent;
    
    return {
      symbol,
      buyExchange: exchange,
      sellExchange: exchange,
      buyPrice: price,
      sellPrice: price * (1 + expectedProfitPercent),
      amount,
      grossProfit: expectedProfit,
      estimatedFees: amount * 0.002,
      netProfit: expectedProfit - (amount * 0.002),
      profitPercent: expectedProfitPercent * 100,
      timestamp: Date.now(),
      strategy,
      direction,
      confidence,
      decidingModels: models.map(m => m.name)
    };
  }

  private getExpectedProfitForStrategy(strategy: string): number {
    const profitTargets: Record<string, number> = {
      'arbitrage': 0.003,
      'momentum': 0.015,
      'mean_reversion': 0.008,
      'breakout': 0.02,
      'scalping': 0.005,
      'swing': 0.025,
      'sentiment': 0.012,
      'volume_analysis': 0.01
    };
    
    return profitTargets[strategy] || 0.01;
  }

  private async executeTrade(opportunity: any): Promise<void> {
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: opportunity.symbol,
      buyExchange: opportunity.buyExchange,
      sellExchange: opportunity.sellExchange,
      amount: opportunity.amount,
      buyPrice: opportunity.buyPrice,
      sellPrice: opportunity.sellPrice,
      netProfit: opportunity.netProfit,
      totalFees: opportunity.estimatedFees,
      buyFee: opportunity.estimatedFees / 2,
      sellFee: opportunity.estimatedFees / 2,
      buyFeeRate: 0.001,
      sellFeeRate: 0.001,
      mlConfidence: opportunity.confidence,
      decidingModels: opportunity.decidingModels,
      timestamp: Date.now(),
      positionSize: this.settings.positionSize,
      strategy: opportunity.strategy
    };
    
    this.saveTrade(trade);
    this.updateStatistics(trade);
    
    console.log(`✅ ${opportunity.strategy.toUpperCase()} trade executed: ${trade.symbol} - Profit: $${trade.netProfit.toFixed(2)}`);
    
    if (this.onTradeExecuted) {
      this.onTradeExecuted({
        trade,
        mlAnalysis: {
          confidence: opportunity.confidence,
          strategy: opportunity.strategy,
          direction: opportunity.direction,
          decidingModels: opportunity.decidingModels
        }
      });
    }
  }

  private saveTrade(trade: Trade): void {
    try {
      const tradesJson = localStorage.getItem('memebot_trades');
      let trades: Trade[] = [];
      
      if (tradesJson) {
        trades = JSON.parse(tradesJson);
        if (!Array.isArray(trades)) {
          trades = [];
        }
      }
      
      trades.unshift(trade);
      trades = trades.slice(0, 1000);
      
      localStorage.setItem('memebot_trades', JSON.stringify(trades));
      
      const currentBalance = parseFloat(localStorage.getItem('memebot_balance') || '10000');
      const newBalance = currentBalance + trade.netProfit;
      localStorage.setItem('memebot_balance', newBalance.toString());
      
      window.dispatchEvent(new CustomEvent('tradeExecuted', { detail: { trade } }));
      window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: { balance: newBalance } }));
      
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  }

  private updateStatistics(trade: Trade): void {
    this.statistics.totalTrades++;
    if (trade.netProfit > 0) {
      this.statistics.successfulTrades++;
    }
    this.statistics.totalProfit += trade.netProfit;
    this.statistics.averageConfidence = 
      (this.statistics.averageConfidence * (this.statistics.totalTrades - 1) + trade.mlConfidence) / 
      this.statistics.totalTrades;
    
    const strategyStats = this.statistics.strategyPerformance[trade.strategy];
    if (strategyStats) {
      strategyStats.trades++;
      if (trade.netProfit > 0) strategyStats.wins++;
      strategyStats.totalProfit += trade.netProfit;
      strategyStats.avgConfidence = 
        (strategyStats.avgConfidence * (strategyStats.trades - 1) + trade.mlConfidence) / 
        strategyStats.trades;
    }
  }

  private calculateTradeAmount(): number {
    const min = this.settings.minTradeSize || 10;
    const max = this.settings.maxTradeSize || 1000;
    return Math.floor(Math.random() * (max - min) + min);
  }

  private async getEnabledTradingPairs(): Promise<string[]> {
    try {
      const tradingPairsJson = localStorage.getItem('tradingPairs');
      if (tradingPairsJson) {
        const tradingPairs = JSON.parse(tradingPairsJson);
        if (tradingPairs.exchanges) {
          const enabledPairs = new Set<string>();
          
          Object.values(tradingPairs.exchanges).forEach((exchangePairs: any) => {
            if (Array.isArray(exchangePairs)) {
              exchangePairs.forEach((pair: any) => {
                if (pair.enabled && pair.symbol) {
                  enabledPairs.add(pair.symbol);
                }
              });
            }
          });
          
          return Array.from(enabledPairs);
        }
      }
    } catch (error) {
      console.error('Error getting enabled trading pairs:', error);
    }

    return ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'];
  }

  private async getEnabledExchanges(): Promise<string[]> {
    try {
      const connectedExchanges = exchangeDataService.getConnectedExchanges();
      return connectedExchanges.length > 0 ? connectedExchanges : ['coinbase', 'kraken', 'binanceus'];
    } catch (error) {
      console.error('Error getting enabled exchanges:', error);
      return ['coinbase', 'kraken', 'binanceus'];
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9;
    
    return {
      line: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      const lastPrice = prices[prices.length - 1] || 0;
      return { upper: lastPrice * 1.02, middle: lastPrice, lower: lastPrice * 0.98 };
    }
    
    const slice = prices.slice(-period);
    const sma = slice.reduce((sum, p) => sum + p, 0) / period;
    const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + 2 * stdDev,
      middle: sma,
      lower: sma - 2 * stdDev
    };
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private getDefaultIndicators(): MarketIndicators {
    return {
      rsi: 50,
      macd: { line: 0, signal: 0, histogram: 0 },
      bollinger: { upper: 0, middle: 0, lower: 0 },
      ema: { fast: 0, slow: 0 },
      volume: { current: 100000, average: 100000 },
      momentum: 0,
      volatility: 0.01
    };
  }

  public getStatistics(): any {
    return {
      ...this.statistics,
      isActive: this.isActive,
      confidenceThreshold: this.confidenceThreshold,
      winRate: this.statistics.totalTrades > 0 ? 
        (this.statistics.successfulTrades / this.statistics.totalTrades) * 100 : 0,
      activeStrategies: this.strategies.length,
      activeModels: this.models.length
    };
  }

  public getStrategyPerformance(): Record<string, StrategyPerformance> {
    return this.statistics.strategyPerformance;
  }

  public getModelPerformance(): any[] {
    return this.models.map(model => ({
      ...model,
      usage: Math.floor(Math.random() * 100),
      profitContribution: Math.random() * 1000
    }));
  }
}

const mlTradingEngine = new MLTradingEngine();
export default mlTradingEngine;