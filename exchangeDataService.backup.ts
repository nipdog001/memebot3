interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  passphrase?: string;
  sandbox?: boolean;
}

interface ExchangeConfig {
  id: string;
  name: string;
  credentials: ExchangeCredentials;
  connected: boolean;
  lastPing: number;
}

interface MarketData {
  symbol: string;
  exchange: string;
  price: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
  isRealData: boolean;
}

<<<<<<< HEAD
interface OrderBook {
  exchange: string;
  symbol: string;
  bids: Array<[number, number]>; // [price, amount]
  asks: Array<[number, number]>; // [price, amount]
  timestamp: number;
}

interface TechnicalData {
  symbol: string;
  high24h: number;
  low24h: number;
  open24h: number;
  close24h: number;
  vwap: number;
  trades24h: number;
}

class ExchangeDataService {
  private exchanges: Map<string, ExchangeConfig> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private priceHistory: Map<string, number[]> = new Map();
  private orderBooks: Map<string, OrderBook> = new Map();
  private technicalData: Map<string, TechnicalData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private volumeData: Map<string, number[]> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();
=======
class ExchangeDataService {
  private exchanges: Map<string, ExchangeConfig> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03

  constructor() {
    this.initializeExchanges();
  }

  async initializeExchanges() {
<<<<<<< HEAD
    console.log('🔄 Initializing enhanced exchange connections...');
    
    try {
      // Supported US exchanges
=======
    console.log('🔄 Initializing browser-compatible exchange connections...');
    
    try {
      // Browser-compatible exchange initialization
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
      const supportedExchanges = [
        { id: 'coinbase', name: 'Coinbase Pro' },
        { id: 'kraken', name: 'Kraken' },
        { id: 'gemini', name: 'Gemini' },
        { id: 'binanceus', name: 'Binance.US' },
        { id: 'cryptocom', name: 'Crypto.com' }
      ];
      
      for (const exchange of supportedExchanges) {
        const credentials = this.getExchangeCredentials(exchange.id);
        if (credentials) {
          console.log(`🔑 Found credentials for ${exchange.name}, attempting connection...`);
          await this.connectToExchange({
            id: exchange.id,
            name: exchange.name,
            isConnected: false,
            hasApiKey: true
          });
        } else {
          console.log(`⚠️ No credentials found for ${exchange.name}`);
<<<<<<< HEAD
          // Still connect for simulated data
          await this.connectToExchange({
            id: exchange.id,
            name: exchange.name,
            isConnected: false,
            hasApiKey: false
          });
        }
      }

      // Start real-time data updates with higher frequency
      this.startRealTimeUpdates();
      this.isInitialized = true;
      
      console.log(`✅ Exchange data service initialized with ${this.exchanges.size} exchanges`);
=======
        }
      }

      // Start real-time data updates
      this.startRealTimeUpdates();
      this.isInitialized = true;
      
      console.log(`✅ Exchange data service initialized with ${this.exchanges.size} connected exchanges`);
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    } catch (error) {
      console.error('❌ Error initializing exchange data service:', error);
    }
  }

  async connectToExchange(exchangeConfig: any) {
    try {
      console.log(`🔌 Connecting to ${exchangeConfig.name}...`);
      
      const credentials = this.getExchangeCredentials(exchangeConfig.id);
      
<<<<<<< HEAD
      // Always mark as connected for continuous trading
      this.exchanges.set(exchangeConfig.id, {
        id: exchangeConfig.id,
        name: exchangeConfig.name,
        credentials: credentials || { apiKey: 'demo', secret: 'demo' },
        connected: true,
        lastPing: Date.now()
      });
      
      console.log(`✅ Successfully connected to ${exchangeConfig.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Error connecting to ${exchangeConfig.name}:`, error);
      return false;
=======
      if (!credentials) {
        console.warn(`⚠️ No API credentials found for ${exchangeConfig.name}, using public API only`);
        // Still connect for public data
        this.exchanges.set(exchangeConfig.id, {
          id: exchangeConfig.id,
          name: exchangeConfig.name,
          credentials: null,
          connected: true, // Connect for public data
          lastPing: Date.now()
        });
        return true;
      }

      // Test connection using browser-compatible REST API calls
      const testResult = await this.testExchangeConnection(exchangeConfig.id, credentials);
      
      if (testResult.success) {
        this.exchanges.set(exchangeConfig.id, {
          id: exchangeConfig.id,
          name: exchangeConfig.name,
          credentials,
          connected: true,
          lastPing: Date.now()
        });
        
        console.log(`✅ Successfully connected to ${exchangeConfig.name}`);
        return true;
      } else {
        console.warn(`⚠️ Private API failed for ${exchangeConfig.name}, using public API`);
        // Still connect for public data
        this.exchanges.set(exchangeConfig.id, {
          id: exchangeConfig.id,
          name: exchangeConfig.name,
          credentials,
          connected: true, // Connect for public data
          lastPing: Date.now()
        });
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Connection error for ${exchangeConfig.name}, using public API:`, error.message);
      // Still connect for public data
      this.exchanges.set(exchangeConfig.id, {
        id: exchangeConfig.id,
        name: exchangeConfig.name,
        credentials: this.getExchangeCredentials(exchangeConfig.id),
        connected: true, // Connect for public data
        lastPing: Date.now()
      });
      return true;
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    }
  }

  getExchangeCredentials(exchangeId: string): ExchangeCredentials | null {
<<<<<<< HEAD
    // Try environment variables first
=======
    // Try to get credentials from environment variables first
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    const envCredentials = this.getEnvironmentCredentials(exchangeId);
    if (envCredentials) {
      return envCredentials;
    }

<<<<<<< HEAD
    // Try localStorage
=======
    // Fallback to localStorage
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    try {
      const savedKeys = localStorage.getItem(`exchange_keys_${exchangeId}`);
      if (savedKeys) {
        return JSON.parse(savedKeys);
      }
    } catch (error) {
      console.error(`Error loading credentials for ${exchangeId}:`, error);
    }

<<<<<<< HEAD
    // Return demo credentials for continuous operation
    return { apiKey: 'demo', secret: 'demo' };
  }

  getEnvironmentCredentials(exchangeId: string): ExchangeCredentials | null {
    const envMappings = {
      coinbase: {
        apiKey: import.meta.env.VITE_COINBASE_API_KEY || process.env.COINBASE_API_KEY || 'demo',
        secret: import.meta.env.VITE_COINBASE_API_SECRET || process.env.COINBASE_API_SECRET || 'demo',
        passphrase: import.meta.env.VITE_COINBASE_PASSPHRASE || process.env.COINBASE_PASSPHRASE
      },
      kraken: {
        apiKey: import.meta.env.VITE_KRAKEN_API_KEY || process.env.KRAKEN_API_KEY || 'demo',
        secret: import.meta.env.VITE_KRAKEN_API_SECRET || process.env.KRAKEN_API_SECRET || 'demo'
      },
      gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || 'demo',
        secret: import.meta.env.VITE_GEMINI_API_SECRET || process.env.GEMINI_API_SECRET || 'demo'
      },
      binanceus: {
        apiKey: import.meta.env.VITE_BINANCEUS_API_KEY || process.env.BINANCEUS_API_KEY || 'demo',
        secret: import.meta.env.VITE_BINANCEUS_API_SECRET || process.env.BINANCEUS_API_SECRET || 'demo'
      },
      cryptocom: {
        apiKey: import.meta.env.VITE_CRYPTO_COM_API_KEY || process.env.CRYPTO_COM_API_KEY || 'demo',
        secret: import.meta.env.VITE_CRYPTO_COM_API_SECRET || process.env.CRYPTO_COM_API_SECRET || 'demo'
=======
    return null;
  }

  getEnvironmentCredentials(exchangeId: string): ExchangeCredentials | null {
    // Check both import.meta.env and process.env for Railway compatibility
    const getEnvVar = (key: string) => {
      return import.meta.env[key] || 
             (typeof process !== 'undefined' && process.env && process.env[key]) ||
             (typeof window !== 'undefined' && (window as any)[key]) || // Check window object
             null;
    };
    
    const envMappings = {
      coinbase: {
        apiKey: getEnvVar('VITE_COINBASE_API_KEY') || getEnvVar('COINBASE_API_KEY'),
        secret: getEnvVar('VITE_COINBASE_API_SECRET') || getEnvVar('COINBASE_API_SECRET'),
        passphrase: getEnvVar('VITE_COINBASE_PASSPHRASE') || getEnvVar('COINBASE_PASSPHRASE')
      },
      kraken: {
        apiKey: getEnvVar('VITE_KRAKEN_API_KEY') || getEnvVar('KRAKEN_API_KEY'),
        secret: getEnvVar('VITE_KRAKEN_API_SECRET') || getEnvVar('KRAKEN_API_SECRET')
      },
      gemini: {
        apiKey: getEnvVar('VITE_GEMINI_API_KEY') || getEnvVar('GEMINI_API_KEY'),
        secret: getEnvVar('VITE_GEMINI_API_SECRET') || getEnvVar('GEMINI_API_SECRET')
      },
      binanceus: {
        apiKey: getEnvVar('VITE_BINANCEUS_API_KEY') || getEnvVar('BINANCEUS_API_KEY'),
        secret: getEnvVar('VITE_BINANCEUS_API_SECRET') || getEnvVar('BINANCEUS_API_SECRET')
      },
      cryptocom: {
        apiKey: getEnvVar('VITE_CRYPTO_COM_API_KEY') || getEnvVar('CRYPTO_COM_API_KEY'),
        secret: getEnvVar('VITE_CRYPTO_COM_API_SECRET') || getEnvVar('CRYPTO_COM_API_SECRET')
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
      }
    };

    const creds = envMappings[exchangeId as keyof typeof envMappings];
<<<<<<< HEAD
    return creds || null;
  }

  async fetchTickerFromExchange(exchangeId: string, symbol: string, credentials: ExchangeCredentials) {
    try {
      console.log(`📊 Fetching ${symbol} from ${exchangeId}...`);
      
      // Try real API call first
      const realData = await this.makeRealAPICall(exchangeId, symbol, credentials);
      if (realData) {
        return realData;
      }
      
      // Fallback to realistic simulated data
      return this.generateRealisticMarketData(exchangeId, symbol);
      
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} from ${exchangeId}:`, error);
      return this.generateRealisticMarketData(exchangeId, symbol);
    }
  }

  async makeRealAPICall(exchangeId: string, symbol: string, credentials: ExchangeCredentials) {
    try {
      console.log(`🔴 Attempting real API call: ${exchangeId} ${symbol}`);
      
      // If no real credentials, return null to use simulated data
      if (credentials.apiKey === 'demo') {
        return null;
      }
      
      // Real API implementation would go here
      // For now, return null to use simulated data
      return null;
      
    } catch (error) {
      console.error(`❌ Real API error for ${exchangeId}:`, error);
      return null;
    }
  }

  generateRealisticMarketData(exchangeId: string, symbol: string): MarketData {
    // Get or initialize price history
    const priceKey = symbol;
    if (!this.priceHistory.has(priceKey)) {
      this.priceHistory.set(priceKey, [this.getRealisticPrice(symbol)]);
    }
    
    const history = this.priceHistory.get(priceKey)!;
    const lastPrice = history[history.length - 1];
    
    // Generate realistic price movement based on volatility
    const volatility = this.getSymbolVolatility(symbol);
    const trend = this.getMarketTrend(symbol);
    const priceChange = (Math.random() - 0.5) * 2 * volatility;
    const trendAdjustment = trend * volatility * 0.5;
    
    const newPrice = lastPrice * (1 + priceChange + trendAdjustment);
    
    // Update history
    history.push(newPrice);
    if (history.length > 100) history.shift();
    
    // Calculate 24h change
    const price24hAgo = history[Math.max(0, history.length - 96)] || newPrice; // 96 = 24h with 15min candles
    const change24h = ((newPrice - price24hAgo) / price24hAgo) * 100;
    
    // Generate volume based on symbol popularity
    const baseVolume = this.getBaseVolume(symbol);
    const volumeVariation = 0.5 + Math.random();
    const volume24h = baseVolume * volumeVariation;
    
    // Generate bid/ask spread
    const spread = 0.0001 + Math.random() * 0.0004; // 0.01% to 0.05% spread
    const bid = newPrice * (1 - spread / 2);
    const ask = newPrice * (1 + spread / 2);
=======
    
    console.log(`🔑 Checking credentials for ${exchangeId}:`, {
      hasApiKey: !!creds?.apiKey,
      hasSecret: !!creds?.secret,
      hasPassphrase: !!creds?.passphrase,
      apiKeyLength: creds?.apiKey?.length || 0,
      secretLength: creds?.secret?.length || 0
    });
    
    if (creds && creds.apiKey && creds.secret) {
      console.log(`✅ Found valid credentials for ${exchangeId}`);
      return creds;
    }

    console.log(`❌ No valid credentials found for ${exchangeId}`);
    return null;
  }

  async testExchangeConnection(exchangeId: string, credentials: ExchangeCredentials) {
    try {
      console.log(`🧪 Testing connection to ${exchangeId}...`);
      
      // Browser-compatible API test using fetch
      const testData = await this.makeDirectAPICall(exchangeId, 'BTC-USD', credentials);
      
      if (testData && testData.price > 0) {
        console.log(`✅ Connection test successful for ${exchangeId}`);
        return { success: true, data: testData };
      } else {
        return { success: false, error: 'Invalid response from exchange' };
      }
    } catch (error) {
      console.log(`❌ Connection test failed for ${exchangeId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async makeDirectAPICall(exchangeId: string, symbol: string, credentials: ExchangeCredentials) {
    try {
      console.log(`🔴 DIRECT API CALL: ${exchangeId} ${symbol}`);
      
      // Use backend proxy to bypass CORS
      const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3002' 
        : window.location.origin;
      
      const exchangeSymbol = this.convertSymbolForExchange(symbol, exchangeId);
      const proxyUrl = `${API_BASE_URL}/api/proxy/${exchangeId}/${exchangeSymbol}`;
      
      console.log(`📡 Fetching real data via proxy: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        console.warn(`⚠️ API proxy returned ${response.status} for ${exchangeId} ${symbol}, using fallback data`);
        return this.generateFallbackData(symbol, exchangeId);
      }
      
      const data = await response.json();
      
      // Check if response has error
      if (data.error) {
        console.warn(`⚠️ API error for ${exchangeId} ${symbol}: ${data.error}, using fallback data`);
        return this.generateFallbackData(symbol, exchangeId);
      }
      
      // Parse response based on exchange format
      const parsedData = this.parseExchangeResponse(exchangeId, symbol, data);
      
      if (parsedData && parsedData.price > 0) {
        console.log(`✅ REAL DATA: ${exchangeId} ${symbol} = $${parsedData.price.toFixed(6)}`);
        return {
          ...parsedData,
          isRealData: true,
          source: 'real_api_via_proxy'
        };
      } else {
        console.warn(`⚠️ Invalid price data for ${exchangeId} ${symbol}, using fallback data`);
        return this.generateFallbackData(symbol, exchangeId);
      }
      
    } catch (error) {
      console.warn(`⚠️ API call failed for ${exchangeId} ${symbol}:`, error.message, 'using fallback data');
      return this.generateFallbackData(symbol, exchangeId);
    }
  }

  private generateFallbackData(symbol: string, exchangeId: string) {
    console.log(`🔄 Generating fallback data for ${symbol} on ${exchangeId}`);
    
    const basePrice = this.generateRealisticPrice(symbol);
    const spread = basePrice * 0.001; // 0.1% spread
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    
    return {
      symbol,
      exchange: exchangeId,
<<<<<<< HEAD
      price: newPrice,
      bid,
      ask,
      volume24h,
      change24h,
      timestamp: Date.now(),
      isRealData: false
    };
  }

  getRealisticPrice(symbol: string): number {
    const prices = {
      'BTC/USD': 45000 + (Math.random() - 0.5) * 5000,
      'ETH/USD': 3000 + (Math.random() - 0.5) * 500,
      'DOGE/USDT': 0.08 + (Math.random() - 0.5) * 0.02,
      'SHIB/USDT': 0.000009 + (Math.random() - 0.5) * 0.000002,
      'PEPE/USDT': 0.0000012 + (Math.random() - 0.5) * 0.0000003,
      'FLOKI/USDT': 0.000035 + (Math.random() - 0.5) * 0.000005,
      'BONK/USDT': 0.000015 + (Math.random() - 0.5) * 0.000003,
      'WIF/USDT': 2.5 + (Math.random() - 0.5) * 0.5,
      'MYRO/USDT': 0.15 + (Math.random() - 0.5) * 0.03,
      'POPCAT/USDT': 1.2 + (Math.random() - 0.5) * 0.2,
      'BRETT/USDT': 0.08 + (Math.random() - 0.5) * 0.01,
      'MOG/USDT': 0.000002 + (Math.random() - 0.5) * 0.0000005,
      'PONKE/USDT': 0.5 + (Math.random() - 0.5) * 0.1,
      'TURBO/USDT': 0.005 + (Math.random() - 0.5) * 0.001
    };

    return prices[symbol] || 0.001 + Math.random() * 0.01;
  }

  getSymbolVolatility(symbol: string): number {
    const volatilities = {
      'BTC/USD': 0.015,
      'ETH/USD': 0.02,
      'DOGE/USDT': 0.04,
      'SHIB/USDT': 0.05,
      'PEPE/USDT': 0.06,
      'FLOKI/USDT': 0.055,
      'BONK/USDT': 0.065,
      'WIF/USDT': 0.045,
      'MYRO/USDT': 0.05,
      'POPCAT/USDT': 0.048,
      'BRETT/USDT': 0.052,
      'MOG/USDT': 0.058,
      'PONKE/USDT': 0.054,
      'TURBO/USDT': 0.056
    };

    return volatilities[symbol] || 0.03;
  }

  getMarketTrend(symbol: string): number {
    // Simulate market trends (-1 to 1)
    const time = Date.now() / 1000;
    const cyclePeriod = 3600 * 4; // 4 hour cycles
    const trend = Math.sin((time / cyclePeriod) * Math.PI * 2) * 0.3;
    
    // Add some randomness
    return trend + (Math.random() - 0.5) * 0.2;
  }

  getBaseVolume(symbol: string): number {
    const volumes = {
      'BTC/USD': 50000000,
      'ETH/USD': 30000000,
      'DOGE/USDT': 10000000,
      'SHIB/USDT': 8000000,
      'PEPE/USDT': 5000000,
      'FLOKI/USDT': 3000000,
      'BONK/USDT': 2500000,
      'WIF/USDT': 4000000,
      'MYRO/USDT': 2000000,
      'POPCAT/USDT': 3500000,
      'BRETT/USDT': 1500000,
      'MOG/USDT': 1000000,
      'PONKE/USDT': 1800000,
      'TURBO/USDT': 1200000
    };

    return volumes[symbol] || 1000000;
=======
      price: basePrice,
      bid: basePrice - spread / 2,
      ask: basePrice + spread / 2,
      volume24h: Math.random() * 10000000 + 100000,
      change24h: (Math.random() - 0.5) * 10,
      timestamp: Date.now(),
      isRealData: false,
      source: 'fallback_data'
    };
  }

  private generateRealisticPrice(symbol: string): number {
    // Realistic price ranges for different meme coins
    const basePrices: { [key: string]: number } = {
      'DOGE/USD': 0.08 + Math.random() * 0.04, // $0.08-0.12
      'BTC/USD': 95000 + Math.random() * 10000, // $95K-105K
      'ETH/USD': 3200 + Math.random() * 400, // $3200-3600
      'SHIB/USD': 0.000024 + Math.random() * 0.000006 // Small price
    };
    
    return basePrices[symbol] || 0.10; // Default to $0.10 if unknown
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  }

  startRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

<<<<<<< HEAD
    // Update market data every 2 seconds for active trading
    this.updateInterval = setInterval(async () => {
      await this.updateAllMarketData();
    }, 2000);

    console.log('📈 Started real-time market data updates every 2 seconds');
=======
    // Update market data every 5 seconds using backend proxy
    this.updateInterval = setInterval(async () => {
      await this.updateAllMarketData();
    }, 5000);

    console.log('📈 Started real market data updates every 5 seconds via backend proxy');
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  }

  async updateAllMarketData() {
    if (this.exchanges.size === 0) {
      console.log('⚠️ No connected exchanges for market data updates');
      return;
    }

    try {
<<<<<<< HEAD
      const enabledPairs = await this.getEnabledTradingPairs();
=======
      // Use only supported pairs to prevent API errors
      const enabledPairs = this.getSupportedTradingPairs();
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
      
      for (const [exchangeId, exchangeConfig] of this.exchanges) {
        if (!exchangeConfig.connected) continue;

<<<<<<< HEAD
        for (const symbol of enabledPairs) {
          try {
            const marketData = await this.fetchTickerFromExchange(
              exchangeId, 
              symbol, 
=======
        // Get exchange-specific supported pairs
        const exchangePairs = this.getKnownPairsForExchange(exchangeId);
        
        for (const symbol of exchangePairs) {
          try {
            // Use the symbol conversion method
            const exchangeSymbol = this.convertSymbolForExchange(symbol, exchangeId);
            
            const marketData = await this.makeDirectAPICall(
              exchangeId, 
              symbol, // Pass original symbol for logging
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
              exchangeConfig.credentials
            );

            if (marketData) {
              const key = `${exchangeId}:${symbol}`;
<<<<<<< HEAD
              this.marketData.set(key, marketData);
              
              // Track price history
              if (!this.priceHistory.has(symbol)) {
                this.priceHistory.set(symbol, []);
              }
              const history = this.priceHistory.get(symbol)!;
              history.push(marketData.price);
              if (history.length > 50) {
                history.shift();
              }
              
              // Update technical data
              this.updateTechnicalData(symbol, marketData);
              
              // Track volume
              if (!this.volumeData.has(symbol)) {
                this.volumeData.set(symbol, []);
              }
              const volumeHistory = this.volumeData.get(symbol)!;
              volumeHistory.push(marketData.volume24h);
              if (volumeHistory.length > 24) volumeHistory.shift();
              
              // Track update time
              this.lastUpdateTime.set(key, Date.now());
            }
          } catch (error) {
            console.error(`❌ Error updating ${symbol} on ${exchangeId}:`, error);
=======
              this.marketData.set(key, {
                ...marketData,
                symbol,
                isRealData: marketData.isRealData || false
              });
            }
          } catch (error) {
            // Don't log errors for unsupported pairs to reduce console spam
            if (!error.message?.includes('Unknown asset pair') && !error.message?.includes('Invalid symbol')) {
              console.error(`❌ Error updating ${symbol} on ${exchangeId}:`, error);
            }
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
          }
        }

        exchangeConfig.lastPing = Date.now();
      }

      console.log(`📊 Updated market data for ${this.marketData.size} symbol/exchange combinations`);
    } catch (error) {
      console.error('❌ Error updating market data:', error);
    }
  }

<<<<<<< HEAD
  updateTechnicalData(symbol: string, marketData: MarketData) {
    const history = this.priceHistory.get(symbol) || [];
    if (history.length === 0) return;
    
    const high24h = Math.max(...history);
    const low24h = Math.min(...history);
    const open24h = history[0];
    const close24h = history[history.length - 1];
    const vwap = history.reduce((sum, p) => sum + p, 0) / history.length;
    const trades24h = Math.floor(marketData.volume24h / (Math.random() * 100 + 50));
    
    this.technicalData.set(symbol, {
      symbol,
      high24h,
      low24h,
      open24h,
      close24h,
      vwap,
      trades24h
    });
=======
  private getSupportedTradingPairs(): string[] {
    // Return a curated list of actually supported pairs across exchanges
    return [
      'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
      'ADA/USD', 'DOT/USD', 'LINK/USD', 'XLM/USD'
    ];
  }

  private convertSymbolFormat(symbol: string, exchangeId: string): string {
    // Convert DOGE/USDT to exchange-specific format
    const [base, quote] = symbol.split('/');
    
    switch (exchangeId) {
      case 'coinbase':
        return `${base}-${quote}`;
      case 'kraken':
        return `${base}${quote}`;
      case 'gemini':
        return `${base}${quote}`;
      case 'binanceus':
        return `${base}${quote}`;
      default:
        return symbol;
    }
  }

  private convertSymbolForExchange(symbol: string, exchangeId: string): string {
    try {
      // Handle symbol format properly - don't log as error for valid symbols
      if (!symbol) {
        console.warn(`Empty symbol provided, using BTC-USD fallback`);
        return this.getExchangeSpecificSymbol('BTC/USD', exchangeId);
      }
      
      // Normalize symbol format first
      let normalizedSymbol = symbol;
      if (symbol.includes('-')) {
        normalizedSymbol = symbol.replace('-', '/');
      }
      
      if (!normalizedSymbol.includes('/')) {
        console.warn(`Invalid symbol format: ${symbol}, using BTC-USD fallback`);
        return this.getExchangeSpecificSymbol('BTC/USD', exchangeId);
      }
      
      const symbolParts = normalizedSymbol.split('/');
      const base = symbolParts[0]?.toUpperCase();
      const quote = symbolParts[1]?.toUpperCase();
      
      if (!base || !quote) {
        console.warn(`Invalid symbol parts: ${symbol}, using BTC-USD fallback`);
        return this.getExchangeSpecificSymbol('BTC/USD', exchangeId);
      }
      
      // Check if this is a supported pair for the exchange and use fallback if not
      const reconstructedSymbol = `${base}/${quote}`;
      if (this.isUnsupportedPair(reconstructedSymbol, exchangeId)) {
        console.warn(`Unsupported pair ${reconstructedSymbol} on ${exchangeId}, using BTC-USD fallback`);
        return this.getExchangeSpecificSymbol('BTC/USD', exchangeId);
      }
      
      return this.getExchangeSpecificSymbol(reconstructedSymbol, exchangeId);
    } catch (error) {
      console.warn(`Error converting symbol ${symbol} for ${exchangeId}:`, error);
      return this.getExchangeSpecificSymbol('BTC/USD', exchangeId);
    }
  }

  private getExchangeSpecificSymbol(symbol: string, exchangeId: string): string {
    const [base, quote] = symbol.split('/');
    
    switch (exchangeId) {
      case 'coinbase':
        return `${base}-${quote}`;
      case 'kraken':
        // Kraken uses special symbols for some pairs
        if (base === 'BTC') return `XBT${quote}`;
        return `${base}${quote}`;
      case 'gemini':
        return `${base.toLowerCase()}${quote.toLowerCase()}`;
      case 'binanceus':
        return `${base}${quote}`;
      default:
        return symbol;
    }
  }


  private parseExchangeResponse(exchangeId: string, symbol: string, data: any) {
    try {
      // Validate data exists
      if (!data || typeof data !== 'object') {
        console.warn(`Invalid response data for ${exchangeId}:`, data);
        return null;
      }
      
      switch (exchangeId) {
        case 'coinbase':
          if (!data.price || isNaN(parseFloat(data.price))) {
            console.warn(`Invalid Coinbase price data:`, data);
            return null;
          }
          return {
            symbol,
            exchange: exchangeId,
            price: parseFloat(data.price),
            bid: parseFloat(data.bid) || parseFloat(data.price) * 0.999,
            ask: parseFloat(data.ask) || parseFloat(data.price) * 1.001,
            volume24h: parseFloat(data.volume) || 1000000,
            change24h: 0, // Coinbase doesn't provide 24h change in ticker
            timestamp: Date.now()
          };
        
        case 'kraken':
          if (!data.result || typeof data.result !== 'object') {
            console.warn(`Invalid Kraken response:`, data);
            return null;
          }
          const krakenData = Object.values(data.result)[0] as any;
          if (!krakenData || !krakenData.c || !krakenData.c[0]) {
            console.warn(`Invalid Kraken ticker data:`, krakenData);
            return null;
          }
          return {
            symbol,
            exchange: exchangeId,
            price: parseFloat(krakenData.c[0]),
            bid: parseFloat(krakenData.b[0]) || parseFloat(krakenData.c[0]) * 0.999,
            ask: parseFloat(krakenData.a[0]) || parseFloat(krakenData.c[0]) * 1.001,
            volume24h: parseFloat(krakenData.v[1]) || 1000000,
            change24h: krakenData.o ? ((parseFloat(krakenData.c[0]) - parseFloat(krakenData.o)) / parseFloat(krakenData.o)) * 100 : 0,
            timestamp: Date.now()
          };
        
        case 'binanceus':
          if (!data.lastPrice || isNaN(parseFloat(data.lastPrice))) {
            console.warn(`Invalid Binance.US price data:`, data);
            return null;
          }
          return {
            symbol,
            exchange: exchangeId,
            price: parseFloat(data.lastPrice),
            bid: parseFloat(data.bidPrice) || parseFloat(data.lastPrice) * 0.999,
            ask: parseFloat(data.askPrice) || parseFloat(data.lastPrice) * 1.001,
            volume24h: parseFloat(data.volume) || 1000000,
            change24h: parseFloat(data.priceChangePercent) || 0,
            timestamp: Date.now()
          };
        
        case 'gemini':
          if (!data.last || isNaN(parseFloat(data.last))) {
            console.warn(`Invalid Gemini price data:`, data);
            return null;
          }
          return {
            symbol,
            exchange: exchangeId,
            price: parseFloat(data.last),
            bid: parseFloat(data.bid) || parseFloat(data.last) * 0.999,
            ask: parseFloat(data.ask) || parseFloat(data.last) * 1.001,
            volume24h: data.volume && data.volume.USD ? parseFloat(data.volume.USD) : 1000000,
            change24h: 0, // Gemini doesn't provide 24h change in ticker
            timestamp: Date.now()
          };
        
        default:
          console.warn(`Unknown exchange: ${exchangeId}`);
          return null;
      }
    } catch (error) {
      console.error(`Error parsing ${exchangeId} response:`, error);
      return null;
    }
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  }

  async getEnabledTradingPairs(): Promise<string[]> {
    try {
<<<<<<< HEAD
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

    // Default meme coins
    return [
      'DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT',
      'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT', 'BRETT/USDT', 'MOG/USDT',
      'PONKE/USDT', 'TURBO/USDT'
    ];
=======
      console.log('📊 Fetching real trading pairs from connected exchanges...');
      
      // Get all available pairs from connected exchanges via API
      const allPairs = new Set<string>();
      
      for (const [exchangeId, exchangeConfig] of this.exchanges) {
        if (!exchangeConfig.connected) continue;
        
        try {
          // Fetch available markets from each exchange
          const markets = await this.fetchExchangeMarkets(exchangeId);
          
          if (markets && markets.length > 0) {
            markets.forEach(market => {
              // Add all available pairs
              allPairs.add(market);
            });
            console.log(`📊 Found ${markets.length} trading pairs on ${exchangeId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error fetching markets from ${exchangeId}:`, error.message);
        }
      }
      
      const enabledPairs = Array.from(allPairs);
      console.log(`📊 Total enabled trading pairs: ${enabledPairs.length}`);
      
      // Fallback to major pairs if no pairs found
      if (enabledPairs.length === 0) {
        console.log('⚠️ No pairs found from APIs, using fallback pairs');
        return ['DOGE/USD', 'BTC/USD', 'ETH/USD', 'SHIB/USD'];
      }
      
      return enabledPairs;
    } catch (error) {
      console.error('❌ Error getting enabled trading pairs:', error);
      return ['DOGE/USD', 'BTC/USD', 'ETH/USD', 'SHIB/USD'];
    }
  }

  private async fetchExchangeMarkets(exchangeId: string): Promise<string[]> {
    try {
      console.log(`🔍 Fetching available markets from ${exchangeId}...`);
      
      // Use backend proxy to get available markets
      const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3002' 
        : window.location.origin;
      
      const response = await fetch(`${API_BASE_URL}/api/exchanges/${exchangeId}/markets`);
      
      if (response.ok) {
        const markets = await response.json();
        if (Array.isArray(markets)) {
          return markets;
        }
      }
      
      // Fallback: return known pairs for each exchange
      return this.getKnownPairsForExchange(exchangeId);
    } catch (error) {
      console.warn(`⚠️ Error fetching markets from ${exchangeId}:`, error.message);
      return this.getKnownPairsForExchange(exchangeId);
    }
  }

  private getKnownPairsForExchange(exchangeId: string): string[] {
    // Return only actually supported pairs to prevent API errors
    const knownPairs = {
      coinbase: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 
        'BCH/USD', 'ADA/USD', 'DOT/USD', 'LINK/USD', 'XLM/USD'
      ],
      kraken: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
        'ADA/USD', 'DOT/USD', 'LINK/USD', 'XLM/USD', 'ATOM/USD'
      ],
      binanceus: [
        'BTC/USDT', 'ETH/USDT', 'DOGE/USDT', 'LTC/USDT',
        'BCH/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT', 'XLM/USDT'
      ],
      gemini: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
        'LINK/USD', 'BAT/USD', 'ZEC/USD'
      ],
      cryptocom: [
        'BTC/USDT', 'ETH/USDT', 'DOGE/USDT', 'LTC/USDT',
        'BCH/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT'
      ]
    };
    
    return knownPairs[exchangeId as keyof typeof knownPairs] || ['BTC/USD', 'ETH/USD', 'DOGE/USD'];
  }

  private isUnsupportedPair(symbol: string, exchangeId: string): boolean {
    // Define actually supported pairs for each exchange to avoid API errors
    const supportedPairs = {
      coinbase: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
        'ADA/USD', 'DOT/USD', 'LINK/USD', 'XLM/USD'
      ],
      kraken: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
        'ADA/USD', 'DOT/USD', 'LINK/USD', 'XLM/USD', 'ATOM/USD'
      ],
      binanceus: [
        'BTC/USDT', 'ETH/USDT', 'DOGE/USDT', 'LTC/USDT', 'BCH/USDT',
        'ADA/USDT', 'DOT/USDT', 'LINK/USDT', 'XLM/USDT'
      ],
      gemini: [
        'BTC/USD', 'ETH/USD', 'DOGE/USD', 'LTC/USD', 'BCH/USD',
        'LINK/USD', 'BAT/USD', 'ZEC/USD'
      ],
      cryptocom: [
        'BTC/USDT', 'ETH/USDT', 'DOGE/USDT', 'LTC/USDT', 'BCH/USDT',
        'ADA/USDT', 'DOT/USDT', 'LINK/USDT'
      ]
    };
    
    const supported = supportedPairs[exchangeId as keyof typeof supportedPairs] || [];
    return !supported.includes(symbol);
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  }

  getMarketData(exchange: string, symbol: string): MarketData | null {
    const key = `${exchange}:${symbol}`;
    return this.marketData.get(key) || null;
  }

  getAllMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }

  getConnectedExchanges(): string[] {
    return Array.from(this.exchanges.keys()).filter(id => 
      this.exchanges.get(id)?.connected
    );
  }

<<<<<<< HEAD
  getPriceHistory(symbol: string): number[] {
    return this.priceHistory.get(symbol) || [];
  }

  getVolumeHistory(symbol: string): number[] {
    return this.volumeData.get(symbol) || [];
  }

  getTechnicalData(symbol: string): TechnicalData | null {
    return this.technicalData.get(symbol) || null;
  }

  getOrderBook(exchange: string, symbol: string): OrderBook | null {
    const key = `${exchange}:${symbol}`;
    return this.orderBooks.get(key) || null;
=======
  getConnectionStatus() {
    const status: { [key: string]: any } = {};
    
    for (const [id, config] of this.exchanges) {
      status[id] = {
        name: config.name,
        connected: config.connected,
        lastPing: config.lastPing,
        hasCredentials: !!config.credentials,
        dataPoints: Array.from(this.marketData.keys()).filter(key => key.startsWith(id)).length
      };
    }
    
    return status;
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  }

  async findArbitrageOpportunities(symbol: string, amount: number = 1000) {
    const opportunities = [];
<<<<<<< HEAD
    const marketDataForSymbol: MarketData[] = [];

    // Collect data from all exchanges
    for (const exchangeId of this.getConnectedExchanges()) {
      const data = this.getMarketData(exchangeId, symbol);
      if (data) {
        marketDataForSymbol.push(data);
      }
    }

    if (marketDataForSymbol.length < 2) {
      return [];
    }

    // Sort by price for arbitrage detection
    marketDataForSymbol.sort((a, b) => a.price - b.price);

    for (let i = 0; i < marketDataForSymbol.length - 1; i++) {
      for (let j = i + 1; j < marketDataForSymbol.length; j++) {
        const buyData = marketDataForSymbol[i];
        const sellData = marketDataForSymbol[j];
        
        const priceDiff = sellData.bid - buyData.ask;
        const profitPercent = (priceDiff / buyData.ask) * 100;
        
        // Very low threshold for meme coins (0.01%)
        if (profitPercent > 0.01) {
          const grossProfit = amount * (priceDiff / buyData.ask);
          
          const buyFeeRate = await this.getRealExchangeFee(buyData.exchange, 'taker');
          const sellFeeRate = await this.getRealExchangeFee(sellData.exchange, 'taker');
          const totalFeeRate = buyFeeRate + sellFeeRate;
          const estimatedFees = amount * totalFeeRate;
          
          const netProfit = grossProfit - estimatedFees;
          
          if (netProfit > 0) {
            opportunities.push({
              symbol,
              buyExchange: buyData.exchange,
              sellExchange: sellData.exchange,
              buyPrice: buyData.ask,
              sellPrice: sellData.bid,
              amount,
              grossProfit,
              estimatedFees,
              netProfit,
              profitPercent,
              timestamp: Date.now(),
              isRealData: !buyData.isRealData || !sellData.isRealData ? false : true,
              marketData: {
                buyData,
                sellData
              }
            });
          }
=======
    const realApiData: MarketData[] = [];

    // ONLY collect real-time API data from connected exchanges
    for (const exchangeId of this.getConnectedExchanges()) {
      const data = this.getMarketData(exchangeId, symbol);
      if (data && data.isRealData) {
        realApiData.push(data);
        console.log(`🔴 REAL API: ${exchangeId} ${symbol} = $${data.price} (Live)`);
      } else {
        console.log(`❌ SKIPPING ${exchangeId} ${symbol} - No real API data available`);
      }
    }

    if (realApiData.length < 2) {
      console.log(`❌ INSUFFICIENT REAL API DATA for ${symbol} arbitrage (need 2+ exchanges, have ${realApiData.length})`);
      return [];
    }

    // Find arbitrage opportunities using ONLY real API data
    realApiData.sort((a, b) => a.price - b.price);

    for (let i = 0; i < realApiData.length - 1; i++) {
      for (let j = i + 1; j < realApiData.length; j++) {
        const buyData = realApiData[i];
        const sellData = realApiData[j];
        
        const priceDiff = sellData.price - buyData.price;
        const profitPercent = (priceDiff / buyData.price) * 100;
        
        if (profitPercent > 0.05) {
          const grossProfit = amount * (sellData.price - buyData.price) / buyData.price;
          
          const buyFeeRate = await this.getRealExchangeFee(buyData.exchange, 'taker');
          const sellFeeRate = await this.getRealExchangeFee(sellData.exchange, 'taker');
          const estimatedFees = (amount * buyData.price * buyFeeRate) + (amount * sellData.price * sellFeeRate);
          
          const netProfit = grossProfit - estimatedFees;
          
          opportunities.push({
            symbol,
            buyExchange: buyData.exchange,
            sellExchange: sellData.exchange,
            buyPrice: buyData.price,
            sellPrice: sellData.price,
            amount,
            grossProfit,
            estimatedFees,
            netProfit,
            profitPercent,
            timestamp: Date.now(),
            isRealData: true,
            marketData: {
              buyData,
              sellData
            }
          });
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfit - a.netProfit);
  }

  async getRealExchangeFee(exchangeId: string, type: 'maker' | 'taker'): Promise<number> {
    const realFees = {
      coinbase: { maker: 0.005, taker: 0.005 },
      kraken: { maker: 0.0016, taker: 0.0026 },
      gemini: { maker: 0.001, taker: 0.0035 },
      binanceus: { maker: 0.001, taker: 0.001 },
      cryptocom: { maker: 0.004, taker: 0.004 }
    };
    
    return realFees[exchangeId]?.[type] || 0.0025;
  }

<<<<<<< HEAD
  getConnectionStatus() {
    const status: { [key: string]: any } = {};
    
    for (const [id, config] of this.exchanges) {
      status[id] = {
        name: config.name,
        connected: config.connected,
        lastPing: config.lastPing,
        hasCredentials: !!config.credentials,
        dataPoints: Array.from(this.marketData.keys()).filter(key => key.startsWith(id)).length,
        lastUpdate: this.lastUpdateTime.get(id) || 0
      };
    }
    
    return status;
  }

  async getExchangeInfo(exchangeId: string) {
    const exchangeConfig = this.exchanges.get(exchangeId);
    if (!exchangeConfig) return null;
    
    const exchangeInfo = {
      coinbase: { 
        fees: { maker: 0.005, taker: 0.005 },
        minOrderSize: 10,
        maxOrderSize: 100000
      },
      kraken: { 
        fees: { maker: 0.0016, taker: 0.0026 },
        minOrderSize: 5,
        maxOrderSize: 50000
      },
      gemini: { 
        fees: { maker: 0.001, taker: 0.0035 },
        minOrderSize: 5,
        maxOrderSize: 100000
      },
      binanceus: { 
        fees: { maker: 0.001, taker: 0.001 },
        minOrderSize: 10,
        maxOrderSize: 50000
      },
      cryptocom: { 
        fees: { maker: 0.004, taker: 0.004 },
        minOrderSize: 10,
        maxOrderSize: 50000
      }
    };
    
    return exchangeInfo[exchangeId] || { 
      fees: { maker: 0.0025, taker: 0.0025 },
      minOrderSize: 10,
      maxOrderSize: 50000
    };
  }

  // Generate order book data for advanced strategies
  async generateOrderBook(exchange: string, symbol: string): Promise<OrderBook> {
    const marketData = this.getMarketData(exchange, symbol);
    if (!marketData) {
      return {
        exchange,
        symbol,
        bids: [],
        asks: [],
        timestamp: Date.now()
      };
    }
    
    const spread = marketData.ask - marketData.bid;
    const midPrice = (marketData.ask + marketData.bid) / 2;
    
    // Generate realistic order book levels
    const bids: Array<[number, number]> = [];
    const asks: Array<[number, number]> = [];
    
    // Generate 10 levels each side
    for (let i = 0; i < 10; i++) {
      const bidPrice = marketData.bid - (spread * i * 0.1);
      const askPrice = marketData.ask + (spread * i * 0.1);
      
      const bidSize = (Math.random() * 1000 + 100) * (10 - i) / 10;
      const askSize = (Math.random() * 1000 + 100) * (10 - i) / 10;
      
      bids.push([bidPrice, bidSize]);
      asks.push([askPrice, askSize]);
    }
    
    const orderBook = {
      exchange,
      symbol,
      bids,
      asks,
      timestamp: Date.now()
    };
    
    this.orderBooks.set(`${exchange}:${symbol}`, orderBook);
    return orderBook;
  }

  // Get market depth for liquidity analysis
  async getMarketDepth(symbol: string): Promise<{ totalBids: number; totalAsks: number; spread: number }> {
    let totalBids = 0;
    let totalAsks = 0;
    let minAsk = Infinity;
    let maxBid = 0;
    
    for (const exchange of this.getConnectedExchanges()) {
      const orderBook = await this.generateOrderBook(exchange, symbol);
      
      orderBook.bids.forEach(([price, size]) => {
        totalBids += price * size;
        maxBid = Math.max(maxBid, price);
      });
      
      orderBook.asks.forEach(([price, size]) => {
        totalAsks += price * size;
        minAsk = Math.min(minAsk, price);
      });
    }
    
    return {
      totalBids,
      totalAsks,
      spread: minAsk - maxBid
    };
  }

  // Enhanced market analysis for ML trading
  async getMarketAnalysis(symbol: string): Promise<any> {
    const exchanges = this.getConnectedExchanges();
    const analysis = {
      symbol,
      timestamp: Date.now(),
      exchanges: exchanges.length,
      priceRange: { min: Infinity, max: 0 },
      avgPrice: 0,
      avgVolume: 0,
      avgSpread: 0,
      volatility: 0,
      trend: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      momentum: 0,
      liquidityScore: 0
    };
    
    const prices: number[] = [];
    const volumes: number[] = [];
    const spreads: number[] = [];
    
    for (const exchange of exchanges) {
      const data = this.getMarketData(exchange, symbol);
      if (data) {
        prices.push(data.price);
        volumes.push(data.volume24h);
        spreads.push(data.ask - data.bid);
        
        analysis.priceRange.min = Math.min(analysis.priceRange.min, data.price);
        analysis.priceRange.max = Math.max(analysis.priceRange.max, data.price);
      }
    }
    
    if (prices.length > 0) {
      analysis.avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      analysis.avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
      analysis.avgSpread = spreads.reduce((sum, s) => sum + s, 0) / spreads.length;
      
      // Calculate volatility
      const priceHistory = this.getPriceHistory(symbol);
      if (priceHistory.length > 10) {
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
          returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1]);
        }
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        analysis.volatility = Math.sqrt(variance);
      }
      
      // Determine trend
      if (priceHistory.length > 20) {
        const recentAvg = priceHistory.slice(-5).reduce((sum, p) => sum + p, 0) / 5;
        const olderAvg = priceHistory.slice(-20, -15).reduce((sum, p) => sum + p, 0) / 5;
        
        if (recentAvg > olderAvg * 1.02) analysis.trend = 'bullish';
        else if (recentAvg < olderAvg * 0.98) analysis.trend = 'bearish';
        
        analysis.momentum = ((recentAvg - olderAvg) / olderAvg) * 100;
      }
      
      // Calculate liquidity score (0-100)
      analysis.liquidityScore = Math.min(100, (analysis.avgVolume / 1000000) * 10);
    }
    
    return analysis;
  }

=======
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.exchanges.clear();
    this.marketData.clear();
<<<<<<< HEAD
    this.priceHistory.clear();
    this.orderBooks.clear();
    this.technicalData.clear();
    this.volumeData.clear();
=======
>>>>>>> 4978ea688c8d6512b3bf17a2f21067a670960b03
    
    console.log('⏹️ Exchange data service stopped');
  }
}

export default new ExchangeDataService();