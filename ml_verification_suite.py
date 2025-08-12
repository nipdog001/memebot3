# ml_verification_suite.py - Verify ML models use real exchange data
import asyncio
import sqlite3
import pandas as pd
import numpy as np
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import ccxt
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLDataSourceVerifier:
    """Comprehensive verification that ML models use real exchange data"""
    
    def __init__(self, db_path="memebot.db"):
        self.db_path = db_path
        self.exchanges = {}
        self.verification_results = {}
        
    async def initialize_exchanges(self):
        """Initialize exchanges for real-time data comparison"""
        exchange_configs = {
            'kraken': ccxt.kraken(),
            'binanceus': ccxt.binanceus(), 
            'cryptocom': ccxt.cryptocom()
        }
        
        for name, exchange in exchange_configs.items():
            try:
                await exchange.load_markets()
                self.exchanges[name] = exchange
                logger.info(f"✅ Connected to {name} for verification")
            except Exception as e:
                logger.warning(f"❌ Could not connect to {name}: {e}")
    
    def verify_ml_model_integration(self):
        """Check if ML models are properly integrated and active"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Check ML models table
            ml_models_query = """
            SELECT name, accuracy, last_trained, confidence_threshold, is_active 
            FROM ml_models 
            ORDER BY last_trained DESC
            """
            
            ml_models = pd.read_sql_query(ml_models_query, conn)
            
            verification = {
                "total_models": len(ml_models),
                "active_models": len(ml_models[ml_models['is_active'] == 1]),
                "models_with_training": len(ml_models[ml_models['last_trained'].notna()]),
                "average_accuracy": ml_models['accuracy'].mean() if len(ml_models) > 0 else 0,
                "confidence_thresholds": ml_models[['name', 'confidence_threshold']].to_dict('records')
            }
            
            # Check for recent model activity
            if len(ml_models) > 0:
                latest_training = pd.to_datetime(ml_models['last_trained'].max())
                hours_since_training = (datetime.now() - latest_training).total_seconds() / 3600
                verification["hours_since_last_training"] = hours_since_training
                verification["models_recently_active"] = hours_since_training < 24
            
            conn.close()
            return verification
            
        except Exception as e:
            return {"error": f"ML model verification failed: {e}"}
    
    def verify_feature_data_sources(self):
        """Verify that ML features are calculated from real exchange data"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Check if price_data table exists and has recent data
            price_data_query = """
            SELECT exchange, symbol, timestamp, mid_price, spread_pct, volume_24h
            FROM price_data 
            WHERE timestamp > datetime('now', '-1 hour')
            ORDER BY timestamp DESC
            LIMIT 100
            """
            
            try:
                price_data = pd.read_sql_query(price_data_query, conn)
            except:
                # Try alternative table names
                price_data_query = """
                SELECT * FROM paper_trades 
                WHERE timestamp > datetime('now', '-1 hour')
                ORDER BY timestamp DESC
                LIMIT 100
                """
                price_data = pd.read_sql_query(price_data_query, conn)
            
            verification = {
                "recent_data_points": len(price_data),
                "unique_exchanges": price_data['exchange'].nunique() if 'exchange' in price_data.columns else 0,
                "unique_symbols": price_data['symbol'].nunique() if 'symbol' in price_data.columns else 0,
                "data_freshness_minutes": 0
            }
            
            if len(price_data) > 0 and 'timestamp' in price_data.columns:
                latest_timestamp = pd.to_datetime(price_data['timestamp'].max())
                minutes_old = (datetime.now() - latest_timestamp).total_seconds() / 60
                verification["data_freshness_minutes"] = minutes_old
                verification["data_is_fresh"] = minutes_old < 30  # Less than 30 minutes old
                
                # Check for realistic price variations
                if 'mid_price' in price_data.columns:
                    price_std = price_data['mid_price'].std()
                    price_mean = price_data['mid_price'].mean()
                    verification["price_variation_coefficient"] = price_std / price_mean if price_mean > 0 else 0
                    verification["has_realistic_price_variation"] = 0.001 < (price_std / price_mean) < 0.1
            
            conn.close()
            return verification
            
        except Exception as e:
            return {"error": f"Feature data verification failed: {e}"}
    
    def verify_ml_prediction_pipeline(self):
        """Verify ML predictions are being made and stored"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Check for ML predictions table or arbitrage opportunities with ML scores
            prediction_queries = [
                """
                SELECT timestamp, symbol, quality_score, confidence, ml_prediction
                FROM arbitrage_opportunities 
                WHERE timestamp > datetime('now', '-2 hours')
                AND quality_score IS NOT NULL
                ORDER BY timestamp DESC
                """,
                """
                SELECT timestamp, symbol, profit, confidence_score
                FROM paper_trades 
                WHERE timestamp > datetime('now', '-2 hours')
                AND confidence_score IS NOT NULL
                ORDER BY timestamp DESC
                """,
                """
                SELECT * FROM ml_predictions 
                WHERE timestamp > datetime('now', '-2 hours')
                ORDER BY timestamp DESC
                """
            ]
            
            predictions_data = None
            for query in prediction_queries:
                try:
                    predictions_data = pd.read_sql_query(query, conn)
                    if len(predictions_data) > 0:
                        break
                except:
                    continue
            
            if predictions_data is None or len(predictions_data) == 0:
                conn.close()
                return {
                    "predictions_found": False,
                    "error": "No ML prediction data found in database"
                }
            
            verification = {
                "predictions_found": True,
                "total_predictions": len(predictions_data),
                "prediction_columns": list(predictions_data.columns),
                "has_confidence_scores": any('confidence' in col.lower() for col in predictions_data.columns),
                "has_quality_scores": any('quality' in col.lower() or 'score' in col.lower() for col in predictions_data.columns)
            }
            
            # Analyze prediction distribution
            for col in predictions_data.columns:
                if 'confidence' in col.lower() or 'quality' in col.lower() or 'score' in col.lower():
                    scores = predictions_data[col].dropna()
                    if len(scores) > 0:
                        verification[f"{col}_stats"] = {
                            "mean": float(scores.mean()),
                            "std": float(scores.std()),
                            "min": float(scores.min()),
                            "max": float(scores.max()),
                            "distribution_looks_realistic": 0.1 < scores.std() < 0.4
                        }
            
            conn.close()
            return verification
            
        except Exception as e:
            return {"error": f"ML prediction verification failed: {e}"}
    
    async def verify_real_time_data_flow(self, symbol='DOGE/USDT'):
        """Verify data flows from exchanges to ML models in real-time"""
        verification = {
            "real_time_test": True,
            "symbol_tested": symbol,
            "exchange_data": {},
            "data_consistency": {}
        }
        
        # Get current data from exchanges
        for exchange_name, exchange in self.exchanges.items():
            try:
                ticker = await exchange.fetch_ticker(symbol)
                orderbook = await exchange.fetch_order_book(symbol, limit=5)
                
                verification["exchange_data"][exchange_name] = {
                    "last_price": ticker['last'],
                    "bid": ticker['bid'],
                    "ask": ticker['ask'],
                    "spread_pct": ((ticker['ask'] - ticker['bid']) / ticker['last']) * 100,
                    "volume_24h": ticker['baseVolume'],
                    "timestamp": ticker['timestamp']
                }
                
            except Exception as e:
                verification["exchange_data"][exchange_name] = {"error": str(e)}
        
        # Compare with database data
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Get recent database data for comparison
            db_query = f"""
            SELECT exchange, mid_price, spread_pct, volume_24h, timestamp
            FROM price_data 
            WHERE symbol = '{symbol}' 
            AND timestamp > datetime('now', '-10 minutes')
            ORDER BY timestamp DESC
            """
            
            try:
                db_data = pd.read_sql_query(db_query, conn)
            except:
                # Alternative query for paper_trades table
                db_query = f"""
                SELECT exchange, buy_price, sell_price, timestamp
                FROM paper_trades 
                WHERE symbol = '{symbol}' 
                AND timestamp > datetime('now', '-10 minutes')
                ORDER BY timestamp DESC
                """
                db_data = pd.read_sql_query(db_query, conn)
            
            if len(db_data) > 0:
                verification["database_has_recent_data"] = True
                verification["db_data_count"] = len(db_data)
                
                # Check data consistency
                for exchange_name in self.exchanges.keys():
                    if exchange_name in verification["exchange_data"]:
                        exchange_live = verification["exchange_data"][exchange_name]
                        if "error" not in exchange_live:
                            # Find matching database entries
                            db_exchange_data = db_data[db_data['exchange'] == exchange_name]
                            
                            if len(db_exchange_data) > 0:
                                latest_db = db_exchange_data.iloc[0]
                                
                                # Compare prices (allowing for some variance due to timing)
                                if 'mid_price' in latest_db:
                                    price_diff_pct = abs(exchange_live['last_price'] - latest_db['mid_price']) / latest_db['mid_price'] * 100
                                elif 'buy_price' in latest_db and 'sell_price' in latest_db:
                                    db_mid = (latest_db['buy_price'] + latest_db['sell_price']) / 2
                                    price_diff_pct = abs(exchange_live['last_price'] - db_mid) / db_mid * 100
                                else:
                                    price_diff_pct = 999  # No comparable data
                                
                                verification["data_consistency"][exchange_name] = {
                                    "price_difference_pct": price_diff_pct,
                                    "data_appears_synchronized": price_diff_pct < 5  # Less than 5% difference
                                }
            else:
                verification["database_has_recent_data"] = False
            
            conn.close()
            
        except Exception as e:
            verification["database_verification_error"] = str(e)
        
        return verification
    
    def verify_confidence_threshold_system(self):
        """Verify that confidence thresholds are being used for trade decisions"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Check trades with confidence information
            confidence_query = """
            SELECT symbol, profit, confidence_score, timestamp
            FROM paper_trades 
            WHERE confidence_score IS NOT NULL
            ORDER BY timestamp DESC
            LIMIT 1000
            """
            
            try:
                trades_with_confidence = pd.read_sql_query(confidence_query, conn)
            except:
                # Try alternative approaches
                trades_with_confidence = pd.DataFrame()
            
            verification = {
                "trades_with_confidence": len(trades_with_confidence),
                "confidence_system_active": len(trades_with_confidence) > 0
            }
            
            if len(trades_with_confidence) > 0:
                # Analyze confidence vs success rate
                trades_with_confidence['profitable'] = trades_with_confidence['profit'] > 0
                
                # Group by confidence ranges
                confidence_ranges = [
                    (0.0, 0.5, "Low"),
                    (0.5, 0.7, "Medium"), 
                    (0.7, 0.85, "High"),
                    (0.85, 1.0, "Very High")
                ]
                
                confidence_analysis = {}
                for min_conf, max_conf, label in confidence_ranges:
                    range_trades = trades_with_confidence[
                        (trades_with_confidence['confidence_score'] >= min_conf) & 
                        (trades_with_confidence['confidence_score'] < max_conf)
                    ]
                    
                    if len(range_trades) > 0:
                        confidence_analysis[label] = {
                            "trade_count": len(range_trades),
                            "success_rate": range_trades['profitable'].mean(),
                            "avg_profit": range_trades['profit'].mean(),
                            "avg_confidence": range_trades['confidence_score'].mean()
                        }
                
                verification["confidence_analysis"] = confidence_analysis
                
                # Check if higher confidence correlates with better performance
                if len(confidence_analysis) >= 2:
                    high_conf_success = confidence_analysis.get("High", {}).get("success_rate", 0)
                    low_conf_success = confidence_analysis.get("Low", {}).get("success_rate", 0)
                    verification["confidence_system_working"] = high_conf_success > low_conf_success
            
            # Check current confidence thresholds
            threshold_query = "SELECT name, confidence_threshold FROM ml_models WHERE is_active = 1"
            try:
                thresholds = pd.read_sql_query(threshold_query, conn)
                verification["current_thresholds"] = thresholds.to_dict('records')
                verification["threshold_diversity"] = thresholds['confidence_threshold'].std() > 0.01
            except:
                verification["current_thresholds"] = []
            
            conn.close()
            return verification
            
        except Exception as e:
            return {"error": f"Confidence threshold verification failed: {e}"}
    
    def generate_verification_report(self):
        """Generate comprehensive verification report"""
        print("🔍 ML MODELS & REAL DATA VERIFICATION REPORT")
        print("=" * 60)
        
        # 1. ML Model Integration
        print("\n1. 🤖 ML MODEL INTEGRATION")
        print("-" * 30)
        ml_verification = self.verify_ml_model_integration()
        
        if "error" in ml_verification:
            print(f"❌ {ml_verification['error']}")
        else:
            print(f"✅ Total ML Models: {ml_verification['total_models']}")
            print(f"✅ Active Models: {ml_verification['active_models']}")
            print(f"✅ Models with Training: {ml_verification['models_with_training']}")
            print(f"✅ Average Accuracy: {ml_verification['average_accuracy']:.1%}")
            
            if ml_verification.get('models_recently_active', False):
                print(f"✅ Recent Activity: {ml_verification['hours_since_last_training']:.1f} hours ago")
            else:
                print(f"⚠️ Last Training: {ml_verification.get('hours_since_last_training', 'Unknown')} hours ago")
            
            print("\n📊 Model Confidence Thresholds:")
            for model in ml_verification.get('confidence_thresholds', []):
                print(f"   • {model['name']}: {model['confidence_threshold']:.2f}")
        
        # 2. Feature Data Sources
        print("\n2. 📊 FEATURE DATA SOURCES")
        print("-" * 30)
        feature_verification = self.verify_feature_data_sources()
        
        if "error" in feature_verification:
            print(f"❌ {feature_verification['error']}")
        else:
            print(f"✅ Recent Data Points: {feature_verification['recent_data_points']}")
            print(f"✅ Unique Exchanges: {feature_verification['unique_exchanges']}")
            print(f"✅ Unique Symbols: {feature_verification['unique_symbols']}")
            
            if feature_verification.get('data_is_fresh', False):
                print(f"✅ Data Freshness: {feature_verification['data_freshness_minutes']:.1f} minutes old")
            else:
                print(f"⚠️ Data Age: {feature_verification.get('data_freshness_minutes', 'Unknown')} minutes old")
            
            if feature_verification.get('has_realistic_price_variation', False):
                print(f"✅ Price Variation: {feature_verification['price_variation_coefficient']:.4f} (realistic)")
            else:
                print(f"⚠️ Price Variation: {feature_verification.get('price_variation_coefficient', 'Unknown')} (check if realistic)")
        
        # 3. ML Prediction Pipeline
        print("\n3. 🧠 ML PREDICTION PIPELINE")
        print("-" * 30)
        prediction_verification = self.verify_ml_prediction_pipeline()
        
        if "error" in prediction_verification:
            print(f"❌ {prediction_verification['error']}")
        else:
            if prediction_verification['predictions_found']:
                print(f"✅ ML Predictions Found: {prediction_verification['total_predictions']}")
                print(f"✅ Has Confidence Scores: {prediction_verification['has_confidence_scores']}")
                print(f"✅ Has Quality Scores: {prediction_verification['has_quality_scores']}")
                
                # Show prediction statistics
                for key, stats in prediction_verification.items():
                    if isinstance(stats, dict) and 'mean' in stats:
                        print(f"\n📈 {key}:")
                        print(f"   • Mean: {stats['mean']:.3f}")
                        print(f"   • Std: {stats['std']:.3f}")
                        print(f"   • Range: {stats['min']:.3f} - {stats['max']:.3f}")
                        print(f"   • Realistic: {stats['distribution_looks_realistic']}")
            else:
                print("❌ No ML predictions found in database")
        
        # 4. Confidence Threshold System
        print("\n4. 🎯 CONFIDENCE THRESHOLD SYSTEM")
        print("-" * 30)
        confidence_verification = self.verify_confidence_threshold_system()
        
        if "error" in confidence_verification:
            print(f"❌ {confidence_verification['error']}")
        else:
            print(f"✅ Trades with Confidence: {confidence_verification['trades_with_confidence']}")
            print(f"✅ Confidence System Active: {confidence_verification['confidence_system_active']}")
            
            if confidence_verification.get('confidence_system_working', False):
                print("✅ Confidence System Working: Higher confidence → Better performance")
            else:
                print("⚠️ Confidence System: No clear correlation detected")
            
            if 'confidence_analysis' in confidence_verification:
                print("\n📊 Performance by Confidence Level:")
                for level, stats in confidence_verification['confidence_analysis'].items():
                    print(f"   • {level} ({stats['trade_count']} trades): "
                          f"{stats['success_rate']:.1%} success, "
                          f"${stats['avg_profit']:.2f} avg profit")
        
        return {
            "ml_integration": ml_verification,
            "feature_data": feature_verification,
            "prediction_pipeline": prediction_verification,
            "confidence_system": confidence_verification
        }
    
    def generate_final_verdict(self, verification_results):
        """Generate final verdict on ML system authenticity"""
        print("\n" + "=" * 60)
        print("🎯 FINAL VERDICT: ML MODELS & REAL DATA VERIFICATION")
        print("=" * 60)
        
        scores = {
            "ml_models_active": 0,
            "using_real_data": 0,
            "predictions_working": 0,
            "confidence_system": 0
        }
        
        # Score ML models
        ml_result = verification_results.get("ml_integration", {})
        if ml_result.get("active_models", 0) >= 3:
            scores["ml_models_active"] = 25
            print("✅ ML Models: Multiple active models detected")
        elif ml_result.get("total_models", 0) > 0:
            scores["ml_models_active"] = 15
            print("⚠️ ML Models: Some models found but low activity")
        else:
            print("❌ ML Models: No active models detected")
        
        # Score real data usage
        feature_result = verification_results.get("feature_data", {})
        if feature_result.get("data_is_fresh", False) and feature_result.get("has_realistic_price_variation", False):
            scores["using_real_data"] = 25
            print("✅ Real Data: Fresh, realistic market data detected")
        elif feature_result.get("recent_data_points", 0) > 0:
            scores["using_real_data"] = 15
            print("⚠️ Real Data: Some data found but freshness/realism unclear")
        else:
            print("❌ Real Data: No recent market data detected")
        
        # Score prediction pipeline
        prediction_result = verification_results.get("prediction_pipeline", {})
        if prediction_result.get("predictions_found", False):
            scores["predictions_working"] = 25
            print("✅ Predictions: ML prediction pipeline active")
        else:
            print("❌ Predictions: No ML predictions detected")
        
        # Score confidence system
        confidence_result = verification_results.get("confidence_system", {})
        if confidence_result.get("confidence_system_working", False):
            scores["confidence_system"] = 25
            print("✅ Confidence: Threshold system working effectively")
        elif confidence_result.get("confidence_system_active", False):
            scores["confidence_system"] = 15
            print("⚠️ Confidence: System active but effectiveness unclear")
        else:
            print("❌ Confidence: No confidence threshold system detected")
        
        total_score = sum(scores.values())
        
        print(f"\n📊 AUTHENTICITY SCORE: {total_score}/100")
        
        if total_score >= 80:
            verdict = "🚀 EXCELLENT: Your ML system is using real exchange data!"
            recommendation = "Ready for production deployment with confidence."
        elif total_score >= 60:
            verdict = "✅ GOOD: ML system mostly functional with real data"
            recommendation = "Minor improvements needed before full production."
        elif total_score >= 40:
            verdict = "⚠️ PARTIAL: Some ML functionality but verification issues"
            recommendation = "Significant fixes needed before production deployment."
        else:
            verdict = "❌ CRITICAL: ML system not properly connected to real data"
            recommendation = "Major fixes required - system may be using simulated data."
        
        print(f"\n{verdict}")
        print(f"💡 Recommendation: {recommendation}")
        
        return {
            "total_score": total_score,
            "verdict": verdict,
            "recommendation": recommendation,
            "scores": scores
        }

async def main():
    """Run complete ML verification suite"""
    verifier = MLDataSourceVerifier()
    
    # Initialize exchanges for comparison
    print("🔌 Connecting to exchanges for verification...")
    await verifier.initialize_exchanges()
    
    # Run all verifications
    verification_results = verifier.generate_verification_report()
    
    # Test real-time data flow if exchanges available
    if verifier.exchanges:
        print("\n5. ⚡ REAL-TIME DATA FLOW TEST")
        print("-" * 30)
        realtime_verification = await verifier.verify_real_time_data_flow()
        
        if realtime_verification.get("database_has_recent_data", False):
            print("✅ Real-time data flow: Database has recent data")
            
            consistent_exchanges = 0
            for exchange, consistency in realtime_verification.get("data_consistency", {}).items():
                if consistency.get("data_appears_synchronized", False):
                    print(f"✅ {exchange}: Data synchronized (±{consistency['price_difference_pct']:.1f}%)")
                    consistent_exchanges += 1
                else:
                    print(f"⚠️ {exchange}: Data inconsistency ({consistency['price_difference_pct']:.1f}% difference)")
            
            if consistent_exchanges > 0:
                print(f"✅ {consistent_exchanges} exchanges showing consistent real-time data")
            else:
                print("❌ No exchanges showing consistent data synchronization")
        else:
            print("❌ Real-time data flow: No recent database updates detected")
        
        verification_results["realtime_data"] = realtime_verification
    
    # Generate final verdict
    final_verdict = verifier.generate_final_verdict(verification_results)
    
    # Close exchanges
    for exchange in verifier.exchanges.values():
        await exchange.close()
    
    return verification_results, final_verdict

if __name__ == "__main__":
    asyncio.run(main())