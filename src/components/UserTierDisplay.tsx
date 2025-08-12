import React, { useState, useEffect } from 'react';
import { Crown, Star, Zap, Building2, Spade as Upgrade, Check, X, Lock, Unlock, AlertTriangle, TrendingUp, DollarSign, Calendar, CreditCard, Gift } from 'lucide-react';

interface UserTier {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyDiscount: number;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  limits: {
    maxTrades: number;
    maxCapital: number;
    positionSizeMax: number;
    mlModels: number;
    exchanges: number;
    tradingPairs: number;
    socialPlatforms: number;
    apiCalls: number;
    supportLevel: string;
    riskManagement: string;
  };
}

interface UserSubscription {
  currentTier: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  trialDaysLeft?: number;
  usageStats: {
    tradesUsed: number;
    mlModelsUsed: number;
    exchangesConnected: number;
    apiCallsUsed: number;
  };
}

interface UserTierDisplayProps {
  userSubscription: UserSubscription;
  availableTiers: UserTier[];
  onUpgrade: (tierId: string) => void;
  onManageSubscription: () => void;
}

const TIER_ICONS = {
  basic: Star,
  pro: Zap,
  expert: Crown,
  enterprise: Building2
};

const TIER_COLORS = {
  basic: 'border-blue-500 bg-blue-500/10',
  pro: 'border-green-500 bg-green-500/10',
  expert: 'border-purple-500 bg-purple-500/10',
  enterprise: 'border-yellow-500 bg-yellow-500/10'
};

export default function UserTierDisplay({ 
  userSubscription, 
  availableTiers, 
  onUpgrade, 
  onManageSubscription 
}: UserTierDisplayProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  const currentTier = availableTiers.find(tier => tier.id === userSubscription.currentTier);
  const isTrialActive = userSubscription.status === 'trial' && (userSubscription.trialDaysLeft || 0) > 0;
  const isExpired = userSubscription.status === 'expired';

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-400 bg-red-400';
    if (percentage >= 70) return 'text-yellow-400 bg-yellow-400';
    return 'text-green-400 bg-green-400';
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const calculateYearlyPrice = (tier: UserTier) => {
    const monthlyTotal = tier.price * 12;
    const discount = monthlyTotal * (tier.yearlyDiscount / 100);
    return monthlyTotal - discount;
  };

  const getUpgradeRecommendation = () => {
    const usage = userSubscription.usageStats;
    const limits = currentTier?.limits;
    
    if (!limits) return null;

    const highUsageAreas = [];
    
    if (limits.maxTrades !== -1 && usage.tradesUsed / limits.maxTrades > 0.8) {
      highUsageAreas.push('trading volume');
    }
    if (limits.mlModels !== -1 && usage.mlModelsUsed / limits.mlModels > 0.8) {
      highUsageAreas.push('ML models');
    }
    if (limits.apiCalls !== -1 && usage.apiCallsUsed / limits.apiCalls > 0.8) {
      highUsageAreas.push('API calls');
    }

    if (highUsageAreas.length > 0) {
      const nextTier = availableTiers.find(tier => 
        availableTiers.indexOf(tier) === availableTiers.indexOf(currentTier!) + 1
      );
      
      if (nextTier) {
        return {
          reason: `You're approaching limits in: ${highUsageAreas.join(', ')}`,
          recommendedTier: nextTier
        };
      }
    }

    return null;
  };

  const recommendation = getUpgradeRecommendation();

  if (!currentTier) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white">Subscription Error</h3>
          <p className="text-gray-400">Unable to load your current subscription tier.</p>
          <button
            onClick={onManageSubscription}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Tier Status */}
      <div className={`bg-slate-800 rounded-lg border-2 ${TIER_COLORS[currentTier.id as keyof typeof TIER_COLORS]} relative`}>
        {isTrialActive && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              TRIAL - {userSubscription.trialDaysLeft} DAYS LEFT
            </span>
          </div>
        )}
        
        {isExpired && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              EXPIRED
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <currentTier.icon className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">{currentTier.name} Plan</h2>
                <p className="text-gray-400">{currentTier.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                ${currentTier.price}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              {currentTier.yearlyDiscount > 0 && (
                <div className="text-sm text-green-400">
                  Save {currentTier.yearlyDiscount}% yearly
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    userSubscription.status === 'active' ? 'text-green-400' :
                    userSubscription.status === 'trial' ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {userSubscription.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Started:</span>
                  <span className="text-white">{new Date(userSubscription.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Renews:</span>
                  <span className="text-white">{new Date(userSubscription.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Auto-renew:</span>
                  <span className={userSubscription.autoRenew ? 'text-green-400' : 'text-red-400'}>
                    {userSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Usage This Month</h3>
                <button
                  onClick={() => setShowUsageDetails(!showUsageDetails)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {showUsageDetails ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              <div className="space-y-2">
                {[
                  { 
                    label: 'Trades', 
                    used: userSubscription.usageStats.tradesUsed, 
                    limit: currentTier.limits.maxTrades 
                  },
                  { 
                    label: 'ML Models', 
                    used: userSubscription.usageStats.mlModelsUsed, 
                    limit: currentTier.limits.mlModels 
                  },
                  { 
                    label: 'API Calls', 
                    used: userSubscription.usageStats.apiCallsUsed, 
                    limit: currentTier.limits.apiCalls 
                  }
                ].map(item => {
                  const percentage = getUsagePercentage(item.used, item.limit);
                  const colorClass = getUsageColor(percentage);
                  
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{item.label}:</span>
                        <span className="text-white">
                          {item.used.toLocaleString()} / {formatLimit(item.limit)}
                        </span>
                      </div>
                      {item.limit !== -1 && (
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${colorClass.split(' ')[1]}/20`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-600">
            <div className="flex items-center space-x-3">
              {(isTrialActive || isExpired) && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                >
                  <Upgrade className="h-4 w-4" />
                  <span>{isExpired ? 'Reactivate' : 'Upgrade Now'}</span>
                </button>
              )}
              
              {userSubscription.status === 'active' && currentTier.id !== 'enterprise' && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Upgrade</span>
                </button>
              )}
            </div>
            
            <button
              onClick={onManageSubscription}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span>Manage Subscription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Recommendation */}
      {recommendation && (
        <div className="bg-orange-600/20 border border-orange-600/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-400 mb-1">Upgrade Recommended</h3>
              <p className="text-sm text-gray-300 mb-3">{recommendation.reason}</p>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">Consider upgrading to:</span>
                <span className="font-semibold text-white">{recommendation.recommendedTier.name}</span>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-all"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-slate-700 rounded-lg p-1 flex">
                <button
                  onClick={() => setSelectedBilling('monthly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    selectedBilling === 'monthly' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedBilling('yearly')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    selectedBilling === 'yearly' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <span className="ml-1 text-xs bg-green-600 text-white px-1 rounded">SAVE</span>
                </button>
              </div>
            </div>

            {/* Tier Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {availableTiers.map(tier => {
                const TierIcon = TIER_ICONS[tier.id as keyof typeof TIER_ICONS] || Star;
                const isCurrentTier = tier.id === currentTier.id;
                const price = selectedBilling === 'yearly' ? calculateYearlyPrice(tier) / 12 : tier.price;
                const savings = selectedBilling === 'yearly' && tier.yearlyDiscount > 0;
                
                return (
                  <div 
                    key={tier.id} 
                    className={`bg-slate-700 rounded-lg border-2 relative ${
                      isCurrentTier ? 'border-blue-500' : 'border-slate-600 hover:border-slate-500'
                    } transition-all`}
                  >
                    {tier.id === 'pro' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    
                    {isCurrentTier && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          CURRENT
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="text-center mb-4">
                        <TierIcon className="h-8 w-8 text-white mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                        <p className="text-sm text-gray-400">{tier.description}</p>
                      </div>

                      <div className="text-center mb-6">
                        <div className="text-3xl font-bold text-white">
                          ${price.toFixed(0)}
                          <span className="text-lg text-gray-400">/month</span>
                        </div>
                        {savings && (
                          <div className="text-sm text-green-400">
                            Save ${((tier.price * 12) - calculateYearlyPrice(tier)).toFixed(0)}/year
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mb-6">
                        {[
                          `${formatLimit(tier.limits.maxTrades)} trades/day`,
                          `${formatLimit(tier.limits.mlModels)} ML models`,
                          `${formatLimit(tier.limits.exchanges)} exchanges`,
                          `${tier.limits.supportLevel} support`
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Check className="h-4 w-4 text-green-400" />
                            <span className="text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          if (!isCurrentTier) {
                            onUpgrade(tier.id);
                            setShowUpgradeModal(false);
                          }
                        }}
                        disabled={isCurrentTier}
                        className={`w-full py-3 rounded-lg font-semibold transition-all ${
                          isCurrentTier
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isCurrentTier ? 'Current Plan' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}