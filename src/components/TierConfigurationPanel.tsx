import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  Brain, 
  DollarSign, 
  Users, 
  Shield, 
  Globe, 
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  Save,
  Check,
  X,
  AlertTriangle,
  Info,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';

// CCXT-compatible US exchanges with environment variable mapping
const US_EXCHANGES = [
  {
    id: 'coinbase',
    name: 'Coinbase Pro',
    ccxtId: 'coinbasepro',
    requiredCredentials: ['apiKey', 'secret', 'passphrase'],
    envMapping: {
      apiKey: ['COINBASE_API_KEY', 'VITE_COINBASE_API_KEY'],
      secret: ['COINBASE_API_SECRET', 'VITE_COINBASE_API_SECRET'],
      passphrase: ['COINBASE_PASSPHRASE', 'VITE_COINBASE_PASSPHRASE']
    },
    fees: { maker: 0.005, taker: 0.005 },
    supported: true,
    regulation: 'Fully regulated in all US states',
    tradingPairs: 200
  },
  {
    id: 'kraken',
    name: 'Kraken',
    ccxtId: 'kraken',
    requiredCredentials: ['apiKey', 'secret'],
    envMapping: {
      apiKey: ['KRAKEN_API_KEY', 'VITE_KRAKEN_API_KEY'],
      secret: ['KRAKEN_API_SECRET', 'VITE_KRAKEN_API_SECRET']
    },
    fees: { maker: 0.0016, taker: 0.0026 },
    supported: true,
    regulation: 'Licensed in multiple US states',
    tradingPairs: 180
  },
  {
    id: 'gemini',
    name: 'Gemini',
    ccxtId: 'gemini',
    requiredCredentials: ['apiKey', 'secret'],
    envMapping: {
      apiKey: ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY'],
      secret: ['GEMINI_API_SECRET', 'VITE_GEMINI_API_SECRET']
    },
    fees: { maker: 0.001, taker: 0.0035 },
    supported: true,
    regulation: 'NYDFS regulated',
    tradingPairs: 80
  },
  {
    id: 'binanceus',
    name: 'Binance.US',
    ccxtId: 'binanceus',
    requiredCredentials: ['apiKey', 'secret'],
    envMapping: {
      apiKey: ['BINANCEUS_API_KEY', 'VITE_BINANCEUS_API_KEY'],
      secret: ['BINANCEUS_API_SECRET', 'VITE_BINANCEUS_API_SECRET']
    },
    fees: { maker: 0.001, taker: 0.001 },
    supported: true,
    regulation: 'FinCEN registered',
    tradingPairs: 150
  },
  {
    id: 'cryptocom',
    name: 'Crypto.com',
    ccxtId: 'cryptocom',
    requiredCredentials: ['apiKey', 'secret'],
    envMapping: {
      apiKey: ['CRYPTO_COM_API_KEY', 'VITE_CRYPTO_COM_API_KEY'],
      secret: ['CRYPTO_COM_API_SECRET', 'VITE_CRYPTO_COM_API_SECRET']
    },
    fees: { maker: 0.004, taker: 0.004 },
    supported: true,
    regulation: 'Licensed in multiple states',
    tradingPairs: 120
  },
  {
    id: 'bittrex',
    name: 'Bittrex',
    ccxtId: 'bittrex',
    requiredCredentials: ['apiKey', 'secret'],
    envMapping: {
      apiKey: ['BITTREX_API_KEY', 'VITE_BITTREX_API_KEY'],
      secret: ['BITTREX_API_SECRET', 'VITE_BITTREX_API_SECRET']
    },
    fees: { maker: 0.0025, taker: 0.0025 },
    supported: false, // Ceased US operations
    regulation: 'Previously regulated (ceased operations)',
    tradingPairs: 0
  }
];

// Available ML models with realistic descriptions
const AVAILABLE_ML_MODELS = [
  {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'Simple trend analysis using linear relationships',
    category: 'basic',
    accuracy: 72,
    complexity: 'Low'
  },
  {
    id: 'polynomial_regression',
    name: 'Polynomial Regression',
    description: 'Non-linear trend analysis with polynomial curves',
    category: 'basic',
    accuracy: 75,
    complexity: 'Low'
  },
  {
    id: 'moving_average',
    name: 'Moving Average Crossover',
    description: 'Traditional technical analysis using MA crossovers',
    category: 'basic',
    accuracy: 68,
    complexity: 'Low'
  },
  {
    id: 'rsi_momentum',
    name: 'RSI Momentum',
    description: 'Relative Strength Index momentum analysis',
    category: 'intermediate',
    accuracy: 74,
    complexity: 'Medium'
  },
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands',
    description: 'Volatility-based trading signals',
    category: 'intermediate',
    accuracy: 76,
    complexity: 'Medium'
  },
  {
    id: 'macd_signal',
    name: 'MACD Signal',
    description: 'Moving Average Convergence Divergence analysis',
    category: 'intermediate',
    accuracy: 73,
    complexity: 'Medium'
  },
  {
    id: 'lstm_neural',
    name: 'LSTM Neural Network',
    description: 'Long Short-Term Memory deep learning model',
    category: 'advanced',
    accuracy: 82,
    complexity: 'High'
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'Ensemble learning with multiple decision trees',
    category: 'advanced',
    accuracy: 79,
    complexity: 'High'
  },
  {
    id: 'gradient_boosting',
    name: 'Gradient Boosting',
    description: 'Advanced ensemble method with boosting',
    category: 'advanced',
    accuracy: 81,
    complexity: 'High'
  },
  {
    id: 'transformer',
    name: 'Transformer Model',
    description: 'State-of-the-art attention-based neural network',
    category: 'expert',
    accuracy: 85,
    complexity: 'Very High'
  },
  {
    id: 'ensemble_meta',
    name: 'Ensemble Meta-Model',
    description: 'Combines multiple models for superior accuracy',
    category: 'expert',
    accuracy: 87,
    complexity: 'Very High'
  },
  {
    id: 'reinforcement_learning',
    name: 'Reinforcement Learning',
    description: 'Self-learning AI that adapts to market conditions',
    category: 'expert',
    accuracy: 84,
    complexity: 'Very High'
  }
];

// Available features with realistic descriptions
const AVAILABLE_FEATURES = [
  // Trading Features
  {
    id: 'paper_trading',
    name: 'Paper Trading',
    description: 'Risk-free simulation trading',
    category: 'trading',
    icon: TrendingUp,
    essential: true
  },
  {
    id: 'live_trading',
    name: 'Live Trading',
    description: 'Real money trading with connected exchanges',
    category: 'trading',
    icon: DollarSign,
    essential: false
  },
  {
    id: 'multi_exchange_arbitrage',
    name: 'Multi-Exchange Arbitrage',
    description: 'Profit from price differences across exchanges',
    category: 'trading',
    icon: Building2,
    essential: false
  },
  {
    id: 'advanced_order_types',
    name: 'Advanced Order Types',
    description: 'Stop-loss, take-profit, trailing stops',
    category: 'trading',
    icon: Settings,
    essential: false
  },
  {
    id: 'portfolio_rebalancing',
    name: 'Portfolio Rebalancing',
    description: 'Automatic portfolio optimization',
    category: 'trading',
    icon: TrendingUp,
    essential: false
  },
  
  // ML Features
  {
    id: 'basic_ml_models',
    name: 'Basic ML Models',
    description: 'Access to 3 basic machine learning models',
    category: 'ml',
    icon: Brain,
    essential: true
  },
  {
    id: 'intermediate_ml_models',
    name: 'Intermediate ML Models',
    description: 'Access to RSI, Bollinger, MACD models',
    category: 'ml',
    icon: Brain,
    essential: false
  },
  {
    id: 'advanced_ml_models',
    name: 'Advanced ML Models',
    description: 'LSTM, Random Forest, Gradient Boosting',
    category: 'ml',
    icon: Brain,
    essential: false
  },
  {
    id: 'expert_ml_models',
    name: 'Expert ML Models',
    description: 'Transformer, Ensemble, Reinforcement Learning',
    category: 'ml',
    icon: Brain,
    essential: false
  },
  {
    id: 'custom_ml_training',
    name: 'Custom ML Training',
    description: 'Train models on your own data',
    category: 'ml',
    icon: Brain,
    essential: false
  },
  
  // Social Media Features
  {
    id: 'social_monitoring',
    name: 'Social Media Monitoring',
    description: 'Monitor Twitter, Reddit, Telegram for signals',
    category: 'social',
    icon: MessageCircle,
    essential: false
  },
  {
    id: 'sentiment_analysis',
    name: 'AI Sentiment Analysis',
    description: 'Advanced sentiment analysis of social posts',
    category: 'social',
    icon: Brain,
    essential: false
  },
  {
    id: 'influencer_tracking',
    name: 'Influencer Tracking',
    description: 'Track and analyze crypto influencer posts',
    category: 'social',
    icon: Users,
    essential: false
  },
  
  // Risk Management
  {
    id: 'basic_risk_management',
    name: 'Basic Risk Management',
    description: 'Simple stop-loss and position limits',
    category: 'risk',
    icon: Shield,
    essential: true
  },
  {
    id: 'advanced_risk_management',
    name: 'Advanced Risk Management',
    description: 'Portfolio risk analysis and dynamic limits',
    category: 'risk',
    icon: Shield,
    essential: false
  },
  {
    id: 'risk_alerts',
    name: 'Real-time Risk Alerts',
    description: 'Instant notifications for risk events',
    category: 'risk',
    icon: AlertTriangle,
    essential: false
  },
  
  // API & Integration
  {
    id: 'basic_api_access',
    name: 'Basic API Access',
    description: 'Limited API calls for basic integrations',
    category: 'api',
    icon: Globe,
    essential: false
  },
  {
    id: 'unlimited_api_access',
    name: 'Unlimited API Access',
    description: 'Unlimited API calls and webhooks',
    category: 'api',
    icon: Globe,
    essential: false
  },
  
  // Support
  {
    id: 'community_support',
    name: 'Community Support',
    description: 'Access to community forums and guides',
    category: 'support',
    icon: Users,
    essential: true
  },
  {
    id: 'email_support',
    name: 'Email Support',
    description: '24/7 email support with 24h response',
    category: 'support',
    icon: Users,
    essential: false
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Priority email and chat support',
    category: 'support',
    icon: Users,
    essential: false
  },
  {
    id: 'dedicated_support',
    name: 'Dedicated Account Manager',
    description: 'Personal account manager for enterprise clients',
    category: 'support',
    icon: Users,
    essential: false
  }
];

interface TierLimits {
  maxTrades: number;
  maxCapital: number;
  positionSizeMax: number;
  mlModels: string[];
  exchanges: string[];
  tradingPairs: number;
  socialPlatforms: number;
  apiCalls: number;
  supportLevel: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyDiscount: number;
  icon: React.ComponentType<any>;
  color: string;
  popular: boolean;
  features: string[];
  limits: TierLimits;
  enabled: boolean;
}

const DEFAULT_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for beginners learning crypto trading',
    price: 0,
    yearlyDiscount: 0,
    icon: Star,
    color: 'blue',
    popular: false,
    features: [
      'paper_trading',
      'basic_ml_models',
      'basic_risk_management',
      'community_support'
    ],
    limits: {
      maxTrades: 10,
      maxCapital: 1000,
      positionSizeMax: 1,
      mlModels: ['linear_regression', 'polynomial_regression', 'moving_average'],
      exchanges: ['coinbase'],
      tradingPairs: 5,
      socialPlatforms: 0,
      apiCalls: 100,
      supportLevel: 'community'
    },
    enabled: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for serious traders',
    price: 49,
    yearlyDiscount: 20,
    icon: Zap,
    color: 'green',
    popular: true,
    features: [
      'paper_trading',
      'live_trading',
      'basic_ml_models',
      'intermediate_ml_models',
      'social_monitoring',
      'sentiment_analysis',
      'advanced_risk_management',
      'email_support'
    ],
    limits: {
      maxTrades: 100,
      maxCapital: 50000,
      positionSizeMax: 5,
      mlModels: ['linear_regression', 'polynomial_regression', 'moving_average', 'rsi_momentum', 'bollinger_bands', 'macd_signal'],
      exchanges: ['coinbase', 'kraken', 'gemini'],
      tradingPairs: 50,
      socialPlatforms: 2,
      apiCalls: 10000,
      supportLevel: 'email'
    },
    enabled: true
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Professional-grade tools for expert traders',
    price: 149,
    yearlyDiscount: 25,
    icon: Crown,
    color: 'purple',
    popular: false,
    features: [
      'paper_trading',
      'live_trading',
      'multi_exchange_arbitrage',
      'advanced_order_types',
      'basic_ml_models',
      'intermediate_ml_models',
      'advanced_ml_models',
      'social_monitoring',
      'sentiment_analysis',
      'influencer_tracking',
      'advanced_risk_management',
      'risk_alerts',
      'unlimited_api_access',
      'priority_support'
    ],
    limits: {
      maxTrades: 1000,
      maxCapital: 500000,
      positionSizeMax: 10,
      mlModels: AVAILABLE_ML_MODELS.filter(m => m.category !== 'expert').map(m => m.id),
      exchanges: ['coinbase', 'kraken', 'gemini', 'binanceus', 'cryptocom'],
      tradingPairs: 200,
      socialPlatforms: 3,
      apiCalls: 100000,
      supportLevel: 'priority'
    },
    enabled: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for institutions and funds',
    price: 499,
    yearlyDiscount: 30,
    icon: Building2,
    color: 'gold',
    popular: false,
    features: AVAILABLE_FEATURES.map(f => f.id), // All features
    limits: {
      maxTrades: -1,
      maxCapital: -1,
      positionSizeMax: 25,
      mlModels: AVAILABLE_ML_MODELS.map(m => m.id), // All models
      exchanges: US_EXCHANGES.filter(e => e.supported).map(e => e.id), // All supported exchanges
      tradingPairs: -1,
      socialPlatforms: -1,
      apiCalls: -1,
      supportLevel: 'dedicated'
    },
    enabled: true
  }
];

export default function TierConfigurationPanel() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(DEFAULT_TIERS);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTierForEdit, setSelectedTierForEdit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved tiers on mount
  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = () => {
    try {
      const savedTiers = localStorage.getItem('memebot_subscription_tiers');
      if (savedTiers) {
        setTiers(JSON.parse(savedTiers));
        console.log('📊 Loaded subscription tiers from localStorage');
      }
    } catch (error) {
      console.error('Error loading subscription tiers:', error);
    }
  };

  const saveTiers = () => {
    try {
      setIsSaving(true);
      localStorage.setItem('memebot_subscription_tiers', JSON.stringify(tiers));
      console.log('💾 Saved subscription tiers to localStorage');
      
      // Save current tier to localStorage for app to use
      localStorage.setItem('memebot_user_tier', 'enterprise'); // Default to enterprise for admin
      
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving subscription tiers:', error);
      setIsSaving(false);
    }
  };

  const updateTier = (tierId: string, updates: Partial<SubscriptionTier>) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, ...updates } : tier
    ));
  };

  const toggleFeature = (tierId: string, featureId: string) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        const features = tier.features.includes(featureId)
          ? tier.features.filter(f => f !== featureId)
          : [...tier.features, featureId];
        return { ...tier, features };
      }
      return tier;
    }));
  };

  const toggleMLModel = (tierId: string, modelId: string) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        const mlModels = tier.limits.mlModels.includes(modelId)
          ? tier.limits.mlModels.filter(m => m !== modelId)
          : [...tier.limits.mlModels, modelId];
        return { 
          ...tier, 
          limits: { ...tier.limits, mlModels }
        };
      }
      return tier;
    }));
  };

  const toggleExchange = (tierId: string, exchangeId: string) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        const exchanges = tier.limits.exchanges.includes(exchangeId)
          ? tier.limits.exchanges.filter(e => e !== exchangeId)
          : [...tier.limits.exchanges, exchangeId];
        return { 
          ...tier, 
          limits: { ...tier.limits, exchanges }
        };
      }
      return tier;
    }));
  };

  const updateLimit = (tierId: string, limitKey: keyof TierLimits, value: any) => {
    setTiers(prev => prev.map(tier => {
      if (tier.id === tierId) {
        return {
          ...tier,
          limits: { ...tier.limits, [limitKey]: value }
        };
      }
      return tier;
    }));
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const getTierColor = (color: string) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-500/10',
      green: 'border-green-500 bg-green-500/10',
      purple: 'border-purple-500 bg-purple-500/10',
      gold: 'border-yellow-500 bg-yellow-500/10'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getFeaturesByCategory = (category: string) => {
    return AVAILABLE_FEATURES.filter(f => f.category === category);
  };

  const getMLModelsByCategory = (category: string) => {
    return AVAILABLE_ML_MODELS.filter(m => m.category === category);
  };

  // Calculate potential returns for different capital amounts
  const calculatePotentialReturns = (capital: number, tier: SubscriptionTier) => {
    // Get current day's P&L win rate from localStorage
    let currentWinRate = 0;
    try {
      const winRateStr = localStorage.getItem('memebot_win_rate');
      if (winRateStr) {
        currentWinRate = parseFloat(winRateStr);
      } else {
        // Fallback to default win rate if not available
        currentWinRate = 65; // 65% default win rate
      }
    } catch (error) {
      console.error('Error reading win rate:', error);
      currentWinRate = 65; // Fallback to default
    }
    
    // Base return rate is influenced by current win rate
    const baseReturnRate = (currentWinRate / 100) * 0.25; // Scale win rate to reasonable return
    
    const tierMultiplier = {
      basic: 1.0,
      pro: 1.3,
      expert: 1.6,
      enterprise: 2.0
    }[tier.id] || 1.0;
    
    const mlBonus = tier.limits.mlModels.length === 0 ? 0 : 
                    tier.limits.mlModels[0] === -1 ? 0.05 : 
                    (tier.limits.mlModels.length / 15) * 0.05;
                    
    const socialBonus = tier.limits.socialPlatforms > 0 ? 0.03 : 0;
    const exchangeBonus = tier.limits.exchanges.length > 1 ? 0.02 : 0;
    
    const totalReturnRate = baseReturnRate * tierMultiplier + mlBonus + socialBonus + exchangeBonus;
    const monthlyReturn = capital * (totalReturnRate / 12);
    const yearlyReturn = capital * totalReturnRate;
    
    return {
      monthly: monthlyReturn,
      yearly: yearlyReturn,
      returnRate: totalReturnRate * 100
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Subscription Tier Configuration</h1>
            <p className="text-blue-100">Configure subscription tiers with real US exchanges and ML models</p>
          </div>
          <div className="flex items-center space-x-3">
            {isSaving && (
              <div className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </div>
            )}
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-white text-sm">
                <div className="font-semibold">US Regulated Exchanges: {US_EXCHANGES.filter(e => e.supported).length}</div>
                <div className="font-semibold">Available ML Models: {AVAILABLE_ML_MODELS.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Tier Overview', icon: Crown },
          { id: 'features', label: 'Feature Management', icon: Settings },
          { id: 'exchanges', label: 'Exchange Configuration', icon: Building2 },
          { id: 'ml_models', label: 'ML Model Assignment', icon: Brain },
          { id: 'limits', label: 'Limits & Pricing', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tier Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map(tier => (
            <div key={tier.id} className={`bg-slate-800 rounded-lg border-2 ${getTierColor(tier.color)} relative`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <tier.icon className="h-6 w-6 text-white" />
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTierForEdit(selectedTierForEdit === tier.id ? null : tier.id)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-white">
                    ${tier.price}
                    <span className="text-lg text-gray-400">/month</span>
                  </div>
                  {tier.yearlyDiscount > 0 && (
                    <div className="text-sm text-green-400">
                      {tier.yearlyDiscount}% off yearly
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-400">Key Limits:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Trades: {formatLimit(tier.limits.maxTrades)}/day</div>
                    <div>Capital: ${formatLimit(tier.limits.maxCapital)}</div>
                    <div>ML Models: {tier.limits.mlModels.length}</div>
                    <div>Exchanges: {tier.limits.exchanges.length}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-gray-400">{tier.features.length} Features</div>
                  <div className="text-xs text-gray-400">{tier.limits.mlModels.length} ML Models</div>
                  <div className="text-xs text-gray-400">{tier.limits.exchanges.length} Exchanges</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feature Management */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {['trading', 'ml', 'social', 'risk', 'api', 'support'].map(category => (
            <div key={category} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 capitalize flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>{category} Features</span>
              </h3>
              
              <div className="space-y-4">
                {getFeaturesByCategory(category).map(feature => (
                  <div key={feature.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <feature.icon className="h-5 w-5 text-blue-400" />
                        <div>
                          <h4 className="font-medium text-white flex items-center space-x-2">
                            <span>{feature.name}</span>
                            {feature.essential && (
                              <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">ESSENTIAL</span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      {tiers.map(tier => (
                        <div key={tier.id} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">{tier.name}</div>
                          <button
                            onClick={() => toggleFeature(tier.id, feature.id)}
                            disabled={feature.essential && tier.id === 'basic'}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              tier.features.includes(feature.id)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-400'
                            } ${feature.essential && tier.id === 'basic' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {tier.features.includes(feature.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exchange Configuration */}
      {activeTab === 'exchanges' && (
        <div className="space-y-6">
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-blue-400">US Regulated Exchanges Only</h3>
            </div>
            <p className="text-sm text-gray-300">
              Only US-regulated exchanges are available for compliance. All exchanges are integrated via CCXT library.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {US_EXCHANGES.map(exchange => (
              <div key={exchange.id} className={`bg-slate-800 rounded-lg p-6 border ${
                exchange.supported ? 'border-green-500/30' : 'border-red-500/30'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className={`h-6 w-6 ${exchange.supported ? 'text-green-400' : 'text-red-400'}`} />
                    <div>
                      <h3 className="text-lg font-bold text-white">{exchange.name}</h3>
                      <p className="text-sm text-gray-400">{exchange.regulation}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    exchange.supported ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {exchange.supported ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-300">
                    <strong>Regulation:</strong> {exchange.regulation}
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>Trading Pairs:</strong> {exchange.tradingPairs}
                  </div>
                  <div className="text-sm text-gray-300">
                    <strong>Fees:</strong> {(exchange.fees.maker * 100).toFixed(3)}% maker, {(exchange.fees.taker * 100).toFixed(3)}% taker
                  </div>
                </div>

                {exchange.supported && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Available in Tiers:</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {tiers.map(tier => (
                        <div key={tier.id} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">{tier.name}</div>
                          <button
                            onClick={() => toggleExchange(tier.id, exchange.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              tier.limits.exchanges.includes(exchange.id)
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-400'
                            }`}
                          >
                            {tier.limits.exchanges.includes(exchange.id) ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ML Model Assignment */}
      {activeTab === 'ml_models' && (
        <div className="space-y-6">
          {['basic', 'intermediate', 'advanced', 'expert'].map(category => (
            <div key={category} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 capitalize flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>{category} ML Models</span>
              </h3>
              
              <div className="space-y-4">
                {getMLModelsByCategory(category).map(model => (
                  <div key={model.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Brain className="h-5 w-5 text-purple-400" />
                        <div>
                          <h4 className="font-medium text-white flex items-center space-x-2">
                            <span>{model.name}</span>
                            <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                              {model.accuracy}% accuracy
                            </span>
                            <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                              {model.complexity}
                            </span>
                          </h4>
                          <p className="text-sm text-gray-400">{model.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      {tiers.map(tier => (
                        <div key={tier.id} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">{tier.name}</div>
                          <button
                            onClick={() => toggleMLModel(tier.id, model.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              tier.limits.mlModels.includes(model.id)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-600 text-gray-400'
                            }`}
                          >
                            {tier.limits.mlModels.includes(model.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Limits & Pricing */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Tier Limits Configuration</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left py-2 text-gray-400">Limit</th>
                    {tiers.map(tier => (
                      <th key={tier.id} className="text-center py-2 text-gray-400">{tier.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'maxTrades', label: 'Max Trades/Day', type: 'number' },
                    { key: 'maxCapital', label: 'Max Capital ($)', type: 'number' },
                    { key: 'positionSizeMax', label: 'Max Position Size (%)', type: 'number' },
                    { key: 'tradingPairs', label: 'Trading Pairs', type: 'number' },
                    { key: 'socialPlatforms', label: 'Social Platforms', type: 'number' },
                    { key: 'apiCalls', label: 'API Calls/Day', type: 'number' }
                  ].map(limit => (
                    <tr key={limit.key} className="border-b border-slate-700">
                      <td className="py-3 text-white font-medium">{limit.label}</td>
                      {tiers.map(tier => (
                        <td key={tier.id} className="py-3 text-center">
                          <input
                            type="number"
                            value={tier.limits[limit.key as keyof TierLimits] as number}
                            onChange={(e) => updateLimit(tier.id, limit.key as keyof TierLimits, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Pricing Configuration</h3>
            
            <div className="grid grid-cols-4 gap-6">
              {tiers.map(tier => (
                <div key={tier.id} className="space-y-4">
                  <h4 className="font-semibold text-white">{tier.name}</h4>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Monthly Price ($)</label>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => updateTier(tier.id, { price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Yearly Discount (%)</label>
                    <input
                      type="number"
                      value={tier.yearlyDiscount}
                      onChange={(e) => updateTier(tier.id, { yearlyDiscount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tier.popular}
                      onChange={(e) => updateTier(tier.id, { popular: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-400">Mark as Popular</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Configuration */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            saveTiers();
            console.log('Saving tier configuration:', tiers);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
        >
          <Save className="h-5 w-5" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
}