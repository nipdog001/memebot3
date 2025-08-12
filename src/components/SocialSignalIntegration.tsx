import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, RefreshCw } from 'lucide-react';

interface SocialSignal {
  id: string;
  platform: 'twitter' | 'telegram' | 'reddit';
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timestamp: number;
  content: string;
  source: string;
}

interface SocialSignalIntegrationProps {
  onSignalReceived: (signal: SocialSignal) => void;
  enabledPairs: string[];
}

export default function SocialSignalIntegration({ onSignalReceived, enabledPairs }: SocialSignalIntegrationProps) {
  const [recentSignals, setRecentSignals] = useState<SocialSignal[]>([]);
  const [signalStrength, setSignalStrength] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Load saved signals from localStorage
    const savedSignals = localStorage.getItem('memebot_social_signals');
    if (savedSignals) {
      try {
        const parsedSignals = JSON.parse(savedSignals);
        setRecentSignals(parsedSignals);
        
        // Rebuild signal strength from saved signals
        const strength: Record<string, number> = {};
        parsedSignals.forEach((signal: SocialSignal) => {
          const symbol = signal.symbol;
          const current = strength[symbol] || 0;
          const adjustment = signal.sentiment === 'bullish' ? 
            signal.confidence * (signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1) :
            signal.sentiment === 'bearish' ? 
            -signal.confidence * (signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1) :
            0;
          
          strength[symbol] = Math.max(-100, Math.min(100, current + adjustment * 10));
        });
        
        setSignalStrength(strength);
      } catch (error) {
        console.error('Error parsing saved social signals:', error);
      }
    }
    
    // Simulate social signals for enabled pairs
    const interval = setInterval(() => {
      if (enabledPairs.length === 0) return;

      generateSocialSignal();
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [enabledPairs, onSignalReceived]);

  // Save signals to localStorage when they change
  useEffect(() => {
    if (recentSignals.length > 0) {
      localStorage.setItem('memebot_social_signals', JSON.stringify(recentSignals));
    }
  }, [recentSignals]);

  const generateSocialSignal = () => {
    if (enabledPairs.length === 0) return;
    
    const randomPair = enabledPairs[Math.floor(Math.random() * enabledPairs.length)];
    const symbol = randomPair.split('/')[0];
    
    const platforms = ['twitter', 'telegram', 'reddit'] as const;
    const sentiments = ['bullish', 'bearish', 'neutral'] as const;
    const impacts = ['high', 'medium', 'low'] as const;
    
    const signal: SocialSignal = {
      id: `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      symbol,
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      confidence: Math.random() * 0.4 + 0.6, // 60-100%
      impact: impacts[Math.floor(Math.random() * impacts.length)],
      timestamp: Date.now(),
      content: generateSignalContent(symbol, sentiments[Math.floor(Math.random() * sentiments.length)] as any),
      source: generateSource(platforms[Math.floor(Math.random() * platforms.length)])
    };

    setRecentSignals(prev => [signal, ...prev.slice(0, 9)]); // Keep last 10
    onSignalReceived(signal);
    setLastUpdate(new Date());

    // Update signal strength for the symbol
    setSignalStrength(prev => {
      const current = prev[symbol] || 0;
      const adjustment = signal.sentiment === 'bullish' ? 
        signal.confidence * (signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1) :
        signal.sentiment === 'bearish' ? 
        -signal.confidence * (signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1) :
        0;
      
      return {
        ...prev,
        [symbol]: Math.max(-100, Math.min(100, current + adjustment * 10))
      };
    });
  };

  const generateSignalContent = (symbol: string, sentiment: string) => {
    const bullishPhrases = [
      `${symbol} breaking out! 🚀`,
      `Massive ${symbol} pump incoming!`,
      `${symbol} to the moon! 🌙`,
      `${symbol} looking bullish AF`,
      `${symbol} whale activity detected`,
      `${symbol} breaking resistance!`
    ];
    
    const bearishPhrases = [
      `${symbol} dump alert! 📉`,
      `${symbol} breaking support`,
      `${symbol} looking weak`,
      `${symbol} sell pressure increasing`,
      `${symbol} bearish divergence`,
      `${symbol} correction incoming`
    ];
    
    const neutralPhrases = [
      `${symbol} consolidating`,
      `${symbol} sideways movement`,
      `${symbol} waiting for direction`,
      `${symbol} range bound`,
      `${symbol} accumulation phase`
    ];

    switch (sentiment) {
      case 'bullish': return bullishPhrases[Math.floor(Math.random() * bullishPhrases.length)];
      case 'bearish': return bearishPhrases[Math.floor(Math.random() * bearishPhrases.length)];
      default: return neutralPhrases[Math.floor(Math.random() * neutralPhrases.length)];
    }
  };

  const generateSource = (platform: string) => {
    const twitterSources = ['@cryptowhale', '@memecointrader', '@altcoinbuzz', '@cryptosignals'];
    const telegramSources = ['Crypto Signals', 'Meme Coin Pumps', 'Whale Watchers', 'DeFi Alerts'];
    const redditSources = ['r/CryptoCurrency', 'r/SatoshiStreetBets', 'r/CryptoMoonShots', 'r/altcoin'];

    switch (platform) {
      case 'twitter': return twitterSources[Math.floor(Math.random() * twitterSources.length)];
      case 'telegram': return telegramSources[Math.floor(Math.random() * telegramSources.length)];
      case 'reddit': return redditSources[Math.floor(Math.random() * redditSources.length)];
      default: return 'Unknown Source';
    }
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength > 50) return 'text-green-400';
    if (strength > 20) return 'text-green-300';
    if (strength > -20) return 'text-gray-400';
    if (strength > -50) return 'text-red-300';
    return 'text-red-400';
  };

  const getSignalStrengthBg = (strength: number) => {
    if (strength > 50) return 'bg-green-600';
    if (strength > 20) return 'bg-green-500';
    if (strength > -20) return 'bg-gray-500';
    if (strength > -50) return 'bg-red-500';
    return 'bg-red-600';
  };

  const refreshSignals = () => {
    setIsLoading(true);
    
    // Generate a few signals immediately
    for (let i = 0; i < 3; i++) {
      generateSocialSignal();
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Social Signal Integration</span>
        </h3>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-400">
            {recentSignals.length} recent signals
          </div>
          <button
            onClick={refreshSignals}
            disabled={isLoading}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-all"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Signal Strength Overview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Signal Strength by Coin</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(signalStrength)
            .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
            .slice(0, 6)
            .map(([symbol, strength]) => (
              <div key={symbol} className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{symbol}</span>
                  <span className={`text-sm font-bold ${getSignalStrengthColor(strength)}`}>
                    {strength > 0 ? '+' : ''}{strength.toFixed(0)}
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getSignalStrengthBg(strength)}`}
                    style={{ width: `${Math.abs(strength)}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Signals */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Social Signals</h4>
        {recentSignals.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            Waiting for social signals...
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentSignals.map(signal => (
              <div key={signal.id} className="bg-slate-700 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{signal.symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      signal.sentiment === 'bullish' ? 'bg-green-600' :
                      signal.sentiment === 'bearish' ? 'bg-red-600' : 'bg-gray-600'
                    }`}>
                      {signal.sentiment === 'bullish' ? <TrendingUp className="h-3 w-3" /> :
                       signal.sentiment === 'bearish' ? <TrendingDown className="h-3 w-3" /> :
                       <AlertTriangle className="h-3 w-3" />}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      signal.impact === 'high' ? 'bg-red-600' :
                      signal.impact === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                    }`}>
                      {signal.impact} impact
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  {signal.content}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{signal.platform}: {signal.source}</span>
                  <span>{(signal.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}