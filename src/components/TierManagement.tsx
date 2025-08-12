import React, { useState, useEffect } from 'react';

interface TierFeature {
  id: string;
  name: string;
  description: string;
  category: 'trading' | 'ml' | 'social' | 'analytics' | 'support' | 'api' | 'risk';
}

interface TierLimits {
  maxTrades: number; // per day
  maxCapital: number; // maximum trading capital
  positionSizeMax: number; // maximum position size %
  mlModels: number; // number of ML models
  exchanges: number; // number of exchanges
  tradingPairs: number; // number of trading pairs
  socialPlatforms: number; // social media platforms
  apiCalls: number; // API calls per day
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  riskManagement: 'basic' | 'advanced' | 'professional' | 'enterprise';
  suggestedCapitalMin: number; // minimum suggested capital
  suggestedCapitalMax: number; // maximum suggested capital
}

interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number; // monthly price
  yearlyDiscount: number; // percentage discount for yearly
  color: string;
  popular: boolean;
  features: string[]; // feature IDs
  limits: TierLimits;
  enabled: boolean;
}

const DEFAULT_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for beginners to learn crypto trading',
    price: 0,
    yearlyDiscount: 0,
    color: 'blue',
    popular: false,
    features: [
      'paper_trading',
      'basic_ml',
      'basic_analytics',
      'basic_risk',
      'community_support'
    ],
    limits: {
      maxTrades: 10,
      maxCapital: 1000,
      positionSizeMax: 1,
      mlModels: 3,
      exchanges: 1,
      tradingPairs: 5,
      socialPlatforms: 0,
      apiCalls: 100,
      supportLevel: 'community',
      riskManagement: 'basic',
      suggestedCapitalMin: 100,
      suggestedCapitalMax: 1000
    },
    enabled: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for serious traders',
    price: 49,
    yearlyDiscount: 20,
    color: 'green',
    popular: true,
    features: [
      'paper_trading',
      'live_trading',
      'basic_ml',
      'advanced_ml',
      'social_monitoring',
      'sentiment_analysis',
      'advanced_analytics',
      'advanced_risk',
      'email_support'
    ],
    limits: {
      maxTrades: 100,
      maxCapital: 50000,
      positionSizeMax: 5,
      mlModels: 8,
      exchanges: 4,
      tradingPairs: 50,
      socialPlatforms: 2,
      apiCalls: 10000,
      supportLevel: 'email',
      riskManagement: 'advanced',
      suggestedCapitalMin: 1000,
      suggestedCapitalMax: 25000
    },
    enabled: true
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Professional-grade tools for expert traders',
    price: 149,
    yearlyDiscount: 25,
    color: 'purple',
    popular: false,
    features: [
      'paper_trading',
      'live_trading',
      'multi_exchange',
      'arbitrage',
      'advanced_orders',
      'portfolio_rebalancing',
      'basic_ml',
      'advanced_ml',
      'custom_ml',
      'ml_backtesting',
      'ensemble_ml',
      'social_monitoring',
      'sentiment_analysis',
      'influencer_tracking',
      'trend_detection',
      'social_signals',
      'advanced_analytics',
      'custom_reports',
      'real_time_dashboard',
      'export_data',
      'advanced_risk',
      'risk_alerts',
      'drawdown_protection',
      'unlimited_api',
      'webhook_support',
      'priority_support'
    ],
    limits: {
      maxTrades: 1000,
      maxCapital: 500000,
      positionSizeMax: 10,
      mlModels: 15,
      exchanges: 10,
      tradingPairs: 200,
      socialPlatforms: 5,
      apiCalls: 100000,
      supportLevel: 'priority',
      riskManagement: 'professional',
      suggestedCapitalMin: 10000,
      suggestedCapitalMax: 250000
    },
    enabled: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for institutions and funds',
    price: 499,
    yearlyDiscount: 30,
    color: 'gold',
    popular: false,
    features: [], // All features
    limits: {
      maxTrades: -1,
      maxCapital: -1,
      positionSizeMax: 25,
      mlModels: -1,
      exchanges: -1,
      tradingPairs: -1,
      socialPlatforms: -1,
      apiCalls: -1,
      supportLevel: 'dedicated',
      riskManagement: 'enterprise',
      suggestedCapitalMin: 100000,
      suggestedCapitalMax: -1 // Unlimited
    },
    enabled: true
  }
];

export default function TierManagement() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(DEFAULT_TIERS);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(true);
  const [showCapitalComparison, setShowCapitalComparison] = useState(false);

  // Load saved tiers on mount
  useEffect(() => {
    const savedTiers = localStorage.getItem('memebot_subscription_tiers');
    if (savedTiers) {
      try {
        setTiers(JSON.parse(savedTiers));
        console.log('📊 Loaded subscription tiers from localStorage');
      } catch (error) {
        console.error('Error parsing saved tiers:', error);
        setTiers(DEFAULT_TIERS);
      }
    }
  }, []);

  // Save tiers when they change
  useEffect(() => {
    localStorage.setItem('memebot_subscription_tiers', JSON.stringify(tiers));
  }, [tiers]);

  const getTierColor = (color: string) => {
    const colors = {
      blue: 'border-blue-500 bg-blue-500/10',
      green: 'border-green-500 bg-green-500/10',
      purple: 'border-purple-500 bg-purple-500/10',
      gold: 'border-yellow-500 bg-yellow-500/10',
      red: 'border-red-500 bg-red-500/10'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const formatCurrency = (amount: number) => {
    if (amount === -1) return 'Unlimited';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateYearlyPrice = (tier: SubscriptionTier) => {
    const monthlyTotal = tier.price * 12;
    const discount = monthlyTotal * (tier.yearlyDiscount / 100);
    return monthlyTotal - discount;
  };

  // Calculate potential returns for different capital amounts
  const calculatePotentialReturns = (capital: number, tier: SubscriptionTier) => {
    const baseReturnRate = 0.15; // 15% annual return baseline
    const tierMultiplier = {
      basic: 1.0,
      pro: 1.3,
      expert: 1.6,
      enterprise: 2.0
    }[tier.id] || 1.0;
    
    const mlBonus = tier.limits.mlModels === -1 ? 0.05 : (tier.limits.mlModels / 15) * 0.05;
    const socialBonus = tier.limits.socialPlatforms > 0 ? 0.03 : 0;
    const exchangeBonus = tier.limits.exchanges > 1 ? 0.02 : 0;
    
    const totalReturnRate = baseReturnRate * tierMultiplier + mlBonus + socialBonus + exchangeBonus;
    const monthlyReturn = capital * (totalReturnRate / 12);
    const yearlyReturn = capital * totalReturnRate;
    
    return {
      monthly: monthlyReturn,
      yearly: yearlyReturn,
      returnRate: totalReturnRate * 100
    };
  };

  // Get dynamic tier description
  const getDynamicTierDescription = (tier: SubscriptionTier) => {
    const featureCount = tier.features.length;
    const mlModelCount = tier.limits.mlModels === -1 ? 'All' : tier.limits.mlModels;
    const exchangeCount = tier.limits.exchanges === -1 ? 'All' : tier.limits.exchanges;
    const capitalRange = `${formatCurrency(tier.limits.suggestedCapitalMin)} - ${formatCurrency(tier.limits.suggestedCapitalMax)}`;
    
    return `${featureCount} features • ${mlModelCount} ML models • ${exchangeCount} exchanges • ${capitalRange} suggested capital`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 border border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Subscription Tier Management</h1>
            <p className="text-blue-100">Configure subscription tiers, features, and pricing for your SaaS platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCapitalComparison(!showCapitalComparison)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
            >
              <span>Capital Comparison</span>
            </button>
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
            >
              <span>Add Tier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
        {[
          { id: 'overview', label: 'Tier Overview' },
          { id: 'features', label: 'Feature Management' },
          { id: 'capital', label: 'Capital & Pricing' },
          { id: 'analytics', label: 'Subscription Analytics' },
          { id: 'users', label: 'User Management' }
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
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tier Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-800 p-6 rounded-lg border border-slate-700">
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
                    <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  </div>
                  <button
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    Edit
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
                      ${calculateYearlyPrice(tier).toFixed(0)}/year ({tier.yearlyDiscount}% off)
                    </div>
                  )}
                </div>

                {/* Suggested Capital Range */}
                <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">💰 Suggested Capital Range</div>
                  <div className="text-sm font-bold text-green-400">
                    {formatCurrency(tier.limits.suggestedCapitalMin)} - {formatCurrency(tier.limits.suggestedCapitalMax)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Optimal range for this tier's features
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-400">Dynamic Key Limits:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Trades: {formatLimit(tier.limits.maxTrades)}/day</div>
                    <div>Capital: {formatCurrency(tier.limits.maxCapital)}</div>
                    <div>ML Models: {formatLimit(tier.limits.mlModels)}</div>
                    <div>Exchanges: {formatLimit(tier.limits.exchanges)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-gray-400">{getDynamicTierDescription(tier)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Configuration Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            console.log('Saving tier configuration:', tiers);
            localStorage.setItem('memebot_subscription_tiers', JSON.stringify(tiers));
            alert('Tier configuration saved successfully! All descriptions and limits updated dynamically.');
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
        >
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
}