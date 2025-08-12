import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Zap, Lock, Crown, Star, AlertTriangle, Target, Activity, Info } from 'lucide-react';

interface MLModelPerformance {
  id: string;
  name: string;
  category: 'basic' | 'intermediate' | 'advanced' | 'expert';
  accuracy: number;
  predictions: number;
  profitGenerated: number;
  isLearning: boolean;
  learningProgress: number;
  recentPerformance: number[];
  confidence: number;
  enabled: boolean;
  requiredTier: string;
  description?: string; // Added description field
}

interface AILearningTrackerProps {
  userTier: string;
  onUpgradeRequest: () => void;
}

export default function AILearningTracker({ userTier, onUpgradeRequest }: AILearningTrackerProps) {
  const [models, setModels] = useState<MLModelPerformance[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  useEffect(() => {
    // Initialize ML models with realistic performance data and descriptions
    const initializeModels = () => {
      const modelData: MLModelPerformance[] = [
        // Basic Models (Free Tier)
        {
          id: 'linear_regression',
          name: 'Linear Regression',
          category: 'basic',
          accuracy: 72.5,
          predictions: 1247,
          profitGenerated: 2847.32,
          isLearning: true,
          learningProgress: 78,
          recentPerformance: [71, 72, 73, 72, 74, 73, 72],
          confidence: 0.72,
          enabled: true,
          requiredTier: 'basic',
          description: 'Predicts price movements by finding the best-fitting straight line through data points. Simple but effective for identifying basic trends in price data.'
        },
        {
          id: 'moving_average',
          name: 'Moving Average',
          category: 'basic',
          accuracy: 68.3,
          predictions: 1156,
          profitGenerated: 1923.45,
          isLearning: true,
          learningProgress: 65,
          recentPerformance: [67, 68, 69, 68, 67, 69, 68],
          confidence: 0.68,
          enabled: true,
          requiredTier: 'basic',
          description: 'Calculates the average price over a specific time period, smoothing out price fluctuations to identify trends. Useful for filtering out market noise.'
        },
        {
          id: 'polynomial',
          name: 'Polynomial Regression',
          category: 'basic',
          accuracy: 75.1,
          predictions: 1089,
          profitGenerated: 3245.67,
          isLearning: true,
          learningProgress: 82,
          recentPerformance: [74, 75, 76, 75, 74, 76, 75],
          confidence: 0.75,
          enabled: true,
          requiredTier: 'basic',
          description: 'Extends linear regression to fit curved relationships using polynomial equations. Better at capturing non-linear price movements and complex market patterns.'
        },
        
        // Intermediate Models (Pro Tier)
        {
          id: 'rsi_momentum',
          name: 'RSI Momentum',
          category: 'intermediate',
          accuracy: 79.2,
          predictions: 2341,
          profitGenerated: 5678.90,
          isLearning: true,
          learningProgress: 89,
          recentPerformance: [78, 79, 80, 79, 78, 80, 79],
          confidence: 0.79,
          enabled: userTier !== 'basic',
          requiredTier: 'pro',
          description: 'Combines Relative Strength Index with momentum indicators to identify overbought and oversold conditions. Excellent for timing entry and exit points.'
        },
        {
          id: 'bollinger_bands',
          name: 'Bollinger Bands',
          category: 'intermediate',
          accuracy: 81.7,
          predictions: 2156,
          profitGenerated: 6234.12,
          isLearning: true,
          learningProgress: 91,
          recentPerformance: [80, 81, 82, 81, 80, 82, 81],
          confidence: 0.82,
          enabled: userTier !== 'basic',
          requiredTier: 'pro',
          description: 'Uses standard deviations to create dynamic price channels that expand and contract with volatility. Identifies potential breakouts and mean reversion opportunities.'
        },
        {
          id: 'macd_signal',
          name: 'MACD Signal',
          category: 'intermediate',
          accuracy: 77.8,
          predictions: 1987,
          profitGenerated: 4567.89,
          isLearning: true,
          learningProgress: 85,
          recentPerformance: [76, 77, 78, 77, 76, 78, 77],
          confidence: 0.78,
          enabled: userTier !== 'basic',
          requiredTier: 'pro',
          description: 'Moving Average Convergence Divergence identifies momentum shifts by analyzing the relationship between two moving averages. Excellent for trend confirmation and reversal detection.'
        },
        
        // Advanced Models (Expert Tier)
        {
          id: 'lstm_neural',
          name: 'LSTM Neural Network',
          category: 'advanced',
          accuracy: 85.4,
          predictions: 3456,
          profitGenerated: 12345.67,
          isLearning: true,
          learningProgress: 94,
          recentPerformance: [84, 85, 86, 85, 84, 86, 85],
          confidence: 0.85,
          enabled: ['expert', 'enterprise'].includes(userTier),
          requiredTier: 'expert',
          description: 'Long Short-Term Memory neural network that excels at learning patterns in sequential data. Can identify complex market patterns and remember long-term dependencies in price movements.'
        },
        {
          id: 'random_forest',
          name: 'Random Forest',
          category: 'advanced',
          accuracy: 83.9,
          predictions: 3234,
          profitGenerated: 10987.54,
          isLearning: true,
          learningProgress: 92,
          recentPerformance: [82, 83, 84, 83, 82, 84, 83],
          confidence: 0.84,
          enabled: ['expert', 'enterprise'].includes(userTier),
          requiredTier: 'expert',
          description: 'Ensemble learning method that combines multiple decision trees to improve prediction accuracy and reduce overfitting. Excellent for handling diverse market conditions.'
        },
        {
          id: 'gradient_boosting',
          name: 'Gradient Boosting',
          category: 'advanced',
          accuracy: 86.2,
          predictions: 2987,
          profitGenerated: 13456.78,
          isLearning: true,
          learningProgress: 96,
          recentPerformance: [85, 86, 87, 86, 85, 87, 86],
          confidence: 0.86,
          enabled: ['expert', 'enterprise'].includes(userTier),
          requiredTier: 'expert',
          description: 'Advanced ensemble technique that builds models sequentially, with each new model correcting errors from previous ones. Highly accurate for complex market predictions.'
        },
        
        // Expert Models (Enterprise Tier)
        {
          id: 'transformer',
          name: 'Transformer Model',
          category: 'expert',
          accuracy: 89.7,
          predictions: 4567,
          profitGenerated: 23456.89,
          isLearning: true,
          learningProgress: 98,
          recentPerformance: [88, 89, 90, 89, 88, 90, 89],
          confidence: 0.90,
          enabled: userTier === 'enterprise',
          requiredTier: 'enterprise',
          description: 'State-of-the-art neural network architecture using self-attention mechanisms to process sequential data. Excels at capturing complex relationships in market data across different timeframes.'
        },
        {
          id: 'ensemble_meta',
          name: 'Ensemble Meta-Model',
          category: 'expert',
          accuracy: 91.3,
          predictions: 5678,
          profitGenerated: 34567.90,
          isLearning: true,
          learningProgress: 99,
          recentPerformance: [90, 91, 92, 91, 90, 92, 91],
          confidence: 0.91,
          enabled: userTier === 'enterprise',
          requiredTier: 'enterprise',
          description: 'Combines predictions from multiple models using a meta-learning approach. Dynamically weights each model based on recent performance to achieve superior accuracy in all market conditions.'
        },
        {
          id: 'reinforcement_learning',
          name: 'Reinforcement Learning',
          category: 'expert',
          accuracy: 88.5,
          predictions: 4321,
          profitGenerated: 28901.23,
          isLearning: true,
          learningProgress: 97,
          recentPerformance: [87, 88, 89, 88, 87, 89, 88],
          confidence: 0.88,
          enabled: userTier === 'enterprise',
          requiredTier: 'enterprise',
          description: 'Self-learning AI that improves through trial and error by maximizing rewards. Adapts trading strategies in real-time based on market feedback, continuously optimizing for profit.'
        }
      ];

      setModels(modelData);
    };

    initializeModels();

    // Simulate learning progress updates
    const interval = setInterval(() => {
      setModels(prev => prev.map(model => ({
        ...model,
        accuracy: Math.max(50, Math.min(95, model.accuracy + (Math.random() - 0.5) * 0.5)),
        predictions: model.predictions + Math.floor(Math.random() * 5),
        profitGenerated: model.profitGenerated + (Math.random() * 50 - 10),
        learningProgress: Math.min(100, model.learningProgress + Math.random() * 2),
        recentPerformance: [
          ...model.recentPerformance.slice(1),
          Math.max(50, Math.min(95, model.accuracy + (Math.random() - 0.5) * 2))
        ],
        confidence: Math.max(0.5, Math.min(1, model.confidence + (Math.random() - 0.5) * 0.02))
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [userTier]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return Star;
      case 'intermediate': return Zap;
      case 'advanced': return Brain;
      case 'expert': return Crown;
      default: return Brain;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'text-blue-400 bg-blue-400';
      case 'intermediate': return 'text-green-400 bg-green-400';
      case 'advanced': return 'text-purple-400 bg-purple-400';
      case 'expert': return 'text-yellow-400 bg-yellow-400';
      default: return 'text-gray-400 bg-gray-400';
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Free';
      case 'pro': return 'Pro';
      case 'expert': return 'Expert';
      case 'enterprise': return 'Enterprise';
      default: return tier;
    }
  };

  const enabledModels = models.filter(m => m.enabled);
  const lockedModels = models.filter(m => !m.enabled);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-400" />
          <h3 className="text-lg font-bold text-white">🧠 AI Learning Center</h3>
          <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded animate-pulse">
            LIVE LEARNING
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {enabledModels.length} active • {lockedModels.length} locked
        </div>
      </div>

      {/* Overall Performance Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-400">Avg Accuracy</div>
          <div className="text-xl font-bold text-green-400">
            {enabledModels.length > 0 ? 
              (enabledModels.reduce((sum, m) => sum + m.accuracy, 0) / enabledModels.length).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-400">Total Predictions</div>
          <div className="text-xl font-bold text-blue-400">
            {enabledModels.reduce((sum, m) => sum + m.predictions, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-400">Total Profit</div>
          <div className="text-xl font-bold text-green-400">
            ${enabledModels.reduce((sum, m) => sum + m.profitGenerated, 0).toFixed(0)}
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="text-sm text-gray-400">Learning Progress</div>
          <div className="text-xl font-bold text-purple-400">
            {enabledModels.length > 0 ? 
              (enabledModels.reduce((sum, m) => sum + m.learningProgress, 0) / enabledModels.length).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Active Models */}
      {enabledModels.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-white mb-3">Active AI Models</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enabledModels.map(model => {
              const CategoryIcon = getCategoryIcon(model.category);
              const categoryColor = getCategoryColor(model.category);
              
              return (
                <div
                  key={model.id}
                  className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-purple-500 transition-all cursor-pointer relative"
                  onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                  onMouseEnter={() => setHoveredModel(model.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className={`h-4 w-4 ${categoryColor.split(' ')[0]}`} />
                      <span className="font-medium text-white text-sm">{model.name}</span>
                      <button 
                        className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center hover:bg-slate-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredModel(hoveredModel === model.id ? null : model.id);
                        }}
                      >
                        <Info className="h-3 w-3 text-gray-300" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1">
                      {model.isLearning && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                      <span className="text-xs text-green-400">{model.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Model Info Tooltip */}
                  {hoveredModel === model.id && model.description && (
                    <div className="absolute z-10 left-0 right-0 -top-2 transform -translate-y-full bg-slate-800 p-3 rounded-lg shadow-lg border border-purple-500 text-xs text-gray-300">
                      <div className="font-medium text-white mb-1">{model.name}</div>
                      <p>{model.description}</p>
                      <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2 rotate-45 w-3 h-3 bg-slate-800 border-r border-b border-purple-500"></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Learning Progress</span>
                      <span className="text-white">{model.learningProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${categoryColor.split(' ')[1]}/20`}
                        style={{ width: `${model.learningProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {selectedModel === model.id && (
                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Predictions:</span>
                        <span className="text-white">{model.predictions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit Generated:</span>
                        <span className="text-green-400">${model.profitGenerated.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-white">{(model.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Models (FOMO for Free Tier) */}
      {lockedModels.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-400">🔒 Premium AI Models</h4>
            <button
              onClick={onUpgradeRequest}
              className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Unlock All Models
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedModels.map(model => {
              const CategoryIcon = getCategoryIcon(model.category);
              const categoryColor = getCategoryColor(model.category);
              
              return (
                <div
                  key={model.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 relative opacity-75"
                  onMouseEnter={() => setHoveredModel(model.id)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <div className="text-xs text-gray-400 font-medium">
                        {getTierName(model.requiredTier)} Required
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className={`h-4 w-4 ${categoryColor.split(' ')[0]}`} />
                      <span className="font-medium text-white text-sm">{model.name}</span>
                      <button 
                        className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center hover:bg-slate-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoveredModel(hoveredModel === model.id ? null : model.id);
                        }}
                      >
                        <Info className="h-3 w-3 text-gray-300" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-green-400">{model.accuracy.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Model Info Tooltip */}
                  {hoveredModel === model.id && model.description && (
                    <div className="absolute z-10 left-0 right-0 -top-2 transform -translate-y-full bg-slate-800 p-3 rounded-lg shadow-lg border border-purple-500 text-xs text-gray-300">
                      <div className="font-medium text-white mb-1">{model.name}</div>
                      <p>{model.description}</p>
                      <div className="absolute bottom-0 left-1/2 transform translate-y-1/2 -translate-x-1/2 rotate-45 w-3 h-3 bg-slate-800 border-r border-b border-purple-500"></div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Potential Accuracy</span>
                      <span className="text-white">{model.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${categoryColor.split(' ')[1]}/30`}
                        style={{ width: `${model.accuracy}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-center text-gray-400 mt-2">
                      Could generate ${model.profitGenerated.toFixed(0)}+ profit
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOMO Call-to-Action */}
          <div className="mt-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-white">Missing Out on Advanced AI</h4>
                <p className="text-sm text-gray-300">
                  Premium models are generating {lockedModels.reduce((sum, m) => sum + m.profitGenerated, 0).toFixed(0)}+ 
                  in additional profits. Upgrade to unlock all {lockedModels.length} advanced AI models.
                </p>
              </div>
              <button
                onClick={onUpgradeRequest}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}