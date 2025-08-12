import React, { useState, useEffect } from 'react';
import { 
  Twitter, 
  MessageCircle, 
  Globe, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Check, 
  AlertTriangle,
  Users,
  Hash,
  AtSign,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: 'twitter' | 'telegram' | 'reddit';
  type: 'user' | 'channel' | 'hashtag' | 'keyword';
  handle: string;
  displayName: string;
  followers?: number;
  isVerified?: boolean;
  enabled: boolean;
  isDefault: boolean;
  lastActivity?: string;
  signalStrength: number;
}

interface IndividualSocialAccountsProps {
  onAccountsChange: (accounts: SocialAccount[]) => void;
}

export default function IndividualSocialAccounts({ onAccountsChange }: IndividualSocialAccountsProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [newAccount, setNewAccount] = useState({
    platform: 'twitter' as const,
    type: 'user' as const,
    handle: '',
    displayName: ''
  });
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load accounts from localStorage
    loadAccounts();
  }, []);

  useEffect(() => {
    // Save accounts to localStorage whenever they change
    if (accounts.length > 0) {
      saveAccounts();
    }
  }, [accounts]);

  const loadAccounts = () => {
    try {
      const savedAccounts = localStorage.getItem('memebot_social_accounts');
      if (savedAccounts) {
        const parsedAccounts = JSON.parse(savedAccounts);
        setAccounts(parsedAccounts);
        onAccountsChange(parsedAccounts);
        console.log('📱 Loaded social accounts:', parsedAccounts.length);
      } else {
        // Initialize with default accounts if none exist
        initializeDefaultAccounts();
      }
    } catch (error) {
      console.error('Error loading social accounts:', error);
      initializeDefaultAccounts();
    }
  };

  const saveAccounts = () => {
    try {
      setIsSaving(true);
      localStorage.setItem('memebot_social_accounts', JSON.stringify(accounts));
      onAccountsChange(accounts);
      console.log('💾 Saved social accounts:', accounts.length);
    } catch (error) {
      console.error('Error saving social accounts:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const initializeDefaultAccounts = () => {
    // Initialize with default accounts
    const defaultAccounts: SocialAccount[] = [
      // Twitter Defaults
      {
        id: 'twitter_elon',
        platform: 'twitter',
        type: 'user',
        handle: '@elonmusk',
        displayName: 'Elon Musk',
        followers: 150000000,
        isVerified: true,
        enabled: true,
        isDefault: true,
        lastActivity: '2 hours ago',
        signalStrength: 95
      },
      {
        id: 'twitter_vitalik',
        platform: 'twitter',
        type: 'user',
        handle: '@VitalikButerin',
        displayName: 'Vitalik Buterin',
        followers: 5200000,
        isVerified: true,
        enabled: true,
        isDefault: true,
        lastActivity: '4 hours ago',
        signalStrength: 88
      },
      {
        id: 'twitter_coindesk',
        platform: 'twitter',
        type: 'user',
        handle: '@CoinDesk',
        displayName: 'CoinDesk',
        followers: 1800000,
        isVerified: true,
        enabled: true,
        isDefault: true,
        lastActivity: '1 hour ago',
        signalStrength: 82
      },
      {
        id: 'twitter_doge_hashtag',
        platform: 'twitter',
        type: 'hashtag',
        handle: '#DOGE',
        displayName: 'Dogecoin Hashtag',
        enabled: true,
        isDefault: true,
        lastActivity: '15 minutes ago',
        signalStrength: 76
      },
      {
        id: 'twitter_memecoin_keyword',
        platform: 'twitter',
        type: 'keyword',
        handle: 'meme coin',
        displayName: 'Meme Coin Keyword',
        enabled: true,
        isDefault: true,
        lastActivity: '30 minutes ago',
        signalStrength: 71
      },

      // Telegram Defaults
      {
        id: 'telegram_cryptosignals',
        platform: 'telegram',
        type: 'channel',
        handle: '@cryptosignals',
        displayName: 'Crypto Signals',
        followers: 250000,
        enabled: true,
        isDefault: true,
        lastActivity: '20 minutes ago',
        signalStrength: 84
      },
      {
        id: 'telegram_memepumps',
        platform: 'telegram',
        type: 'channel',
        handle: '@memecoinpumps',
        displayName: 'Meme Coin Pumps',
        followers: 180000,
        enabled: true,
        isDefault: true,
        lastActivity: '45 minutes ago',
        signalStrength: 79
      },
      {
        id: 'telegram_whalewatchers',
        platform: 'telegram',
        type: 'channel',
        handle: '@whalewatchers',
        displayName: 'Whale Watchers',
        followers: 320000,
        enabled: true,
        isDefault: true,
        lastActivity: '1 hour ago',
        signalStrength: 87
      },

      // Reddit Defaults
      {
        id: 'reddit_cryptocurrency',
        platform: 'reddit',
        type: 'channel',
        handle: 'r/CryptoCurrency',
        displayName: 'r/CryptoCurrency',
        followers: 6800000,
        enabled: true,
        isDefault: true,
        lastActivity: '10 minutes ago',
        signalStrength: 91
      },
      {
        id: 'reddit_satoshistreetbets',
        platform: 'reddit',
        type: 'channel',
        handle: 'r/SatoshiStreetBets',
        displayName: 'r/SatoshiStreetBets',
        followers: 420000,
        enabled: true,
        isDefault: true,
        lastActivity: '25 minutes ago',
        signalStrength: 85
      },
      {
        id: 'reddit_dogecoin',
        platform: 'reddit',
        type: 'channel',
        handle: 'r/dogecoin',
        displayName: 'r/dogecoin',
        followers: 2300000,
        enabled: true,
        isDefault: true,
        lastActivity: '35 minutes ago',
        signalStrength: 78
      }
    ];

    setAccounts(defaultAccounts);
    onAccountsChange(defaultAccounts);
    saveAccounts();
  };

  const addAccount = () => {
    if (!newAccount.handle.trim()) return;

    // Check for duplicates
    const isDuplicate = accounts.some(account => 
      account.platform === newAccount.platform && 
      account.handle.toLowerCase() === newAccount.handle.trim().toLowerCase()
    );

    if (isDuplicate) {
      alert('This account is already being monitored.');
      return;
    }

    const account: SocialAccount = {
      id: `${newAccount.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform: newAccount.platform,
      type: newAccount.type,
      handle: newAccount.handle.trim(),
      displayName: newAccount.displayName.trim() || newAccount.handle.trim(),
      enabled: true,
      isDefault: false,
      lastActivity: 'Just added',
      signalStrength: Math.floor(Math.random() * 30) + 50 // 50-80 for new accounts
    };

    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    
    setNewAccount({
      platform: 'twitter',
      type: 'user',
      handle: '',
      displayName: ''
    });
    setShowAddForm(false);
  };

  const removeAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account?.isDefault) {
      alert('Cannot remove default accounts. You can disable them instead.');
      return;
    }

    const updatedAccounts = accounts.filter(a => a.id !== accountId);
    setAccounts(updatedAccounts);
  };

  const toggleAccount = (accountId: string) => {
    const updatedAccounts = accounts.map(account =>
      account.id === accountId ? { ...account, enabled: !account.enabled } : account
    );
    setAccounts(updatedAccounts);
  };

  const updateAccount = (accountId: string, updates: Partial<SocialAccount>) => {
    const updatedAccounts = accounts.map(account =>
      account.id === accountId ? { ...account, ...updates } : account
    );
    setAccounts(updatedAccounts);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />;
      case 'telegram': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'reddit': return <Globe className="h-4 w-4 text-orange-500" />;
      default: return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <AtSign className="h-3 w-3" />;
      case 'channel': return <Hash className="h-3 w-3" />;
      case 'hashtag': return <Hash className="h-3 w-3" />;
      case 'keyword': return <Hash className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getSignalStrengthColor = (strength: number) => {
    if (strength >= 85) return 'text-green-400 bg-green-400';
    if (strength >= 70) return 'text-yellow-400 bg-yellow-400';
    return 'text-red-400 bg-red-400';
  };

  const formatFollowers = (followers?: number) => {
    if (!followers) return 'N/A';
    if (followers >= 1000000) return `${(followers / 1000000).toFixed(1)}M`;
    if (followers >= 1000) return `${(followers / 1000).toFixed(0)}K`;
    return followers.toString();
  };

  const groupedAccounts = accounts.reduce((groups, account) => {
    if (!groups[account.platform]) groups[account.platform] = [];
    groups[account.platform].push(account);
    return groups;
  }, {} as Record<string, SocialAccount[]>);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Individual Social Accounts</h3>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
            {accounts.filter(a => a.enabled).length} Active
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {isSaving && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Add Account Form */}
      {showAddForm && (
        <div className="bg-slate-700 rounded-lg p-4 mb-6 border border-slate-600">
          <h4 className="font-semibold text-white mb-3">Add New Social Account</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Platform</label>
              <select
                value={newAccount.platform}
                onChange={(e) => setNewAccount(prev => ({ 
                  ...prev, 
                  platform: e.target.value as any,
                  type: e.target.value === 'reddit' ? 'channel' : 'user'
                }))}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
              >
                <option value="twitter">Twitter/X</option>
                <option value="telegram">Telegram</option>
                <option value="reddit">Reddit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
              >
                {newAccount.platform === 'twitter' && (
                  <>
                    <option value="user">User Account</option>
                    <option value="hashtag">Hashtag</option>
                    <option value="keyword">Keyword</option>
                  </>
                )}
                {newAccount.platform === 'telegram' && (
                  <>
                    <option value="channel">Channel</option>
                    <option value="user">User</option>
                  </>
                )}
                {newAccount.platform === 'reddit' && (
                  <>
                    <option value="channel">Subreddit</option>
                    <option value="user">User</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {newAccount.type === 'hashtag' ? 'Hashtag' : 
                 newAccount.type === 'keyword' ? 'Keyword' : 
                 newAccount.type === 'channel' && newAccount.platform === 'reddit' ? 'Subreddit' :
                 'Handle/Username'}
              </label>
              <input
                type="text"
                value={newAccount.handle}
                onChange={(e) => setNewAccount(prev => ({ ...prev, handle: e.target.value }))}
                placeholder={
                  newAccount.type === 'hashtag' ? '#DOGE' :
                  newAccount.type === 'keyword' ? 'meme coin' :
                  newAccount.type === 'channel' && newAccount.platform === 'reddit' ? 'r/CryptoCurrency' :
                  newAccount.platform === 'telegram' ? '@cryptosignals' : '@username'
                }
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name (Optional)</label>
              <input
                type="text"
                value={newAccount.displayName}
                onChange={(e) => setNewAccount(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Friendly name for display"
                className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={addAccount}
              disabled={!newAccount.handle.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Add Account</span>
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Lists by Platform */}
      <div className="space-y-6">
        {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => (
          <div key={platform} className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              {getPlatformIcon(platform)}
              <h4 className="font-semibold text-white capitalize">{platform}</h4>
              <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                {platformAccounts.filter(a => a.enabled).length}/{platformAccounts.length} active
              </span>
            </div>

            <div className="space-y-3">
              {platformAccounts.map(account => (
                <div
                  key={account.id}
                  className={`bg-slate-600 rounded-lg p-3 border ${
                    account.enabled ? 'border-slate-500' : 'border-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center space-x-1">
                        {getTypeIcon(account.type)}
                        <span className="font-medium text-white">{account.displayName}</span>
                        {account.isVerified && (
                          <Check className="h-4 w-4 text-blue-400" />
                        )}
                        {account.isDefault && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">DEFAULT</span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-400">
                        {account.handle}
                      </div>
                      
                      {account.followers && (
                        <div className="text-xs text-gray-500">
                          {formatFollowers(account.followers)} followers
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className={`text-xs font-bold ${getSignalStrengthColor(account.signalStrength).split(' ')[0]}`}>
                          {account.signalStrength}%
                        </div>
                        <div className="text-xs text-gray-400">Signal</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-gray-300">{account.lastActivity}</div>
                        <div className="text-xs text-gray-400">Last Activity</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleAccount(account.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            account.enabled
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-600 text-gray-400'
                          }`}
                        >
                          {account.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        {!account.isDefault && (
                          <button
                            onClick={() => removeAccount(account.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 bg-slate-700 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3">Monitoring Summary</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-blue-400">
              {accounts.filter(a => a.platform === 'twitter' && a.enabled).length}
            </div>
            <div className="text-xs text-gray-400">Twitter Accounts</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-500">
              {accounts.filter(a => a.platform === 'telegram' && a.enabled).length}
            </div>
            <div className="text-xs text-gray-400">Telegram Channels</div>
          </div>
          <div>
            <div className="text-xl font-bold text-orange-500">
              {accounts.filter(a => a.platform === 'reddit' && a.enabled).length}
            </div>
            <div className="text-xs text-gray-400">Reddit Sources</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">
              {(accounts.filter(a => a.enabled).reduce((sum, a) => sum + a.signalStrength, 0) / 
                accounts.filter(a => a.enabled).length || 0).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Avg Signal Strength</div>
          </div>
        </div>
      </div>

      {/* Persistent Storage Status */}
      <div className="mt-6 bg-green-600/20 border border-green-600/30 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-green-400" />
          <div>
            <h4 className="font-semibold text-green-400">Persistent Storage Active</h4>
            <p className="text-xs text-gray-300">
              All social accounts are automatically saved and will persist across page refreshes and devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}