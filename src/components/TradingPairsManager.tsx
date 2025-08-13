import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  Filter, 
  Search,
  Check,
  X,
  AlertTriangle,
  Info,
  Save
} from 'lucide-react';
import exchangeDataService from '../services/exchangeDataService';

interface TradingPair {
  symbol: string;
  base: string;
  quote: string;
  exchange: string;
  enabled: boolean;
  isMeme: boolean;
  price: number;
  volume24h: number;
  priceChange24h: number;
}

export default function TradingPairsManager() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadTradingPairs();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      refreshPrices(true);
    }, 10000); // Refresh every 10 seconds silently
    
    return () => clearInterval(interval);
  }, []);

  const loadTradingPairs = async () => {
    setIsLoading(true);
    
    try {
      // Try to load from server
      const data = await exchangeDataService.getTradingPairs();
      if (data && data.pairs) {
          // Convert server format to component format
          const formattedPairs = Object.entries(data.pairs).map(([symbol, pairData]: [string, any]) => ({
            symbol,
            base: symbol.split('/')[0],
            quote: symbol.split('/')[1],
            exchange: pairData.exchange || 'global',
            enabled: pairData.enabled,
            isMeme: true,
            price: pairData.price || Math.random() * 0.1 + 0.001,
            volume24h: pairData.volume24h || Math.random() * 1000000,
            priceChange24h: pairData.change24h || (Math.random() - 0.5) * 20
          }));
          
          setPairs(formattedPairs);
          setLastUpdated(new Date());
          console.log('Loaded trading pairs from server:', formattedPairs.length);
      } else {
        // Fallback to localStorage
        const savedPairs = localStorage.getItem('tradingPairs');
        if (savedPairs) {
          const parsedPairs = JSON.parse(savedPairs);
          const flatPairs = Object.values(parsedPairs.exchanges || {}).flat();
          setPairs(flatPairs as TradingPair[]);
          setLastUpdated(new Date());
          console.log('Loaded trading pairs from localStorage:', flatPairs.length);
        } else {
          // Initialize with default pairs
          initializeDefaultPairs();
        }
      }
    } catch (error) {
      console.error('Error loading trading pairs:', error);
      // Fallback to localStorage
      const savedPairs = localStorage.getItem('tradingPairs');
      if (savedPairs) {
        const parsedPairs = JSON.parse(savedPairs);
        const flatPairs = Object.values(parsedPairs.exchanges || {}).flat();
        setPairs(flatPairs as TradingPair[]);
      } else {
        initializeDefaultPairs();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultPairs = () => {
    const defaultPairs: TradingPair[] = [
      { symbol: 'DOGE/USDT', base: 'DOGE', quote: 'USDT', exchange: 'coinbase', enabled: true, isMeme: true, price: 0.12, volume24h: 1500000, priceChange24h: 2.5 },
      { symbol: 'SHIB/USDT', base: 'SHIB', quote: 'USDT', exchange: 'coinbase', enabled: true, isMeme: true, price: 0.00002, volume24h: 2500000, priceChange24h: -1.2 },
      { symbol: 'PEPE/USDT', base: 'PEPE', quote: 'USDT', exchange: 'coinbase', enabled: true, isMeme: true, price: 0.000008, volume24h: 1200000, priceChange24h: 5.7 },
      { symbol: 'FLOKI/USDT', base: 'FLOKI', quote: 'USDT', exchange: 'kraken', enabled: true, isMeme: true, price: 0.0002, volume24h: 800000, priceChange24h: 3.2 },
      { symbol: 'BONK/USDT', base: 'BONK', quote: 'USDT', exchange: 'binanceus', enabled: true, isMeme: true, price: 0.00001, volume24h: 950000, priceChange24h: -2.1 },
      { symbol: 'WIF/USDT', base: 'WIF', quote: 'USDT', exchange: 'kraken', enabled: true, isMeme: true, price: 0.0015, volume24h: 750000, priceChange24h: 8.3 },
      { symbol: 'MYRO/USDT', base: 'MYRO', quote: 'USDT', exchange: 'binanceus', enabled: true, isMeme: true, price: 0.0005, volume24h: 650000, priceChange24h: -4.2 },
      { symbol: 'POPCAT/USDT', base: 'POPCAT', quote: 'USDT', exchange: 'coinbase', enabled: true, isMeme: true, price: 0.0003, volume24h: 550000, priceChange24h: 6.7 }
    ];
    
    setPairs(defaultPairs);
    setLastUpdated(new Date());
    console.log('Initialized default trading pairs:', defaultPairs.length);
    
    // Save to localStorage
    const tradingPairsObj = {
      exchanges: {
        global: defaultPairs
      },
      enabledPairs: defaultPairs.filter(p => p.enabled).length
    };
    localStorage.setItem('tradingPairs', JSON.stringify(tradingPairsObj));
  };

  const refreshPrices = (silent = false) => {
    if (!silent) setIsLoading(true);
    
    // Update prices with small random changes
    setPairs(prev => prev.map(pair => ({
      ...pair,
      price: pair.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% price movement
      priceChange24h: pair.priceChange24h + (Math.random() - 0.5) * 0.5, // Small change adjustment
      volume24h: Math.max(1000, pair.volume24h * (1 + (Math.random() - 0.5) * 0.05)) // ±5% volume change
    })));
    
    setLastUpdated(new Date());
    
    if (!silent) {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  const togglePair = (symbol: string) => {
    setPairs(prev => prev.map(pair => 
      pair.symbol === symbol ? { ...pair, enabled: !pair.enabled } : pair
    ));
    
    // Update localStorage
    const updatedPairs = pairs.map(pair => 
      pair.symbol === symbol ? { ...pair, enabled: !pair.enabled } : pair
    );
    
    // Update backend
    const targetPair = updatedPairs.find(p => p.symbol === symbol);
    if (targetPair) {
      exchangeDataService.toggleTradingPair(symbol, targetPair.enabled).catch(error => {
        console.error('Failed to update backend:', error);
      });
    }
    
    const tradingPairsObj = {
      exchanges: {
        global: updatedPairs
      },
      enabledPairs: updatedPairs.filter(p => p.enabled).length
    };
    
    localStorage.setItem('tradingPairs', JSON.stringify(tradingPairsObj));
    
    // Notify via custom event
    window.dispatchEvent(new CustomEvent('tradingPairsUpdate', { 
      detail: { 
        allPairs: tradingPairsObj.exchanges.global.reduce((acc: any, pair: TradingPair) => {
          acc[pair.symbol] = { enabled: pair.enabled };
          return acc;
        }, {})
      } 
    }));
  };

  const toggleAllPairs = (enabled: boolean) => {
    setPairs(prev => prev.map(pair => ({ ...pair, enabled })));
    
    // Update localStorage
    const updatedPairs = pairs.map(pair => ({ ...pair, enabled }));
    
    const tradingPairsObj = {
      exchanges: {
        global: updatedPairs
      },
      enabledPairs: enabled ? updatedPairs.length : 0
    };
    
    localStorage.setItem('tradingPairs', JSON.stringify(tradingPairsObj));
    
    // Notify via custom event
    window.dispatchEvent(new CustomEvent('tradingPairsUpdate', { 
      detail: { 
        allPairs: tradingPairsObj.exchanges.global.reduce((acc: any, pair: TradingPair) => {
          acc[pair.symbol] = { enabled };
          return acc;
        }, {})
      } 
    }));
    
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const saveConfiguration = () => {
    setIsSaving(true);
    
    // Save to localStorage
    const tradingPairsObj = {
      exchanges: {
        global: pairs
      },
      enabledPairs: pairs.filter(p => p.enabled).length
    };
    
    localStorage.setItem('tradingPairs', JSON.stringify(tradingPairsObj));
    
    // Notify via custom event
    window.dispatchEvent(new CustomEvent('tradingPairsUpdate', { 
      detail: { 
        allPairs: tradingPairsObj.exchanges.global.reduce((acc: any, pair: TradingPair) => {
          acc[pair.symbol] = { enabled: pair.enabled };
          return acc;
        }, {})
      } 
    }));
    
    setTimeout(() => setIsSaving(false), 1000);
  };

  const getFilteredPairs = () => {
    let filteredPairs = [...pairs];
    
    // Apply filter
    if (filter === 'enabled') {
      filteredPairs = filteredPairs.filter(pair => pair.enabled);
    } else if (filter === 'disabled') {
      filteredPairs = filteredPairs.filter(pair => !pair.enabled);
    } else if (filter === 'meme') {
      filteredPairs = filteredPairs.filter(pair => pair.isMeme);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredPairs = filteredPairs.filter(pair => 
        pair.symbol.toLowerCase().includes(query) || 
        pair.exchange.toLowerCase().includes(query)
      );
    }
    
    // Sort by price change (highest first)
    return filteredPairs.sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h));
  };

  const formatPrice = (price: number) => {
    if (price < 0.001) return price.toFixed(6);
    if (price < 0.01) return price.toFixed(4);
    if (price < 1) return price.toFixed(3);
    return price.toFixed(2);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return volume.toFixed(0);
  };

  const filteredPairs = getFilteredPairs();
  const enabledCount = filteredPairs.filter(p => p.enabled).length;
  const totalCount = filteredPairs.length;

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Coins className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Trading Pairs</h2>
          <div className="text-sm text-gray-400">
            {enabledCount} of {totalCount} pairs enabled
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isSaving && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg">
              <Check className="h-4 w-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          <button
            onClick={() => refreshPrices()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Refreshing...' : 'Refresh Prices'}</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <div className="flex bg-slate-700 rounded-lg p-1">
            {[
              { id: 'all', label: 'All Pairs' },
              { id: 'enabled', label: 'Enabled' },
              { id: 'disabled', label: 'Disabled' },
              { id: 'meme', label: 'Meme Coins' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-3 py-1 rounded-md text-sm transition-all ${
                  filter === option.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white w-64"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleAllPairs(true)}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all"
            >
              <Eye className="h-4 w-4" />
              <span>Enable All</span>
            </button>
            <button
              onClick={() => toggleAllPairs(false)}
              className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
            >
              <EyeOff className="h-4 w-4" />
              <span>Disable All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pairs List */}
      {isLoading && pairs.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading trading pairs...</p>
        </div>
      ) : filteredPairs.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No trading pairs found. Try changing your filters or refreshing.</p>
          <button
            onClick={initializeDefaultPairs}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            Initialize Default Pairs
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-gray-400">Symbol</th>
                <th className="text-left py-3 px-4 text-gray-400">Exchange</th>
                <th className="text-right py-3 px-4 text-gray-400">Price</th>
                <th className="text-right py-3 px-4 text-gray-400">24h Change</th>
                <th className="text-right py-3 px-4 text-gray-400">Volume</th>
                <th className="text-center py-3 px-4 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPairs.map((pair, index) => (
                <tr key={`${pair.exchange}-${pair.symbol}-${index}`} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{pair.symbol}</span>
                      {pair.isMeme && (
                        <span className="text-xs bg-orange-600 text-white px-1 rounded">MEME</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{pair.exchange}</td>
                  <td className="py-3 px-4 text-right text-white">${formatPrice(pair.price)}</td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    pair.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <div className="flex items-center justify-end space-x-1">
                      {pair.priceChange24h >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">${formatVolume(pair.volume24h)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => togglePair(pair.symbol)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        pair.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {pair.enabled ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-xs text-gray-400">
          {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
        </div>
        <button
          onClick={saveConfiguration}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all"
        >
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
}