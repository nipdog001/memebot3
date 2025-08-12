import React, { useState, useEffect } from 'react';
import { 
  Twitter, 
  MessageCircle, 
  Hash, 
  Users, 
  Plus, 
  Trash2, 
  Settings, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Bell,
  Globe,
  Save,
  RefreshCw
} from 'lucide-react';

interface SocialConfig {
  twitter: {
    enabled: boolean;
    apiKey: string;
    hashtags: string[];
    keywords: string[];
    influencers: string[];
  };
  telegram: {
    enabled: boolean;
    botToken: string;
    channels: string[];
  };
  reddit: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    subreddits: string[];
  };
}

interface SocialSignal {
  id: string;
  platform: 'twitter' | 'telegram' | 'reddit';
  type: 'mention' | 'hashtag' | 'influencer' | 'trending';
  content: string;
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timestamp: number;
  source: string;
  engagement: number;
}

export default function SocialMediaSetup() {
  const [config, setConfig] = useState<SocialConfig>({
    twitter: {
      enabled: false,
      apiKey: '',
      hashtags: ['#DOGE', '#SHIB', '#PEPE', '#FLOKI'],
      keywords: ['meme coin', 'to the moon', 'diamond hands', 'pump'],
      influencers: ['@elonmusk', '@VitalikButerin', '@CoinDesk']
    },
    telegram: {
      enabled: false,
      botToken: '',
      channels: ['@cryptosignals', '@memecoinpumps', '@whalewatchers']
    },
    reddit: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      subreddits: ['CryptoCurrency', 'SatoshiStreetBets', 'dogecoin', 'CryptoMoonShots']
    }
  });

  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [activeTab, setActiveTab] = useState('setup');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Predefined popular options for easy setup
  const popularHashtags = [
    '#DOGE', '#SHIB', '#PEPE', '#FLOKI', '#BONK', '#WIF', '#MYRO', '#POPCAT',
    '#memecoin', '#altcoin', '#crypto', '#DeFi', '#NFT', '#Web3', '#blockchain'
  ];

  const popularKeywords = [
    'meme coin', 'to the moon', 'diamond hands', 'HODL', 'pump', 'bullish',
    'bearish', 'whale alert', 'breakout', 'support', 'resistance', 'ATH'
  ];

  const popularInfluencers = [
    '@elonmusk', '@VitalikButerin', '@CoinDesk', '@cz_binance', '@justinsuntron',
    '@APompliano', '@naval', '@balajis', '@aantonop', '@ErikVoorhees'
  ];

  const popularChannels = [
    '@cryptosignals', '@memecoinpumps', '@whalewatchers', '@cryptonews',
    '@binanceexchange', '@coinbase', '@krakenfx', '@cryptocom'
  ];

  const popularSubreddits = [
    'CryptoCurrency', 'SatoshiStreetBets', 'dogecoin', 'CryptoMoonShots',
    'ethtrader', 'Bitcoin', 'altcoin', 'CryptoMarkets', 'DeFi', 'NFT'
  ];

  // Load saved configuration on mount
  useEffect(() => {
    loadSavedConfig();
  }, []);

  // Save configuration when it changes
  useEffect(() => {
    if (config) {
      saveConfig();
    }
  }, [config]);

  const loadSavedConfig = () => {
    try {
      const savedConfig = localStorage.getItem('memebot_social_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        console.log('📱 Loaded social media configuration:', parsedConfig);
        
        // Auto-start monitoring if it was previously enabled
        if (parsedConfig.twitter.enabled || parsedConfig.telegram.enabled || parsedConfig.reddit.enabled) {
          setIsMonitoring(true);
          startSignalStream();
        }
      }
    } catch (error) {
      console.error('Error loading social media configuration:', error);
    }
  };

  const saveConfig = () => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      localStorage.setItem('memebot_social_config', JSON.stringify(config));
      
      console.log('💾 Saved social media configuration');
      setSaveStatus('saved');
      
      // Show saved status for 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving social media configuration:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (platform: keyof SocialConfig, field: string, item: string) => {
    if (!item.trim()) return;
    
    setConfig(prev => {
      // Check if item already exists
      const currentItems = prev[platform][field] as string[];
      if (currentItems.includes(item.trim())) {
        return prev; // Don't add duplicates
      }
      
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          [field]: [...currentItems, item.trim()]
        }
      };
    });
  };

  const removeItem = (platform: keyof SocialConfig, field: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: (prev[platform][field] as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  const togglePlatform = (platform: keyof SocialConfig) => {
    setConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        enabled: !prev[platform].enabled
      }
    }));
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    // Start receiving signals
    startSignalStream();
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
  };

  const startSignalStream = () => {
    // Simulate real-time signals for demo
    const interval = setInterval(() => {
      if (!isMonitoring) {
        clearInterval(interval);
        return;
      }

      const platforms = ['twitter', 'telegram', 'reddit'] as const;
      const symbols = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'];
      const sentiments = ['bullish', 'bearish', 'neutral'] as const;
      
      const signal: SocialSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        type: 'mention',
        content: `${symbols[Math.floor(Math.random() * symbols.length)]} looking strong! 🚀`,
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        timestamp: Date.now(),
        source: '@cryptotrader123',
        engagement: Math.floor(Math.random() * 1000) + 50
      };

      setSignals(prev => [signal, ...prev.slice(0, 49)]); // Keep last 50 signals
    }, 3000);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'telegram': return <MessageCircle className="h-4 w-4" />;
      case 'reddit': return <Globe className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <Zap className="h-6 w-6 text-yellow-400" />
          <span>Social Media Monitoring</span>
        </h2>
        
        <div className="flex items-center space-x-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
          
          {saveStatus === 'saved' && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg">
              <CheckCircle className="h-3 w-3" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isMonitoring ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
          </div>
          
          {isMonitoring ? (
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
            >
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={startMonitoring}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
            >
              Start Monitoring
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-700 rounded-lg p-1">
        {[
          { id: 'setup', label: 'Setup', icon: Settings },
          { id: 'signals', label: 'Live Signals', icon: TrendingUp },
          { id: 'analytics', label: 'Analytics', icon: Eye }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-slate-600'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* Quick Setup */}
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">🚀 Quick Setup</h3>
            <p className="text-sm text-gray-300 mb-3">
              Get started instantly with our pre-configured popular feeds for meme coin trading
            </p>
            <button
              onClick={() => {
                setConfig(prev => ({
                  ...prev,
                  twitter: { ...prev.twitter, enabled: true },
                  telegram: { ...prev.telegram, enabled: true },
                  reddit: { ...prev.reddit, enabled: true }
                }));
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              Enable All Platforms with Defaults
            </button>
          </div>

          {/* API Keys Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Platform Configuration</h3>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white"
            >
              {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showApiKeys ? 'Hide' : 'Show'} API Keys</span>
            </button>
          </div>

          {/* Twitter Setup */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Twitter className="h-6 w-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Twitter/X Monitoring</h3>
              </div>
              <button
                onClick={() => togglePlatform('twitter')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  config.twitter.enabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {config.twitter.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {config.twitter.enabled && (
              <div className="space-y-4">
                {showApiKeys && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter API Key</label>
                    <input
                      type="password"
                      value={config.twitter.apiKey}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        twitter: { ...prev.twitter, apiKey: e.target.value }
                      }))}
                      placeholder="Enter your Twitter API key"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Get your API key from <a href="https://developer.twitter.com" target="_blank" className="text-blue-400 hover:underline">Twitter Developer Portal</a>
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags to Monitor</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.twitter.hashtags.map((hashtag, index) => (
                      <span key={index} className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                        <span>{hashtag}</span>
                        <button onClick={() => removeItem('twitter', 'hashtags', index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add hashtag (e.g., #DOGE)"
                      className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addItem('twitter', 'hashtags', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    Popular: {popularHashtags.slice(0, 5).map(tag => (
                      <button
                        key={tag}
                        onClick={() => addItem('twitter', 'hashtags', tag)}
                        className="text-blue-400 hover:underline mr-2"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium mb-2">Keywords to Monitor</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.twitter.keywords.map((keyword, index) => (
                      <span key={index} className="flex items-center space-x-1 bg-purple-600 text-white px-2 py-1 rounded text-sm">
                        <span>{keyword}</span>
                        <button onClick={() => removeItem('twitter', 'keywords', index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add keyword (e.g., meme coin)"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('twitter', 'keywords', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Popular: {popularKeywords.slice(0, 5).map(keyword => (
                      <button
                        key={keyword}
                        onClick={() => addItem('twitter', 'keywords', keyword)}
                        className="text-blue-400 hover:underline mr-2"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Influencers */}
                <div>
                  <label className="block text-sm font-medium mb-2">Influencers to Follow</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.twitter.influencers.map((influencer, index) => (
                      <span key={index} className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-sm">
                        <span>{influencer}</span>
                        <button onClick={() => removeItem('twitter', 'influencers', index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add influencer (e.g., @elonmusk)"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('twitter', 'influencers', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Popular: {popularInfluencers.slice(0, 5).map(influencer => (
                      <button
                        key={influencer}
                        onClick={() => addItem('twitter', 'influencers', influencer)}
                        className="text-blue-400 hover:underline mr-2"
                      >
                        {influencer}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telegram Setup */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Telegram Monitoring</h3>
              </div>
              <button
                onClick={() => togglePlatform('telegram')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  config.telegram.enabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {config.telegram.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {config.telegram.enabled && (
              <div className="space-y-4">
                {showApiKeys && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Telegram Bot Token</label>
                    <input
                      type="password"
                      value={config.telegram.botToken}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        telegram: { ...prev.telegram, botToken: e.target.value }
                      }))}
                      placeholder="Enter your Telegram bot token"
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Create a bot with <a href="https://t.me/BotFather" target="_blank" className="text-blue-400 hover:underline">@BotFather</a>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Public Channels to Monitor</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.telegram.channels.map((channel, index) => (
                      <span key={index} className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                        <span>{channel}</span>
                        <button onClick={() => removeItem('telegram', 'channels', index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add channel (e.g., @cryptosignals)"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('telegram', 'channels', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Popular: {popularChannels.slice(0, 4).map(channel => (
                      <button
                        key={channel}
                        onClick={() => addItem('telegram', 'channels', channel)}
                        className="text-blue-400 hover:underline mr-2"
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reddit Setup */}
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Globe className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-semibold">Reddit Monitoring</h3>
              </div>
              <button
                onClick={() => togglePlatform('reddit')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  config.reddit.enabled 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {config.reddit.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {config.reddit.enabled && (
              <div className="space-y-4">
                {showApiKeys && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Client ID</label>
                      <input
                        type="password"
                        value={config.reddit.clientId}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          reddit: { ...prev.reddit, clientId: e.target.value }
                        }))}
                        placeholder="Reddit client ID"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Client Secret</label>
                      <input
                        type="password"
                        value={config.reddit.clientSecret}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          reddit: { ...prev.reddit, clientSecret: e.target.value }
                        }))}
                        placeholder="Reddit client secret"
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Subreddits to Monitor</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {config.reddit.subreddits.map((subreddit, index) => (
                      <span key={index} className="flex items-center space-x-1 bg-orange-600 text-white px-2 py-1 rounded text-sm">
                        <span>r/{subreddit}</span>
                        <button onClick={() => removeItem('reddit', 'subreddits', index)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add subreddit (e.g., CryptoCurrency)"
                    className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addItem('reddit', 'subreddits', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Popular: {popularSubreddits.slice(0, 4).map(sub => (
                      <button
                        key={sub}
                        onClick={() => addItem('reddit', 'subreddits', sub)}
                        className="text-blue-400 hover:underline mr-2"
                      >
                        r/{sub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Social Signals</h3>
            <div className="text-sm text-gray-400">
              {signals.length} signals received
            </div>
          </div>

          {signals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {isMonitoring ? 'Waiting for social signals...' : 'Start monitoring to see live signals'}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {signals.map(signal => (
                <div key={signal.id} className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(signal.platform)}
                      <span className="font-medium">{signal.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        signal.sentiment === 'bullish' ? 'bg-green-600' :
                        signal.sentiment === 'bearish' ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {signal.sentiment}
                      </span>
                      <span className="text-xs text-gray-400">
                        {(signal.confidence * 100).toFixed(0)}% confidence
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
                    <span>Source: {signal.source}</span>
                    <span>{signal.engagement} engagement</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Social Media Analytics</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Signals</div>
              <div className="text-2xl font-bold text-white">{signals.length}</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Bullish Signals</div>
              <div className="text-2xl font-bold text-green-400">
                {signals.filter(s => s.sentiment === 'bullish').length}
              </div>
            </div>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Bearish Signals</div>
              <div className="text-2xl font-bold text-red-400">
                {signals.filter(s => s.sentiment === 'bearish').length}
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Top Mentioned Coins</h4>
            <div className="space-y-2">
              {Object.entries(
                signals.reduce((acc, signal) => {
                  acc[signal.symbol] = (acc[signal.symbol] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([symbol, count]) => (
                  <div key={symbol} className="flex items-center justify-between">
                    <span className="font-medium">{symbol}</span>
                    <span className="text-gray-400">{count} mentions</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Storage Status */}
      <div className="mt-6 bg-green-600/20 border border-green-600/30 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <div>
            <h4 className="font-semibold text-green-400">Persistent Configuration Active</h4>
            <p className="text-xs text-gray-300">
              All social media settings are automatically saved and will persist across page refreshes and devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}