// scripts/verifyMLSetup.js
// Run this script to verify your ML learning setup
// Usage: node scripts/verifyMLSetup.js

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

console.log('🔍 Verifying ML Trading Enhancement Setup...\n');

async function verifySetup() {
    let score = 0;
    const maxScore = 10;
    const issues = [];
    const recommendations = [];

    // 1. Check environment variables
    console.log('1️⃣ Checking Environment Variables...');
    const requiredEnvVars = [
        'NODE_ENV',
        'PAPER_TRADING',
        'ML_LEARNING_ENABLED',
        'REAL_DATA_VALIDATION'
    ];
    
    const exchangeKeys = [
        'COINBASE_API_KEY',
        'KRAKEN_API_KEY',
        'BINANCEUS_API_KEY',
        'CRYPTOCOM_API_KEY'
    ];

    let envScore = 0;
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`   ✅ ${varName}: ${process.env[varName]}`);
            envScore += 0.5;
        } else {
            console.log(`   ❌ ${varName}: Missing`);
            issues.push(`Missing required environment variable: ${varName}`);
        }
    });

    // Check exchange keys
    let hasAnyExchangeKey = false;
    exchangeKeys.forEach(key => {
        if (process.env[key]) {
            console.log(`   ✅ ${key}: Set`);
            hasAnyExchangeKey = true;
        }
    });

    if (!hasAnyExchangeKey) {
        console.log('   ⚠️  No exchange API keys found');
        recommendations.push('Add at least one exchange API key for real data');
    } else {
        envScore += 2;
    }

    score += envScore;
    console.log(`   Score: ${envScore}/4\n`);

    // 2. Check ML Learning Service file
    console.log('2️⃣ Checking ML Learning Service...');
    const mlServicePath = path.join(__dirname, '..', 'server', 'services', 'mlLearningService.js');
    try {
        await fs.access(mlServicePath);
        console.log('   ✅ ML Learning Service file exists');
        
        // Check file content
        const content = await fs.readFile(mlServicePath, 'utf8');
        if (content.includes('class MLLearningService')) {
            console.log('   ✅ ML Learning Service class found');
            score += 1;
        } else {
            console.log('   ❌ ML Learning Service class not found');
            issues.push('ML Learning Service file exists but class is missing');
        }
    } catch (error) {
        console.log('   ❌ ML Learning Service file missing');
        issues.push('ML Learning Service file not found at: ' + mlServicePath);
        recommendations.push('Create mlLearningService.js using the provided code');
    }
    console.log(`   Score: ${score - (score - 1)}/1\n`);

    // 3. Check Real Data Tracker enhancements
    console.log('3️⃣ Checking Real Data Tracker Enhancements...');
    const realDataPath = path.join(__dirname, '..', 'server', 'services', 'realDataTracker.js');
    try {
        const content = await fs.readFile(realDataPath, 'utf8');
        const requiredMethods = [
            'getMarketSnapshot',
            'calculateRealisticSlippage',
            'validateTradeAgainstMarket',
            'calculateVolatility',
            'assessLiquidity'
        ];

        let methodsFound = 0;
        requiredMethods.forEach(method => {
            if (content.includes(method)) {
                console.log(`   ✅ ${method} found`);
                methodsFound++;
            } else {
                console.log(`   ❌ ${method} missing`);
                issues.push(`Missing method in realDataTracker: ${method}`);
            }
        });

        score += (methodsFound / requiredMethods.length) * 2;
    } catch (error) {
        console.log('   ❌ Real Data Tracker file not accessible');
        issues.push('Cannot read realDataTracker.js');
    }
    console.log(`   Score: ${(score % 2).toFixed(1)}/2\n`);

    // 4. Check ML Trading Engine enhancements
    console.log('4️⃣ Checking ML Trading Engine Enhancements...');
    const mlEnginePath = path.join(__dirname, '..', 'server', 'services', 'mlTradingEngine.js');
    try {
        const content = await fs.readFile(mlEnginePath, 'utf8');
        const requiredEnhancements = [
            'analyzeOpportunityWithMarketConditions',
            'updateExecutionMetrics',
            'applyLearningInsights',
            'getEnhancedStatistics'
        ];

        let enhancementsFound = 0;
        requiredEnhancements.forEach(enhancement => {
            if (content.includes(enhancement)) {
                console.log(`   ✅ ${enhancement} found`);
                enhancementsFound++;
            } else {
                console.log(`   ❌ ${enhancement} missing`);
                recommendations.push(`Add ${enhancement} method to mlTradingEngine.js`);
            }
        });

        score += (enhancementsFound / requiredEnhancements.length) * 1;
    } catch (error) {
        console.log('   ❌ ML Trading Engine file not accessible');
        issues.push('Cannot read mlTradingEngine.js');
    }
    console.log(`   Score: ${(score % 1).toFixed(1)}/1\n`);

    // 5. Check Exchange Service enhancements
    console.log('5️⃣ Checking Exchange Service Enhancements...');
    const exchangeServicePath = path.join(__dirname, '..', 'server', 'services', 'exchangeService.js');
    try {
        const content = await fs.readFile(exchangeServicePath, 'utf8');
        if (content.includes('executePaperTradeRealistically')) {
            console.log('   ✅ Realistic paper trading method found');
            score += 1;
        } else {
            console.log('   ❌ Realistic paper trading method missing');
            recommendations.push('Add executePaperTradeRealistically method to exchangeService.js');
        }
        
        if (content.includes('getExchangeFees')) {
            console.log('   ✅ Exchange fees method found');
            score += 0.5;
        } else {
            console.log('   ❌ Exchange fees method missing');
        }
    } catch (error) {
        console.log('   ❌ Exchange Service file not accessible');
        issues.push('Cannot read exchangeService.js');
    }
    console.log(`   Score: ${(score % 1.5).toFixed(1)}/1.5\n`);

    // 6. Check server endpoints
    console.log('6️⃣ Checking Server API Endpoints...');
    const serverPath = path.join(__dirname, '..', 'server', 'enhanced-server.js');
    try {
        const content = await fs.readFile(serverPath, 'utf8');
        const requiredEndpoints = [
            '/api/ml/insights',
            '/api/ml/statistics'
        ];

        let endpointsFound = 0;
        requiredEndpoints.forEach(endpoint => {
            if (content.includes(endpoint)) {
                console.log(`   ✅ ${endpoint} endpoint found`);
                endpointsFound++;
            } else {
                console.log(`   ❌ ${endpoint} endpoint missing`);
                recommendations.push(`Add ${endpoint} endpoint to server`);
            }
        });

        score += (endpointsFound / requiredEndpoints.length) * 0.5;
    } catch (error) {
        console.log('   ❌ Server file not accessible');
        issues.push('Cannot read enhanced-server.js');
    }
    console.log(`   Score: ${(score % 0.5).toFixed(1)}/0.5\n`);

    // Final Report
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 VERIFICATION REPORT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Score: ${score.toFixed(1)}/${maxScore}`);
    console.log(`Status: ${score >= 8 ? '✅ READY' : score >= 6 ? '⚠️ MOSTLY READY' : '❌ NOT READY'}`);
    
    if (issues.length > 0) {
        console.log('\n🚨 Issues Found:');
        issues.forEach((issue, i) => {
            console.log(`   ${i + 1}. ${issue}`);
        });
    }

    if (recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });
    }

    // Next steps
    console.log('\n📝 Next Steps:');
    if (score >= 8) {
        console.log('   1. Start your server with: npm run dev');
        console.log('   2. Monitor ML learning progress in ml_learning_data.json');
        console.log('   3. Run paper trades for at least 1000 trades');
        console.log('   4. Check ML insights at http://localhost:3001/api/ml/insights');
        console.log('   5. When ready, switch PAPER_TRADING=false in .env');
    } else {
        console.log('   1. Fix the issues listed above');
        console.log('   2. Add missing methods and endpoints');
        console.log('   3. Set up environment variables properly');
        console.log('   4. Run this verification script again');
    }

    console.log('\n✨ Good luck with your ML trading bot!');
}

// Test ML learning data file
async function testMLLearningFile() {
    console.log('\n7️⃣ Testing ML Learning Data File...');
    const mlDataPath = path.join(process.cwd(), 'ml_learning_data.json');
    
    try {
        // Try to create a test entry
        const testData = {
            trades: [],
            marketConditions: [],
            modelPerformance: {},
            patterns: [],
            lastUpdate: Date.now()
        };
        
        await fs.writeFile(mlDataPath, JSON.stringify(testData, null, 2));
        console.log('   ✅ ML learning data file created successfully');
        
        // Try to read it back
        const readData = await fs.readFile(mlDataPath, 'utf8');
        const parsed = JSON.parse(readData);
        console.log('   ✅ ML learning data file is readable');
        
        return true;
    } catch (error) {
        console.log('   ❌ Cannot create/read ML learning data file');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

// Run verification
(async () => {
    try {
        await verifySetup();
        await testMLLearningFile();
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
})();