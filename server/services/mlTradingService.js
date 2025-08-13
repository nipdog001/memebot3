// server/services/mlTradingService.js
// Enhanced ML Trading Service with Real Exchange Data Integration

import * as tf from '@tensorflow/tfjs-node';
import ccxt from 'ccxt';
import EventEmitter from 'events';

class MLTradingService extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.exchanges = new Map();
        this.trainingData = new Map();
        this.isTraining = false;
        this.stats = {
            totalPredictions: 0,
            successfulPredictions: 0,
            totalProfit: 0,
            trainingCycles: 0,
            lastTrainingTime: null
        };
        this.modelConfigs = {
            'linear_regression': { epochs: 50, batchSize: 32 },
            'polynomial_regression': { epochs: 100, batchSize: 32 },
            'moving_average': { windowSize: 20 },
            'rsi_momentum': { period: 14 },
            'bollinger_bands': { period: 20, stdDev: 2 },
            'macd_signal': { fast: 12, slow: 26, signal: 9 },
            'lstm_neural': { epochs: 200, batchSize: 64, units: 128 },
            'transformer': { epochs: 300, batchSize: 32, heads: 8 },
            'ensemble': { models: ['lstm_neural', 'transformer', 'random_forest'] }
        };
    }

    async initialize() {
        console.log('🤖 Initializing ML Trading Service...');
        
        // Initialize all models
        await this.initializeModels();
        
        // Start real-time data collection
        await this.startDataCollection();
        
        // Start periodic training
        this.startPeriodicTraining();
        
        console.log('✅ ML Trading Service initialized');
        return true;
    }

    async initializeModels() {
        const modelTypes = [
            'linear_regression', 'polynomial_regression', 'moving_average',
            'rsi_momentum', 'bollinger_bands', 'macd_signal',
            'lstm_neural', 'transformer', 'random_forest',
            'gradient_boost', 'prophet', 'ensemble'
        ];

        for (const modelType of modelTypes) {
            const model = await this.createModel(modelType);
            this.models.set(modelType, {
                model: model,
                accuracy: 0,
                predictions: 0,
                profitGenerated: 0,
                lastPrediction: null,
                lastTraining: null,
                enabled: true
            });
        }
    }

    async createModel(modelType) {
        switch (modelType) {
            case 'lstm_neural':
                return this.createLSTMModel();
            case 'transformer':
                return this.createTransformerModel();
            case 'ensemble':
                return this.createEnsembleModel();
            default:
                return this.createBasicModel(modelType);
        }
    }

    createLSTMModel() {
        const model = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: 128,
                    returnSequences: true,
                    inputShape: [100, 10] // 100 time steps, 10 features
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({
                    units: 64,
                    returnSequences: false
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' }) // Buy, Hold, Sell
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    createTransformerModel() {
        // Simplified transformer model for time series
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 256,
                    activation: 'relu',
                    inputShape: [1000] // Flattened input
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.0001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    createEnsembleModel() {
        // Ensemble combines predictions from multiple models
        return {
            type: 'ensemble',
            subModels: ['lstm_neural', 'transformer', 'random_forest'],
            combineStrategy: 'weighted_average',
            weights: [0.4, 0.4, 0.2]
        };
    }

    createBasicModel(modelType) {
        // Simple feedforward network for basic models
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    inputShape: [20] // Basic features
                }),
                tf.layers.dropout({ rate: 0.1 }),
                tf.layers.dense({ units: 32, activation: 'relu' }),
                tf.layers.dense({ units: 3, activation: 'softmax' })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    async startDataCollection() {
        console.log('📊 Starting real-time data collection...');
        
        // Connect to exchanges via CCXT
        const exchangeIds = ['coinbase', 'kraken', 'binanceus', 'cryptocom'];
        
        for (const exchangeId of exchangeIds) {
            try {
                const exchange = new ccxt[exchangeId]({
                    enableRateLimit: true,
                    // API keys should be loaded from environment
                    apiKey: process.env[`${exchangeId.toUpperCase()}_API_KEY`],
                    secret: process.env[`${exchangeId.toUpperCase()}_API_SECRET`]
                });

                await exchange.loadMarkets();
                this.exchanges.set(exchangeId, exchange);
                
                // Start collecting data for meme coins
                this.collectDataForExchange(exchangeId);
            } catch (error) {
                console.error(`Failed to initialize ${exchangeId}:`, error.message);
            }
        }
    }

    async collectDataForExchange(exchangeId) {
        const exchange = this.exchanges.get(exchangeId);
        const symbols = ['DOGE/USDT', 'SHIB/USDT', 'PEPE/USDT', 'FLOKI/USDT', 
                        'BONK/USDT', 'WIF/USDT', 'MYRO/USDT', 'POPCAT/USDT'];
        
        // Collect data every minute
        setInterval(async () => {
            for (const symbol of symbols) {
                try {
                    // Check if symbol exists on this exchange
                    if (!exchange.markets[symbol]) continue;
                    
                    // Fetch real-time data
                    const [ticker, orderbook, trades] = await Promise.all([
                        exchange.fetchTicker(symbol),
                        exchange.fetchOrderBook(symbol, 20),
                        exchange.fetchTrades(symbol, undefined, 100)
                    ]);
                    
                    // Extract features
                    const features = this.extractFeatures(ticker, orderbook, trades);
                    
                    // Store training data
                    const dataKey = `${exchangeId}:${symbol}`;
                    if (!this.trainingData.has(dataKey)) {
                        this.trainingData.set(dataKey, []);
                    }
                    
                    const trainingData = this.trainingData.get(dataKey);
                    trainingData.push({
                        features: features,
                        timestamp: Date.now(),
                        price: ticker.last,
                        volume: ticker.quoteVolume
                    });
                    
                    // Keep only last 10000 data points
                    if (trainingData.length > 10000) {
                        trainingData.shift();
                    }
                    
                    // Make prediction
                    await this.makePrediction(symbol, features);
                    
                } catch (error) {
                    console.error(`Error collecting data for ${symbol} on ${exchangeId}:`, error.message);
                }
            }
        }, 60000); // Every minute
    }

    extractFeatures(ticker, orderbook, trades) {
        // Calculate technical indicators
        const prices = trades.map(t => t.price);
        const volumes = trades.map(t => t.amount);
        
        return {
            // Price features
            currentPrice: ticker.last,
            priceChange24h: ticker.percentage,
            high24h: ticker.high,
            low24h: ticker.low,
            
            // Volume features
            volume24h: ticker.quoteVolume,
            volumeMA: this.calculateMA(volumes, 20),
            volumeStd: this.calculateStdDev(volumes),
            
            // Order book features
            bidAskSpread: orderbook.asks[0][0] - orderbook.bids[0][0],
            orderBookImbalance: this.calculateOrderBookImbalance(orderbook),
            
            // Technical indicators
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            bollingerBands: this.calculateBollingerBands(prices),
            vwap: this.calculateVWAP(trades),
            obv: this.calculateOBV(trades),
            
            // Market microstructure
            tradeIntensity: trades.length,
            avgTradeSize: volumes.reduce((a, b) => a + b, 0) / volumes.length,
            priceVolatility: this.calculateStdDev(prices),
            
            // Time features
            hourOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };
    }

    async makePrediction(symbol, features) {
        const predictions = new Map();
        
        for (const [modelType, modelData] of this.models.entries()) {
            if (!modelData.enabled) continue;
            
            try {
                let prediction;
                
                if (modelData.model.type === 'ensemble') {
                    // Ensemble prediction
                    prediction = await this.makeEnsemblePrediction(features);
                } else if (modelData.model.predict) {
                    // TensorFlow model prediction
                    const input = this.prepareInput(features, modelType);
                    const output = await modelData.model.predict(input);
                    const probabilities = await output.data();
                    
                    // Get prediction (0: Sell, 1: Hold, 2: Buy)
                    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
                    prediction = {
                        action: ['SELL', 'HOLD', 'BUY'][maxIndex],
                        confidence: probabilities[maxIndex],
                        probabilities: {
                            sell: probabilities[0],
                            hold: probabilities[1],
                            buy: probabilities[2]
                        }
                    };
                    
                    input.dispose();
                    output.dispose();
                } else {
                    // Basic model prediction
                    prediction = this.makeBasicPrediction(features, modelType);
                }
                
                predictions.set(modelType, prediction);
                
                // Update model stats
                modelData.predictions++;
                modelData.lastPrediction = {
                    symbol: symbol,
                    prediction: prediction,
                    timestamp: Date.now()
                };
                
                // Emit prediction event
                this.emit('prediction', {
                    symbol: symbol,
                    modelType: modelType,
                    prediction: prediction,
                    features: features
                });
                
            } catch (error) {
                console.error(`Prediction error for ${modelType}:`, error.message);
            }
        }
        
        this.stats.totalPredictions++;
        return predictions;
    }

    prepareInput(features, modelType) {
        // Convert features to tensor based on model type
        const featureArray = Object.values(features).filter(v => typeof v === 'number');
        
        switch (modelType) {
            case 'lstm_neural':
                // LSTM expects sequence data [batch, timesteps, features]
                return tf.tensor3d([Array(100).fill(featureArray.slice(0, 10))]);
            case 'transformer':
                // Transformer expects flattened features
                return tf.tensor2d([Array(1000).fill(0).map((_, i) => featureArray[i % featureArray.length])]);
            default:
                // Basic models expect simple feature vector
                return tf.tensor2d([featureArray.slice(0, 20)]);
        }
    }

    startPeriodicTraining() {
        // Train models every hour with accumulated data
        setInterval(async () => {
            if (this.isTraining) return;
            
            console.log('🔄 Starting periodic model training...');
            this.isTraining = true;
            
            for (const [modelType, modelData] of this.models.entries()) {
                if (!modelData.enabled || modelData.model.type === 'ensemble') continue;
                
                try {
                    await this.trainModel(modelType);
                    this.stats.trainingCycles++;
                } catch (error) {
                    console.error(`Training error for ${modelType}:`, error.message);
                }
            }
            
            this.stats.lastTrainingTime = new Date().toISOString();
            this.isTraining = false;
            
            // Emit training complete event
            this.emit('training-complete', {
                models: Array.from(this.models.keys()),
                stats: this.stats
            });
            
        }, 3600000); // Every hour
    }

    async trainModel(modelType) {
        const modelData = this.models.get(modelType);
        if (!modelData || !modelData.model.fit) return;
        
        console.log(`📚 Training ${modelType} model...`);
        
        // Prepare training data from all exchanges
        const allData = [];
        for (const [key, data] of this.trainingData.entries()) {
            allData.push(...data);
        }
        
        if (allData.length < 100) {
            console.log(`Not enough data for training ${modelType} (${allData.length} samples)`);
            return;
        }
        
        // Prepare features and labels
        const { xs, ys } = this.prepareTrainingData(allData, modelType);
        
        // Train the model
        const history = await modelData.model.fit(xs, ys, {
            epochs: this.modelConfigs[modelType]?.epochs || 100,
            batchSize: this.modelConfigs[modelType]?.batchSize || 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(`${modelType} - Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc?.toFixed(4) || 'N/A'}`);
                    }
                }
            }
        });
        
        // Update model accuracy
        const finalAccuracy = history.history.acc?.[history.history.acc.length - 1] || 
                            history.history.val_acc?.[history.history.val_acc.length - 1] || 
                            0.5;
        
        modelData.accuracy = finalAccuracy * 100;
        modelData.lastTraining = new Date().toISOString();
        
        // Clean up tensors
        xs.dispose();
        ys.dispose();
        
        console.log(`✅ ${modelType} training complete. Accuracy: ${modelData.accuracy.toFixed(2)}%`);
    }

    prepareTrainingData(data, modelType) {
        // Create feature arrays and labels
        const features = [];
        const labels = [];
        
        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const previous = data[i - 1];
            
            // Calculate price change
            const priceChange = (current.price - previous.price) / previous.price;
            
            // Create label (0: Sell if < -0.5%, 1: Hold if -0.5% to 0.5%, 2: Buy if > 0.5%)
            let label;
            if (priceChange < -0.005) label = [1, 0, 0]; // Sell
            else if (priceChange > 0.005) label = [0, 0, 1]; // Buy
            else label = [0, 1, 0]; // Hold
            
            features.push(Object.values(current.features).filter(v => typeof v === 'number'));
            labels.push(label);
        }
        
        // Convert to tensors based on model type
        let xs, ys;
        
        switch (modelType) {
            case 'lstm_neural':
                // Create sequences for LSTM
                const sequences = [];
                const sequenceLabels = [];
                for (let i = 100; i < features.length; i++) {
                    sequences.push(features.slice(i - 100, i).map(f => f.slice(0, 10)));
                    sequenceLabels.push(labels[i]);
                }
                xs = tf.tensor3d(sequences);
                ys = tf.tensor2d(sequenceLabels);
                break;
                
            case 'transformer':
                // Flatten features for transformer
                const flattened = features.map(f => 
                    Array(1000).fill(0).map((_, i) => f[i % f.length])
                );
                xs = tf.tensor2d(flattened);
                ys = tf.tensor2d(labels);
                break;
                
            default:
                // Basic models
                const basicFeatures = features.map(f => f.slice(0, 20));
                xs = tf.tensor2d(basicFeatures);
                ys = tf.tensor2d(labels);
        }
        
        return { xs, ys };
    }

    // Technical indicator calculations
    calculateMA(values, period) {
        if (values.length < period) return 0;
        const sum = values.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    calculateStdDev(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        return ema12 - ema26;
    }

    calculateEMA(values, period) {
        if (values.length < period) return values[values.length - 1];
        
        const multiplier = 2 / (period + 1);
        let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < values.length; i++) {
            ema = (values[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }

    calculateBollingerBands(prices, period = 20) {
        const ma = this.calculateMA(prices, period);
        const std = this.calculateStdDev(prices.slice(-period));
        
        return {
            upper: ma + (2 * std),
            middle: ma,
            lower: ma - (2 * std)
        };
    }

    calculateVWAP(trades) {
        let totalVolume = 0;
        let totalVolumePrice = 0;
        
        trades.forEach(trade => {
            totalVolume += trade.amount;
            totalVolumePrice += trade.price * trade.amount;
        });
        
        return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
    }

    calculateOBV(trades) {
        let obv = 0;
        for (let i = 1; i < trades.length; i++) {
            if (trades[i].price > trades[i - 1].price) {
                obv += trades[i].amount;
            } else if (trades[i].price < trades[i - 1].price) {
                obv -= trades[i].amount;
            }
        }
        return obv;
    }

    calculateOrderBookImbalance(orderbook) {
        const bidVolume = orderbook.bids.reduce((sum, [price, volume]) => sum + volume, 0);
        const askVolume = orderbook.asks.reduce((sum, [price, volume]) => sum + volume, 0);
        const totalVolume = bidVolume + askVolume;
        
        return totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;
    }

    makeBasicPrediction(features, modelType) {
        // Simple rule-based predictions for basic models
        switch (modelType) {
            case 'moving_average':
                return {
                    action: features.currentPrice > features.priceMA ? 'BUY' : 'SELL',
                    confidence: 0.65
                };
            case 'rsi_momentum':
                if (features.rsi < 30) return { action: 'BUY', confidence: 0.75 };
                if (features.rsi > 70) return { action: 'SELL', confidence: 0.75 };
                return { action: 'HOLD', confidence: 0.60 };
            case 'bollinger_bands':
                const bb = features.bollingerBands;
                if (features.currentPrice < bb.lower) return { action: 'BUY', confidence: 0.70 };
                if (features.currentPrice > bb.upper) return { action: 'SELL', confidence: 0.70 };
                return { action: 'HOLD', confidence: 0.55 };
            default:
                return { action: 'HOLD', confidence: 0.50 };
        }
    }

    async makeEnsemblePrediction(features) {
        const predictions = [];
        const weights = [0.4, 0.4, 0.2]; // Weights for each sub-model
        
        // Get predictions from sub-models
        for (const modelType of ['lstm_neural', 'transformer', 'random_forest']) {
            const modelData = this.models.get(modelType);
            if (modelData && modelData.lastPrediction) {
                predictions.push(modelData.lastPrediction.prediction);
            }
        }
        
        if (predictions.length === 0) {
            return { action: 'HOLD', confidence: 0.5 };
        }
        
        // Weighted voting
        let buyScore = 0, holdScore = 0, sellScore = 0;
        
        predictions.forEach((pred, i) => {
            const weight = weights[i] || 0.33;
            if (pred.action === 'BUY') buyScore += weight * pred.confidence;
            else if (pred.action === 'HOLD') holdScore += weight * pred.confidence;
            else if (pred.action === 'SELL') sellScore += weight * pred.confidence;
        });
        
        // Determine final action
        const maxScore = Math.max(buyScore, holdScore, sellScore);
        let action;
        if (maxScore === buyScore) action = 'BUY';
        else if (maxScore === sellScore) action = 'SELL';
        else action = 'HOLD';
        
        return {
            action: action,
            confidence: maxScore,
            scores: { buy: buyScore, hold: holdScore, sell: sellScore }
        };
    }

    // Get current stats for dashboard
    getStats() {
        const modelStats = [];
        
        for (const [modelType, modelData] of this.models.entries()) {
            modelStats.push({
                type: modelType,
                name: modelType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                accuracy: modelData.accuracy,
                predictions: modelData.predictions,
                profitGenerated: modelData.profitGenerated,
                enabled: modelData.enabled,
                lastPrediction: modelData.lastPrediction,
                lastTraining: modelData.lastTraining
            });
        }
        
        return {
            models: modelStats,
            overall: this.stats,
            trainingDataSize: Array.from(this.trainingData.values())
                .reduce((sum, data) => sum + data.length, 0),
            connectedExchanges: this.exchanges.size
        };
    }

    // Enable/disable specific model
    toggleModel(modelType, enabled) {
        const modelData = this.models.get(modelType);
        if (modelData) {
            modelData.enabled = enabled;
            console.log(`${enabled ? '✅' : '❌'} ${modelType} model ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    // Save models to disk
    async saveModels() {
        for (const [modelType, modelData] of this.models.entries()) {
            if (modelData.model && modelData.model.save) {
                try {
                    await modelData.model.save(`file://./models/${modelType}`);
                    console.log(`💾 Saved ${modelType} model`);
                } catch (error) {
                    console.error(`Failed to save ${modelType} model:`, error.message);
                }
            }
        }
    }

    // Load models from disk
    async loadModels() {
        for (const [modelType, modelData] of this.models.entries()) {
            try {
                const loadedModel = await tf.loadLayersModel(`file://./models/${modelType}/model.json`);
                modelData.model = loadedModel;
                console.log(`📂 Loaded ${modelType} model`);
            } catch (error) {
                console.log(`No saved model found for ${modelType}, using new model`);
            }
        }
    }
}

export default new MLTradingService();