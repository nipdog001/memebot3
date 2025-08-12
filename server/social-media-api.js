import express from 'express';
import { WebSocketServer } from 'ws';

class SocialMediaMonitor {
    constructor() {
        this.isMonitoring = false;
        this.config = null;
        this.clients = new Set();
        this.signals = [];
        
        // Rate limits for different platforms
        this.rateLimits = {
            twitter: { requests: 0, limit: 300, window: 15 * 60 * 1000 }, // 300 per 15 min
            telegram: { requests: 0, limit: 30, window: 60 * 1000 }, // 30 per minute
            reddit: { requests: 0, limit: 60, window: 60 * 1000 } // 60 per minute
        };
    }

    setupRoutes(app) {
        // Start monitoring
        app.post('/api/social/start', (req, res) => {
            this.config = req.body;
            this.startMonitoring();
            res.json({ success: true, message: 'Social monitoring started' });
        });

        // Stop monitoring
        app.post('/api/social/stop', (req, res) => {
            this.stopMonitoring();
            res.json({ success: true, message: 'Social monitoring stopped' });
        });

        // Get configuration
        app.get('/api/social/config', (req, res) => {
            res.json(this.config || {});
        });

        // Get recent signals
        app.get('/api/social/signals', (req, res) => {
            res.json(this.signals.slice(0, 50)); // Last 50 signals
        });

        // Test API connections
        app.post('/api/social/test', async (req, res) => {
            const { platform, credentials } = req.body;
            
            try {
                const result = await this.testConnection(platform, credentials);
                res.json({ success: true, result });
            } catch (error) {
                res.json({ success: false, error: error.message });
            }
        });

        // Get popular feeds (for easy setup)
        app.get('/api/social/popular', (req, res) => {
            res.json({
                hashtags: [
                    '#DOGE', '#SHIB', '#PEPE', '#FLOKI', '#BONK', '#WIF', '#MYRO', '#POPCAT',
                    '#memecoin', '#altcoin', '#crypto', '#DeFi', '#NFT', '#Web3', '#blockchain',
                    '#bullish', '#bearish', '#HODL', '#pump', '#moon', '#diamond', '#hands'
                ],
                keywords: [
                    'meme coin', 'to the moon', 'diamond hands', 'HODL', 'pump', 'bullish',
                    'bearish', 'whale alert', 'breakout', 'support', 'resistance', 'ATH',
                    'buy the dip', 'paper hands', 'rocket', 'lambo', 'when moon'
                ],
                influencers: [
                    '@elonmusk', '@VitalikButerin', '@CoinDesk', '@cz_binance', '@justinsuntron',
                    '@APompliano', '@naval', '@balajis', '@aantonop', '@ErikVoorhees',
                    '@satoshilite', '@rogerkver', '@WhalePanda', '@CryptoCobain'
                ],
                telegramChannels: [
                    '@cryptosignals', '@memecoinpumps', '@whalewatchers', '@cryptonews',
                    '@binanceexchange', '@coinbase', '@krakenfx', '@cryptocom',
                    '@defiprotocol', '@nftcommunity', '@altcoindaily', '@cryptogemhunters'
                ],
                subreddits: [
                    'CryptoCurrency', 'SatoshiStreetBets', 'dogecoin', 'CryptoMoonShots',
                    'ethtrader', 'Bitcoin', 'altcoin', 'CryptoMarkets', 'DeFi', 'NFT',
                    'CryptoTechnology', 'BitcoinMarkets', 'ethereum', 'CryptoCurrencies'
                ]
            });
        });
    }

    async testConnection(platform, credentials) {
        switch (platform) {
            case 'twitter':
                return await this.testTwitterConnection(credentials.apiKey);
            case 'telegram':
                return await this.testTelegramConnection(credentials.botToken);
            case 'reddit':
                return await this.testRedditConnection(credentials.clientId, credentials.clientSecret);
            default:
                throw new Error('Unknown platform');
        }
    }

    async testTwitterConnection(apiKey) {
        // Simulate Twitter API test
        if (!apiKey || apiKey.length < 20) {
            throw new Error('Invalid Twitter API key');
        }
        
        return {
            status: 'connected',
            rateLimit: '300 requests per 15 minutes',
            features: ['hashtags', 'keywords', 'user_mentions', 'real_time_stream']
        };
    }

    async testTelegramConnection(botToken) {
        // Simulate Telegram API test
        if (!botToken || !botToken.includes(':')) {
            throw new Error('Invalid Telegram bot token');
        }
        
        return {
            status: 'connected',
            rateLimit: '30 requests per minute',
            features: ['public_channels', 'group_messages', 'bot_commands']
        };
    }

    async testRedditConnection(clientId, clientSecret) {
        // Simulate Reddit API test
        if (!clientId || !clientSecret) {
            throw new Error('Invalid Reddit credentials');
        }
        
        return {
            status: 'connected',
            rateLimit: '60 requests per minute',
            features: ['subreddit_posts', 'comments', 'trending', 'user_posts']
        };
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        console.log('🔍 Starting social media monitoring...');
        this.isMonitoring = true;
        
        // Start monitoring each enabled platform
        if (this.config.twitter.enabled) {
            this.startTwitterMonitoring();
        }
        
        if (this.config.telegram.enabled) {
            this.startTelegramMonitoring();
        }
        
        if (this.config.reddit.enabled) {
            this.startRedditMonitoring();
        }
        
        // Start signal processing
        this.startSignalProcessing();
    }

    stopMonitoring() {
        console.log('⏹️ Stopping social media monitoring...');
        this.isMonitoring = false;
    }

    startTwitterMonitoring() {
        console.log('🐦 Starting Twitter monitoring...');
        
        // Simulate Twitter stream
        const twitterInterval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(twitterInterval);
                return;
            }
            
            if (Math.random() < 0.3) { // 30% chance
                this.generateTwitterSignal();
            }
        }, 8000); // Every 8 seconds
    }

    startTelegramMonitoring() {
        console.log('📱 Starting Telegram monitoring...');
        
        // Simulate Telegram monitoring
        const telegramInterval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(telegramInterval);
                return;
            }
            
            if (Math.random() < 0.2) { // 20% chance
                this.generateTelegramSignal();
            }
        }, 12000); // Every 12 seconds
    }

    startRedditMonitoring() {
        console.log('🔴 Starting Reddit monitoring...');
        
        // Simulate Reddit monitoring
        const redditInterval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(redditInterval);
                return;
            }
            
            if (Math.random() < 0.25) { // 25% chance
                this.generateRedditSignal();
            }
        }, 10000); // Every 10 seconds
    }

    generateTwitterSignal() {
        const hashtags = this.config.twitter.hashtags;
        const keywords = this.config.twitter.keywords;
        const influencers = this.config.twitter.influencers;
        
        const memeCoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MYRO', 'POPCAT'];
        const sentiments = ['bullish', 'bearish', 'neutral'];
        
        const signal = {
            id: `twitter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            platform: 'twitter',
            type: Math.random() < 0.4 ? 'hashtag' : Math.random() < 0.7 ? 'keyword' : 'influencer',
            symbol: memeCoins[Math.floor(Math.random() * memeCoins.length)],
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            confidence: Math.random() * 0.4 + 0.6, // 60-100%
            impact: Math.random() < 0.2 ? 'high' : Math.random() < 0.6 ? 'medium' : 'low',
            timestamp: Date.now(),
            content: this.generateContent('twitter'),
            source: influencers[Math.floor(Math.random() * influencers.length)] || '@cryptotrader',
            engagement: Math.floor(Math.random() * 5000) + 100,
            retweets: Math.floor(Math.random() * 1000) + 10,
            likes: Math.floor(Math.random() * 10000) + 50
        };
        
        this.addSignal(signal);
    }

    generateTelegramSignal() {
        const channels = this.config.telegram.channels;
        const memeCoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MYRO', 'POPCAT'];
        const sentiments = ['bullish', 'bearish', 'neutral'];
        
        const signal = {
            id: `telegram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            platform: 'telegram',
            type: 'channel_message',
            symbol: memeCoins[Math.floor(Math.random() * memeCoins.length)],
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            confidence: Math.random() * 0.4 + 0.6,
            impact: Math.random() < 0.3 ? 'high' : Math.random() < 0.7 ? 'medium' : 'low',
            timestamp: Date.now(),
            content: this.generateContent('telegram'),
            source: channels[Math.floor(Math.random() * channels.length)] || '@cryptosignals',
            engagement: Math.floor(Math.random() * 2000) + 50,
            views: Math.floor(Math.random() * 10000) + 200
        };
        
        this.addSignal(signal);
    }

    generateRedditSignal() {
        const subreddits = this.config.reddit.subreddits;
        const memeCoins = ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'MYRO', 'POPCAT'];
        const sentiments = ['bullish', 'bearish', 'neutral'];
        
        const signal = {
            id: `reddit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            platform: 'reddit',
            type: Math.random() < 0.6 ? 'post' : 'comment',
            symbol: memeCoins[Math.floor(Math.random() * memeCoins.length)],
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            confidence: Math.random() * 0.4 + 0.6,
            impact: Math.random() < 0.25 ? 'high' : Math.random() < 0.65 ? 'medium' : 'low',
            timestamp: Date.now(),
            content: this.generateContent('reddit'),
            source: `r/${subreddits[Math.floor(Math.random() * subreddits.length)]}` || 'r/CryptoCurrency',
            engagement: Math.floor(Math.random() * 1000) + 20,
            upvotes: Math.floor(Math.random() * 500) + 10,
            comments: Math.floor(Math.random() * 100) + 5
        };
        
        this.addSignal(signal);
    }

    generateContent(platform) {
        const bullishContent = {
            twitter: [
                '🚀 This is going to the moon!',
                '💎 Diamond hands only!',
                '📈 Breakout incoming!',
                '🔥 Massive pump alert!',
                '⚡ Whale activity detected!'
            ],
            telegram: [
                '🎯 SIGNAL: Strong buy opportunity',
                '📊 Technical analysis shows bullish pattern',
                '💰 Profit target updated',
                '🚨 Breaking resistance level',
                '📈 Momentum building up'
            ],
            reddit: [
                'DD: Why this coin is undervalued',
                'Technical analysis shows bullish divergence',
                'Whale accumulation phase detected',
                'Breaking out of consolidation pattern',
                'Strong fundamentals + technical setup'
            ]
        };
        
        const bearishContent = {
            twitter: [
                '📉 Dump incoming, be careful!',
                '🐻 Bearish divergence spotted',
                '⚠️ Support level broken',
                '💸 Sell pressure increasing',
                '🔻 Correction phase starting'
            ],
            telegram: [
                '🚨 ALERT: Bearish signal detected',
                '📉 Technical indicators turning negative',
                '⚠️ Risk management advised',
                '🔻 Breaking support levels',
                '📊 Volume declining'
            ],
            reddit: [
                'Analysis: Why this might correct',
                'Bearish pattern forming on charts',
                'Fundamental concerns emerging',
                'Technical breakdown in progress',
                'Risk/reward ratio unfavorable'
            ]
        };
        
        const neutralContent = {
            twitter: [
                '📊 Sideways movement continues',
                '⏳ Waiting for direction',
                '🔄 Consolidation phase',
                '📈📉 Range-bound trading',
                '⚖️ Market indecision'
            ],
            telegram: [
                '📊 Market analysis: Neutral stance',
                '⏳ Waiting for clear signals',
                '🔄 Consolidation pattern observed',
                '📈 No clear direction yet',
                '⚖️ Balanced risk/reward'
            ],
            reddit: [
                'Market update: Sideways action',
                'Waiting for catalyst',
                'Accumulation vs distribution',
                'Technical analysis: Neutral',
                'No clear trend established'
            ]
        };
        
        const sentiment = Math.random() < 0.4 ? 'bullish' : Math.random() < 0.7 ? 'bearish' : 'neutral';
        const contentArray = sentiment === 'bullish' ? bullishContent[platform] : 
                            sentiment === 'bearish' ? bearishContent[platform] : 
                            neutralContent[platform];
        
        return contentArray[Math.floor(Math.random() * contentArray.length)];
    }

    addSignal(signal) {
        this.signals.unshift(signal);
        
        // Keep only last 1000 signals
        if (this.signals.length > 1000) {
            this.signals = this.signals.slice(0, 1000);
        }
        
        // Broadcast to connected clients
        this.broadcast({
            type: 'social_signal',
            data: signal
        });
        
        console.log(`📡 ${signal.platform.toUpperCase()}: ${signal.symbol} - ${signal.sentiment} (${(signal.confidence * 100).toFixed(0)}%)`);
    }

    startSignalProcessing() {
        // Process signals for trading decisions
        const processingInterval = setInterval(() => {
            if (!this.isMonitoring) {
                clearInterval(processingInterval);
                return;
            }
            
            this.processSignalsForTrading();
        }, 30000); // Every 30 seconds
    }

    processSignalsForTrading() {
        // Analyze recent signals for trading opportunities
        const recentSignals = this.signals.filter(s => 
            Date.now() - s.timestamp < 5 * 60 * 1000 // Last 5 minutes
        );
        
        if (recentSignals.length === 0) return;
        
        // Group by symbol
        const signalsBySymbol = recentSignals.reduce((acc, signal) => {
            if (!acc[signal.symbol]) acc[signal.symbol] = [];
            acc[signal.symbol].push(signal);
            return acc;
        }, {});
        
        // Analyze each symbol
        Object.entries(signalsBySymbol).forEach(([symbol, signals]) => {
            const analysis = this.analyzeSignals(symbol, signals);
            
            if (analysis.shouldTrade) {
                this.broadcast({
                    type: 'social_trading_signal',
                    data: {
                        symbol,
                        action: analysis.action,
                        confidence: analysis.confidence,
                        reasoning: analysis.reasoning,
                        signals: signals.length
                    }
                });
            }
        });
    }

    analyzeSignals(symbol, signals) {
        let bullishScore = 0;
        let bearishScore = 0;
        let totalWeight = 0;
        
        signals.forEach(signal => {
            const weight = signal.impact === 'high' ? 3 : signal.impact === 'medium' ? 2 : 1;
            const confidenceWeight = signal.confidence;
            const finalWeight = weight * confidenceWeight;
            
            if (signal.sentiment === 'bullish') {
                bullishScore += finalWeight;
            } else if (signal.sentiment === 'bearish') {
                bearishScore += finalWeight;
            }
            
            totalWeight += finalWeight;
        });
        
        const netScore = (bullishScore - bearishScore) / totalWeight;
        const confidence = Math.min(totalWeight / 5, 1); // Max confidence at 5 weighted signals
        
        return {
            shouldTrade: Math.abs(netScore) > 0.3 && confidence > 0.6,
            action: netScore > 0 ? 'buy' : 'sell',
            confidence: confidence,
            reasoning: `${signals.length} signals, net sentiment: ${netScore.toFixed(2)}`
        };
    }

    broadcast(message) {
        const messageStr = JSON.stringify(message);
        const deadClients = [];
        
        for (const client of this.clients) {
            try {
                if (client.readyState === client.OPEN) {
                    client.send(messageStr);
                } else {
                    deadClients.push(client);
                }
            } catch (error) {
                deadClients.push(client);
            }
        }
        
        deadClients.forEach(client => this.clients.delete(client));
    }

    setupWebSocket(wss) {
        wss.on('connection', (ws) => {
            this.clients.add(ws);
            
            // Send recent signals
            ws.send(JSON.stringify({
                type: 'social_signals_history',
                data: this.signals.slice(0, 20)
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }
}

export default SocialMediaMonitor;