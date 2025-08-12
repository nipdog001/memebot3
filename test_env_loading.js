// test_env.js - Test if .env file is loading properly
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file explicitly
config({ path: path.join(__dirname, '.env') });

console.log('🔍 TESTING ENVIRONMENT VARIABLES LOADING');
console.log('========================================');

// Check if .env file exists
import fs from 'fs';
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log(`📁 .env file exists: ${envExists ? 'YES' : 'NO'}`);
console.log(`📍 Looking for .env at: ${envPath}`);

if (envExists) {
    // Read and show first few lines (without sensitive data)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').slice(0, 10);
    console.log('\n📄 First 10 lines of .env file:');
    lines.forEach((line, i) => {
        if (line.trim() && !line.startsWith('#')) {
            const [key] = line.split('=');
            console.log(`   ${i + 1}. ${key}=***`);
        } else {
            console.log(`   ${i + 1}. ${line}`);
        }
    });
}

console.log('\n🔑 CHECKING API KEY ENVIRONMENT VARIABLES');
console.log('------------------------------------------');

const apiKeys = [
    'COINBASE_API_KEY',
    'COINBASE_API_SECRET', 
    'COINBASE_PASSPHRASE',
    'KRAKEN_API_KEY',
    'KRAKEN_API_SECRET',
    'BINANCEUS_API_KEY',
    'BINANCEUS_API_SECRET',
    'GEMINI_API_KEY',
    'GEMINI_API_SECRET',
    'CRYPTOCOM_API_KEY',
    'CRYPTOCOM_API_SECRET'
];

let foundKeys = 0;
let missingKeys = [];

apiKeys.forEach(key => {
    const value = process.env[key];
    if (value && value.length > 0) {
        foundKeys++;
        console.log(`✅ ${key}: Found (${value.length} chars)`);
    } else {
        missingKeys.push(key);
        console.log(`❌ ${key}: Missing or empty`);
    }
});

console.log('\n📊 SUMMARY');
console.log('----------');
console.log(`✅ Found API keys: ${foundKeys}/${apiKeys.length}`);
console.log(`❌ Missing API keys: ${missingKeys.length}`);

if (missingKeys.length > 0) {
    console.log('\n🔧 MISSING KEYS:');
    missingKeys.forEach(key => console.log(`   • ${key}`));
}

console.log('\n💡 RECOMMENDATIONS:');
if (!envExists) {
    console.log('   1. Create a .env file in your project root');
    console.log('   2. Add your API keys to the .env file');
} else if (foundKeys === 0) {
    console.log('   1. Check .env file format (KEY=value, no spaces around =)');
    console.log('   2. Ensure .env file is in the correct directory');
    console.log('   3. Restart your application after adding keys');
} else if (foundKeys < apiKeys.length) {
    console.log('   1. Add the missing API keys listed above');
    console.log('   2. Verify the key names match exactly');
} else {
    console.log('   ✅ All API keys found! Environment loading should work.');
}

console.log('\n🚀 NEXT STEPS:');
console.log('   1. Fix any missing API keys');
console.log('   2. Make sure your main app loads dotenv: import "dotenv/config"');
console.log('   3. Restart your trading system');

export default { foundKeys, missingKeys };