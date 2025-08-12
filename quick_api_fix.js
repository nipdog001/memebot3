// quick_fix.js - Test and fix API key loading
import 'dotenv/config'; // Load .env file
import exchangeService from './server/services/exchangeService.js';

async function quickFix() {
    console.log('🔧 QUICK API KEY FIX TEST');
    console.log('=========================');
    
    // Test 1: Check if dotenv loaded the keys
    console.log('\n1. 🔑 CHECKING ENVIRONMENT VARIABLES');
    console.log('------------------------------------');
    
    const requiredKeys = {
        'COINBASE_API_KEY': process.env.COINBASE_API_KEY,
        'COINBASE_API_SECRET': process.env.COINBASE_API_SECRET,
        'KRAKEN_API_KEY': process.env.KRAKEN_API_KEY,
        'KRAKEN_API_SECRET': process.env.KRAKEN_API_SECRET,
        'BINANCEUS_API_KEY': process.env.BINANCEUS_API_KEY,
        'BINANCEUS_API_SECRET': process.env.BINANCEUS_API_SECRET
    };
    
    let foundKeys = 0;
    Object.entries(requiredKeys).forEach(([key, value]) => {
        if (value && value.length > 5) {
            foundKeys++;
            console.log(`✅ ${key}: Found (${value.substring(0, 8)}...)`);
        } else {
            console.log(`❌ ${key}: Missing or too short`);
        }
    });
    
    if (foundKeys === 0) {
        console.log('\n❌ NO API KEYS FOUND!');
        console.log('\n🔧 TROUBLESHOOTING STEPS:');
        console.log('   1. Check if .env file exists in project root');
        console.log('   2. Verify .env format: KEY=value (no spaces)');
        console.log('   3. Make sure variable names match exactly');
        console.log('   4. Restart your terminal/application');
        return;
    }
    
    console.log(`\n✅ Found ${foundKeys}/6 required API keys`);
    
    // Test 2: Try to initialize exchange service
    console.log('\n2. 🔄 TESTING EXCHANGE INITIALIZATION');
    console.log('------------------------------------');
    
    try {
        await exchangeService.initialize();
        
        if (exchangeService.initialized) {
            console.log('✅ Exchange service initialized successfully!');
            
            if (exchangeService.realDataValidated) {
                console.log('✅ Real data validation: PASSED');
                
                const dataStats = exchangeService.getDataSourceStats();
                console.log(`📊 Validated exchanges: ${dataStats.validatedExchanges.length}`);
                console.log(`📈 Real data percentage: ${dataStats.realDataPercentage}%`);
                
                console.log('\n🚀 SUCCESS! Your ML system is ready to use real data!');
                
            } else {
                console.log('⚠️ Real data validation: FAILED');
                console.log('This might be due to API permissions or network issues');
            }
            
        } else {
            console.log('❌ Exchange service failed to initialize');
        }
        
    } catch (error) {
        console.log(`❌ Initialization error: ${error.message}`);
        
        if (error.message.includes('API')) {
            console.log('\n💡 This looks like an API key issue:');
            console.log('   • Check if your API keys are valid');
            console.log('   • Ensure API keys have the right permissions');
            console.log('   • Try regenerating your API keys');
        }
    }
    
    console.log('\n=========================');
    console.log('🎯 QUICK FIX COMPLETE');
    console.log('=========================');
}

// Run the quick fix
quickFix().catch(console.error);