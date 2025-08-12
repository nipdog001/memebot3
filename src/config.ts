// Configuration settings for the application

// Skip server sync to prevent 404 errors
export const SKIP_SERVER_SYNC = true;

// Default starting balance
export const DEFAULT_STARTING_BALANCE = 10000;

// Default live balance
export const DEFAULT_LIVE_BALANCE = 5000;

// Default ML confidence threshold
export const DEFAULT_ML_CONFIDENCE = 75;

// Default position size (%)
export const DEFAULT_POSITION_SIZE = 2.0;

// Default risk level
export const DEFAULT_RISK_LEVEL = 'medium';

// Default trading pairs
export const DEFAULT_TRADING_PAIRS = [
  'DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 'BONK/USDT'
];

// Default exchanges
export const DEFAULT_EXCHANGES = [
  'coinbase', 'kraken', 'binanceus', 'gemini', 'cryptocom'
];

// Default user tier
export const DEFAULT_USER_TIER = 'enterprise';

// Database connection settings
export const DATABASE_SETTINGS = {
  useLocalStorage: true,
  persistTrades: true,
  persistStats: true,
  syncInterval: 30000 // 30 seconds
};

// Trading settings
export const TRADING_SETTINGS = {
  autoSave: true,
  autoSync: true,
  dailyReset: true,
  weeklyRollover: true,
  monthlyRollover: true
};

// Feature flags
export const FEATURE_FLAGS = {
  enableReportGenerator: true,
  enableTierManagement: true,
  enableSocialMedia: true,
  enableMLModels: true,
  enableExchangeManager: true,
  enableTradingPairs: true
};