import React, { useState, useEffect } from 'react';
import { Lock, Unlock, AlertTriangle, Crown, TrendingUp, Shield, Zap, X, Spade as Upgrade } from 'lucide-react';

interface TierLimits {
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
}

interface TierEnforcementProps {
  userTier: string;
  tierLimits: TierLimits;
  currentUsage: {
    tradesUsed: number;
    mlModelsUsed: number;
    exchangesConnected: number;
    tradingPairsEnabled: number;
    socialPlatformsEnabled: number;
    apiCallsUsed: number;
    currentCapital: number;
  };
  onUpgradeRequest: () => void;
  children: React.ReactNode;
}

interface FeatureGate {
  feature: string;
  requiredTier: string;
  description: string;
  icon: React.ComponentType<any>;
}

const FEATURE_GATES: FeatureGate[] = [
  {
    feature: 'live_trading',
    requiredTier: 'pro',
    description: 'Live trading with real money requires Pro tier or higher',
    icon: TrendingUp
  },
  {
    feature: 'social_monitoring',
    requiredTier: 'pro',
    description: 'Social media monitoring requires Pro tier or higher',
    icon: Zap
  },
  {
    feature: 'advanced_ml',
    requiredTier: 'pro',
    description: 'Advanced ML models require Pro tier or higher',
    icon: Crown
  },
  {
    feature: 'custom_ml',
    requiredTier: 'expert',
    description: 'Custom ML models require Expert tier or higher',
    icon: Crown
  },
  {
    feature: 'arbitrage',
    requiredTier: 'expert',
    description: 'Arbitrage trading requires Expert tier or higher',
    icon: TrendingUp
  },
  {
    feature: 'enterprise_features',
    requiredTier: 'enterprise',
    description: 'Enterprise features require Enterprise tier',
    icon: Shield
  }
];

const TIER_HIERARCHY = ['basic', 'pro', 'expert', 'enterprise'];

export default function TierEnforcement({ 
  userTier, 
  tierLimits, 
  currentUsage, 
  onUpgradeRequest, 
  children 
}: TierEnforcementProps) {
  const [blockedActions, setBlockedActions] = useState<string[]>([]);
  const [showLimitWarning, setShowLimitWarning] = useState<string | null>(null);

  useEffect(() => {
    checkLimits();
  }, [currentUsage, tierLimits]);

  const checkLimits = () => {
    const blocked: string[] = [];

    // Check trading limits
    if (tierLimits.maxTrades !== -1 && currentUsage.tradesUsed >= tierLimits.maxTrades) {
      blocked.push('trading');
    }

    // Check capital limits
    if (tierLimits.maxCapital !== -1 && currentUsage.currentCapital >= tierLimits.maxCapital) {
      blocked.push('capital_increase');
    }

    // Check ML model limits
    if (tierLimits.mlModels !== -1 && currentUsage.mlModelsUsed >= tierLimits.mlModels) {
      blocked.push('ml_models');
    }

    // Check exchange limits
    if (tierLimits.exchanges !== -1 && currentUsage.exchangesConnected >= tierLimits.exchanges) {
      blocked.push('exchanges');
    }

    // Check trading pairs limits
    if (tierLimits.tradingPairs !== -1 && currentUsage.tradingPairsEnabled >= tierLimits.tradingPairs) {
      blocked.push('trading_pairs');
    }

    // Check social platforms limits
    if (tierLimits.socialPlatforms !== -1 && currentUsage.socialPlatformsEnabled >= tierLimits.socialPlatforms) {
      blocked.push('social_platforms');
    }

    // Check API calls limits
    if (tierLimits.apiCalls !== -1 && currentUsage.apiCallsUsed >= tierLimits.apiCalls) {
      blocked.push('api_calls');
    }

    setBlockedActions(blocked);
  };

  const hasFeatureAccess = (feature: string): boolean => {
    const featureGate = FEATURE_GATES.find(gate => gate.feature === feature);
    if (!featureGate) return true;

    const userTierIndex = TIER_HIERARCHY.indexOf(userTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(featureGate.requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  };

  const isActionBlocked = (action: string): boolean => {
    return blockedActions.includes(action);
  };

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const shouldShowWarning = (used: number, limit: number): boolean => {
    if (limit === -1) return false;
    return (used / limit) >= 0.8; // Show warning at 80% usage
  };

  const formatLimit = (value: number): string => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const FeatureGateModal = ({ feature, onClose }: { feature: FeatureGate; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Lock className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-bold text-white">Feature Locked</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <feature.icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 text-center">{feature.description}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpgradeRequest();
              onClose();
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <Upgrade className="h-4 w-4" />
            <span>Upgrade</span>
          </button>
        </div>
      </div>
    </div>
  );

  const LimitWarningModal = ({ limitType, onClose }: { limitType: string; onClose: () => void }) => {
    const getWarningContent = () => {
      switch (limitType) {
        case 'trading':
          return {
            title: 'Daily Trading Limit Reached',
            message: `You've reached your daily limit of ${formatLimit(tierLimits.maxTrades)} trades.`,
            icon: TrendingUp
          };
        case 'capital_increase':
          return {
            title: 'Capital Limit Reached',
            message: `Your trading capital limit is $${formatLimit(tierLimits.maxCapital)}.`,
            icon: Shield
          };
        case 'ml_models':
          return {
            title: 'ML Model Limit Reached',
            message: `You can use up to ${formatLimit(tierLimits.mlModels)} ML models.`,
            icon: Crown
          };
        default:
          return {
            title: 'Limit Reached',
            message: 'You have reached a tier limit.',
            icon: AlertTriangle
          };
      }
    };

    const content = getWarningContent();
    const WarningIcon = content.icon;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              <h3 className="text-lg font-bold text-white">{content.title}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <WarningIcon className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-300 text-center">{content.message}</p>
            <p className="text-gray-400 text-center text-sm mt-2">
              Upgrade your plan to increase limits and unlock more features.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              Continue
            </button>
            <button
              onClick={() => {
                onUpgradeRequest();
                onClose();
              }}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all"
            >
              <Upgrade className="h-4 w-4" />
              <span>Upgrade</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Usage warnings for approaching limits
  const usageWarnings = [
    {
      type: 'trading',
      used: currentUsage.tradesUsed,
      limit: tierLimits.maxTrades,
      label: 'Daily Trades'
    },
    {
      type: 'ml_models',
      used: currentUsage.mlModelsUsed,
      limit: tierLimits.mlModels,
      label: 'ML Models'
    },
    {
      type: 'api_calls',
      used: currentUsage.apiCallsUsed,
      limit: tierLimits.apiCalls,
      label: 'API Calls'
    }
  ].filter(warning => shouldShowWarning(warning.used, warning.limit));

  return (
    <div className="relative">
      {/* Usage Warnings */}
      {usageWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {usageWarnings.map(warning => (
            <div key={warning.type} className="bg-orange-600/20 border border-orange-600/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium text-orange-400">
                    {warning.label} limit approaching
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {warning.used} / {formatLimit(warning.limit)}
                </div>
              </div>
              <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="h-2 bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${getUsagePercentage(warning.used, warning.limit)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* Modals */}
      {showLimitWarning && (
        <LimitWarningModal 
          limitType={showLimitWarning} 
          onClose={() => setShowLimitWarning(null)} 
        />
      )}
    </div>
  );
}

// Higher-order component for feature gating
export function withFeatureGate<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredFeature: string
) {
  return function FeatureGatedComponent(props: T & { userTier: string; onUpgradeRequest: () => void }) {
    const [showFeatureGate, setShowFeatureGate] = useState(false);
    
    const featureGate = FEATURE_GATES.find(gate => gate.feature === requiredFeature);
    if (!featureGate) {
      return <WrappedComponent {...props} />;
    }

    const userTierIndex = TIER_HIERARCHY.indexOf(props.userTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(featureGate.requiredTier);
    const hasAccess = userTierIndex >= requiredTierIndex;

    if (!hasAccess) {
      return (
        <div className="relative">
          <div className="absolute inset-0 bg-slate-800/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center p-6">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Feature Locked</h3>
              <p className="text-gray-400 mb-4">{featureGate.description}</p>
              <button
                onClick={props.onUpgradeRequest}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all mx-auto"
              >
                <Upgrade className="h-4 w-4" />
                <span>Upgrade Plan</span>
              </button>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">
            <WrappedComponent {...props} />
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Hook for checking feature access
export function useFeatureAccess(userTier: string) {
  const hasFeatureAccess = (feature: string): boolean => {
    const featureGate = FEATURE_GATES.find(gate => gate.feature === feature);
    if (!featureGate) return true;

    const userTierIndex = TIER_HIERARCHY.indexOf(userTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(featureGate.requiredTier);
    
    return userTierIndex >= requiredTierIndex;
  };

  const getRequiredTier = (feature: string): string | null => {
    const featureGate = FEATURE_GATES.find(gate => gate.feature === feature);
    return featureGate?.requiredTier || null;
  };

  return { hasFeatureAccess, getRequiredTier };
}