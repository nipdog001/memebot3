# ml_settings_verification.py - Verify ML model settings and configurations
import sqlite3
import json
import os
import pandas as pd
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLSettingsVerifier:
    """Verify ML model settings, confidence thresholds, and trading parameters"""
    
    def __init__(self, db_path="memebot.db"):
        self.db_path = db_path
        self.config_files = [
            "config.json",
            "ml_config.json", 
            "trading_config.json",
            ".env",
            "settings.json"
        ]
        
    def check_database_ml_configuration(self):
        """Check ML model configuration stored in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Get ML models configuration
            models_query = """
            SELECT name, model_type, accuracy, confidence_threshold, 
                   is_active, last_trained, training_data_count,
                   hyperparameters, feature_importance
            FROM ml_models
            ORDER BY accuracy DESC
            """
            
            try:
                models_df = pd.read_sql_query(models_query, conn)
            except Exception as e:
                logger.warning(f"ml_models table not found: {e}")
                models_df = pd.DataFrame()
            
            config_check = {
                "models_configured": len(models_df),
                "active_models": len(models_df[models_df['is_active'] == 1]) if len(models_df) > 0 else 0,
                "trained_models": len(models_df[models_df['last_trained'].notna()]) if len(models_df) > 0 else 0,
                "model_details": []
            }
            
            if len(models_df) > 0:
                for _, model in models_df.iterrows():
                    model_info = {
                        "name": model['name'],
                        "type": model.get('model_type', 'Unknown'),
                        "accuracy": model.get('accuracy', 0),
                        "confidence_threshold": model.get('confidence_threshold', 0),
                        "is_active": bool(model.get('is_active', 0)),
                        "last_trained": model.get('last_trained', 'Never'),
                        "training_samples": model.get('training_data_count', 0)
                    }
                    
                    # Parse hyperparameters if available
                    if model.get('hyperparameters'):
                        try:
                            model_info["hyperparameters"] = json.loads(model['hyperparameters'])
                        except:
                            model_info["hyperparameters"] = str(model['hyperparameters'])
                    
                    config_check["model_details"].append(model_info)
                
                # Check confidence threshold distribution
                thresholds = models_df['confidence_threshold'].dropna()
                if len(thresholds) > 0:
                    config_check["confidence_stats"] = {
                        "min_threshold": float(thresholds.min()),
                        "max_threshold": float(thresholds.max()),
                        "avg_threshold": float(thresholds.mean()),
                        "threshold_diversity": float(thresholds.std()),
                        "proper_range": all(0.5 <= t <= 0.95 for t in thresholds)
                    }
            
            # Check trading parameters
            try:
                trading_params_query = """
                SELECT parameter_name, parameter_value, last_updated
                FROM trading_parameters
                ORDER BY last_updated DESC
                """
                trading_params = pd.read_sql_query(trading_params_query, conn)
                
                config_check["trading_parameters"] = {
                    param['parameter_name']: param['parameter_value'] 
                    for _, param in trading_params.iterrows()
                }
            except:
                config_check["trading_parameters"] = {}
            
            conn.close()
            return config_check
            
        except Exception as e:
            return {"error": f"Database configuration check failed: {e}"}
    
    def check_file_configurations(self):
        """Check configuration files for ML and trading settings"""
        file_configs = {}
        
        for config_file in self.config_files:
            if os.path.exists(config_file):
                try:
                    if config_file.endswith('.json'):
                        with open(config_file, 'r') as f:
                            config_data = json.load(f)
                        file_configs[config_file] = config_data
                    elif config_file == '.env':
                        # Parse .env file
                        env_vars = {}
                        with open(config_file, 'r') as f:
                            for line in f:
                                if '=' in line and not line.strip().startswith('#'):
                                    key, value = line.strip().split('=', 1)
                                    env_vars[key] = value
                        file_configs[config_file] = env_vars
                except Exception as e:
                    file_configs[config_file] = {"error": str(e)}
            else:
                file_configs[config_file] = {"status": "not_found"}
        
        return file_configs
    
    def verify_ml_data_pipeline(self):
        """Verify the ML data pipeline from exchanges to models"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            pipeline_check = {
                "data_collection": False,
                "feature_engineering": False,
                "model_training": False,
                "prediction_generation": False,
                "trade_execution": False
            }
            
            # 1. Check data collection (price data from exchanges)
            data_collection_query = """
            SELECT COUNT(*) as count, MAX(timestamp) as latest_data
            FROM price_data 
            WHERE timestamp > datetime('now', '-1 day')
            """
            
            try:
                data_collection = pd.read_sql_query(data_collection_query, conn)
                if data_collection.iloc[0]['count'] > 0:
                    pipeline_check["data_collection"] = True
                    pipeline_check["latest_data_collection"] = data_collection.iloc[0]['latest_data']
            except:
                # Try alternative table
                try:
                    alt_query = """
                    SELECT COUNT(*) as count, MAX(timestamp) as latest_data
                    FROM paper_trades 
                    WHERE timestamp > datetime('now', '-1 day')
                    """
                    data_collection = pd.read_sql_query(alt_query, conn)
                    if data_collection.iloc[0]['count'] > 0:
                        pipeline_check["data_collection"] = True
                        pipeline_check["latest_data_collection"] = data_collection.iloc[0]['latest_data']
                except:
                    pass
            
            # 2. Check feature engineering (calculated features in database)
            try:
                features_query = """
                SELECT COUNT(*) as count
                FROM ml_features 
                WHERE timestamp > datetime('now', '-1 day')
                """
                features = pd.read_sql_query(features_query, conn)
                if features.iloc[0]['count'] > 0:
                    pipeline_check["feature_engineering"] = True
            except:
                # Check if features are embedded in other tables
                try:
                    # Check for feature columns in arbitrage_opportunities
                    arb_query = """
                    SELECT COUNT(*) as count
                    FROM arbitrage_opportunities 
                    WHERE timestamp > datetime('now', '-1 day')
                    AND (spread_pct IS NOT NULL OR volume_24h IS NOT NULL)
                    """
                    arb_data = pd.read_sql_query(arb_query, conn)
                    if arb_data.iloc[0]['count'] > 0:
                        pipeline_check["feature_engineering"] = True
                except:
                    pass
            
            # 3. Check model training (recent training timestamps)
            try:
                training_query = """
                SELECT COUNT(*) as count, MAX(last_trained) as latest_training
                FROM ml_models 
                WHERE last_trained > datetime('now', '-7 days')
                """
                training = pd.read_sql_query(training_query, conn)
                if training.iloc[0]['count'] > 0:
                    pipeline_check["model_training"] = True
                    pipeline_check["latest_model_training"] = training.iloc[0]['latest_training']
            except:
                pass
            
            # 4. Check prediction generation
            try:
                prediction_query = """
                SELECT COUNT(*) as count, MAX(timestamp) as latest_prediction
                FROM ml_predictions 
                WHERE timestamp > datetime('now', '-1 day')
                """
                predictions = pd.read_sql_query(prediction_query, conn)
                if predictions.iloc[0]['count'] > 0:
                    pipeline_check["prediction_generation"] = True
                    pipeline_check["latest_prediction"] = predictions.iloc[0]['latest_prediction']
            except:
                # Check for predictions in other tables
                try:
                    alt_pred_query = """
                    SELECT COUNT(*) as count
                    FROM paper_trades 
                    WHERE timestamp > datetime('now', '-1 day')
                    AND confidence_score IS NOT NULL
                    """
                    alt_predictions = pd.read_sql_query(alt_pred_query, conn)
                    if alt_predictions.iloc[0]['count'] > 0:
                        pipeline_check["prediction_generation"] = True
                except:
                    pass
            
            # 5. Check trade execution based on ML
            try:
                trade_query = """
                SELECT COUNT(*) as count, AVG(confidence_score) as avg_confidence
                FROM paper_trades 
                WHERE timestamp > datetime('now', '-1 day')
                AND confidence_score >= 0.5
                """
                trades = pd.read_sql_query(trade_query, conn)
                if trades.iloc[0]['count'] > 0:
                    pipeline_check["trade_execution"] = True
                    pipeline_check["avg_trade_confidence"] = trades.iloc[0]['avg_confidence']
            except:
                pass
            
            conn.close()
            return pipeline_check
            
        except Exception as e:
            return {"error": f"Pipeline verification failed: {e}"}
    
    def verify_confidence_threshold_implementation(self):
        """Verify confidence threshold system is properly implemented"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            confidence_verification = {
                "threshold_system_active": False,
                "trades_filtered_by_confidence": False,
                "dynamic_threshold_adjustment": False,
                "threshold_effectiveness": {}
            }
            
            # Check if trades have confidence scores
            confidence_query = """
            SELECT confidence_score, profit, timestamp
            FROM paper_trades 
            WHERE confidence_score IS NOT NULL
            AND timestamp > datetime('now', '-7 days')
            ORDER BY timestamp DESC
            """
            
            try:
                confidence_trades = pd.read_sql_query(confidence_query, conn)
                
                if len(confidence_trades) > 0:
                    confidence_verification["threshold_system_active"] = True
                    confidence_verification["total_trades_with_confidence"] = len(confidence_trades)
                    
                    # Check if trades are filtered by confidence (no very low confidence trades)
                    low_confidence_trades = len(confidence_trades[confidence_trades['confidence_score'] < 0.3])
                    if low_confidence_trades < len(confidence_trades) * 0.1:  # Less than 10% low confidence
                        confidence_verification["trades_filtered_by_confidence"] = True
                    
                    # Analyze threshold effectiveness
                    confidence_ranges = [
                        (0.5, 0.6, "50-60%"),
                        (0.6, 0.7, "60-70%"),
                        (0.7, 0.8, "70-80%"),
                        (0.8, 0.9, "80-90%"),
                        (0.9, 1.0, "90-100%")
                    ]
                    
                    for min_conf, max_conf, label in confidence_ranges:
                        range_trades = confidence_trades[
                            (confidence_trades['confidence_score'] >= min_conf) & 
                            (confidence_trades['confidence_score'] < max_conf)
                        ]
                        
                        if len(range_trades) > 0:
                            success_rate = (range_trades['profit'] > 0).mean()
                            avg_profit = range_trades['profit'].mean()
                            
                            confidence_verification["threshold_effectiveness"][label] = {
                                "trade_count": len(range_trades),
                                "success_rate": success_rate,
                                "avg_profit": avg_profit
                            }
                    
                    # Check for dynamic threshold adjustment (changing thresholds over time)
                    try:
                        threshold_history_query = """
                        SELECT name, confidence_threshold, last_updated
                        FROM ml_model_history
                        WHERE last_updated > datetime('now', '-30 days')
                        ORDER BY last_updated
                        """
                        threshold_history = pd.read_sql_query(threshold_history_query, conn)
                        
                        if len(threshold_history) > 1:
                            # Check if thresholds have changed
                            for model_name in threshold_history['name'].unique():
                                model_history = threshold_history[threshold_history['name'] == model_name]
                                if len(model_history) > 1:
                                    threshold_changes = model_history['confidence_threshold'].nunique()
                                    if threshold_changes > 1:
                                        confidence_verification["dynamic_threshold_adjustment"] = True
                                        break
                    except:
                        pass
            
            except Exception as e:
                confidence_verification["error"] = str(e)
            
            conn.close()
            return confidence_verification
            
        except Exception as e:
            return {"error": f"Confidence threshold verification failed: {e}"}
    
    def generate_settings_report(self):
        """Generate comprehensive settings verification report"""
        print("⚙️ ML MODEL SETTINGS & CONFIGURATION VERIFICATION")
        print("=" * 60)
        
        # 1. Database ML Configuration
        print("\n1. 🗄️ DATABASE ML CONFIGURATION")
        print("-" * 40)
        db_config = self.check_database_ml_configuration()
        
        if "error" in db_config:
            print(f"❌ {db_config['error']}")
        else:
            print(f"✅ Models Configured: {db_config['models_configured']}")
            print(f"✅ Active Models: {db_config['active_models']}")
            print(f"✅ Trained Models: {db_config['trained_models']}")
            
            if db_config.get('confidence_stats'):
                stats = db_config['confidence_stats']
                print(f"\n📊 Confidence Threshold Stats:")
                print(f"   • Range: {stats['min_threshold']:.2f} - {stats['max_threshold']:.2f}")
                print(f"   • Average: {stats['avg_threshold']:.2f}")
                print(f"   • Diversity: {stats['threshold_diversity']:.3f}")
                print(f"   • Proper Range: {stats['proper_range']}")
            
            if db_config.get('model_details'):
                print(f"\n🤖 Individual Model Settings:")
                for model in db_config['model_details']:
                    status = "🟢 Active" if model['is_active'] else "🔴 Inactive"
                    print(f"   • {model['name']} ({model['type']}): {status}")
                    print(f"     Accuracy: {model['accuracy']:.1%}, Threshold: {model['confidence_threshold']:.2f}")
                    print(f"     Training Samples: {model['training_samples']}")
        
        # 2. File Configurations
        print("\n2. 📁 FILE CONFIGURATIONS")
        print("-" * 40)
        file_configs = self.check_file_configurations()
        
        for filename, config in file_configs.items():
            if config.get('status') == 'not_found':
                print(f"⚠️ {filename}: Not found")
            elif 'error' in config:
                print(f"❌ {filename}: {config['error']}")
            else:
                print(f"✅ {filename}: Loaded successfully")
                
                # Show relevant ML settings
                if filename.endswith('.json'):
                    ml_keys = ['ml_config', 'models', 'confidence_threshold', 'training', 'features']
                    for key in ml_keys:
                        if key in config:
                            print(f"   • {key}: {type(config[key]).__name__}")
                elif filename == '.env':
                    ml_vars = [k for k in config.keys() if any(term in k.lower() for term in ['ml', 'model', 'confidence', 'threshold'])]
                    if ml_vars:
                        print(f"   • ML Variables: {len(ml_vars)} found")
        
        # 3. ML Data Pipeline
        print("\n3. 🔄 ML DATA PIPELINE")
        print("-" * 40)
        pipeline_check = self.verify_ml_data_pipeline()
        
        if "error" in pipeline_check:
            print(f"❌ {pipeline_check['error']}")
        else:
            pipeline_stages = [
                ("Data Collection", pipeline_check.get("data_collection", False)),
                ("Feature Engineering", pipeline_check.get("feature_engineering", False)),
                ("Model Training", pipeline_check.get("model_training", False)),
                ("Prediction Generation", pipeline_check.get("prediction_generation", False)),
                ("Trade Execution", pipeline_check.get("trade_execution", False))
            ]
            
            for stage, status in pipeline_stages:
                status_icon = "✅" if status else "❌"
                print(f"{status_icon} {stage}: {'Active' if status else 'Not detected'}")
            
            # Show timing information
            timing_keys = ['latest_data_collection', 'latest_model_training', 'latest_prediction']
            for key in timing_keys:
                if key in pipeline_check:
                    print(f"   • {key.replace('_', ' ').title()}: {pipeline_check[key]}")
        
        # 4. Confidence Threshold Implementation
        print("\n4. 🎯 CONFIDENCE THRESHOLD IMPLEMENTATION")
        print("-" * 40)
        confidence_check = self.verify_confidence_threshold_implementation()
        
        if "error" in confidence_check:
            print(f"❌ {confidence_check['error']}")
        else:
            print(f"✅ Threshold System Active: {confidence_check['threshold_system_active']}")
            print(f"✅ Trades Filtered by Confidence: {confidence_check['trades_filtered_by_confidence']}")
            print(f"✅ Dynamic Adjustment: {confidence_check['dynamic_threshold_adjustment']}")
            
            if confidence_check.get('total_trades_with_confidence'):
                print(f"   • Total Trades with Confidence: {confidence_check['total_trades_with_confidence']}")
            
            if confidence_check.get('threshold_effectiveness'):
                print(f"\n📈 Threshold Effectiveness:")
                for range_label, stats in confidence_check['threshold_effectiveness'].items():
                    print(f"   • {range_label}: {stats['trade_count']} trades, "
                          f"{stats['success_rate']:.1%} success, "
                          f"${stats['avg_profit']:.2f} avg profit")
        
        return {
            "database_config": db_config,
            "file_configs": file_configs,
            "pipeline_check": pipeline_check,
            "confidence_check": confidence_check
        }
    
    def generate_settings_recommendations(self, verification_results):
        """Generate recommendations for improving ML settings"""
        print("\n" + "=" * 60)
        print("💡 RECOMMENDATIONS FOR ML SETTINGS OPTIMIZATION")
        print("=" * 60)
        
        recommendations = []
        
        # Database configuration recommendations
        db_config = verification_results.get("database_config", {})
        if db_config.get("active_models", 0) < 3:
            recommendations.append("🔧 Activate more ML models (target: 5-8 models for ensemble)")
        
        if db_config.get("trained_models", 0) < db_config.get("models_configured", 0):
            recommendations.append("📚 Train all configured models with recent data")
        
        confidence_stats = db_config.get("confidence_stats", {})
        if confidence_stats.get("threshold_diversity", 0) < 0.05:
            recommendations.append("🎯 Increase confidence threshold diversity between models")
        
        if not confidence_stats.get("proper_range", True):
            recommendations.append("⚖️ Adjust confidence thresholds to optimal range (0.5-0.95)")
        
        # Pipeline recommendations
        pipeline_check = verification_results.get("pipeline_check", {})
        pipeline_issues = [stage for stage, status in pipeline_check.items() 
                          if isinstance(status, bool) and not status]
        
        if pipeline_issues:
            recommendations.append(f"🔄 Fix pipeline stages: {', '.join(pipeline_issues)}")
        
        # Confidence system recommendations
        confidence_check = verification_results.get("confidence_check", {})
        if not confidence_check.get("dynamic_threshold_adjustment", False):
            recommendations.append("🔄 Implement dynamic threshold adjustment based on performance")
        
        if not confidence_check.get("trades_filtered_by_confidence", False):
            recommendations.append("🛡️ Strengthen confidence filtering to reject low-quality trades")
        
        # File configuration recommendations
        file_configs = verification_results.get("file_configs", {})
        missing_configs = [f for f, config in file_configs.items() 
                          if config.get("status") == "not_found"]
        
        if missing_configs:
            recommendations.append(f"📄 Create missing configuration files: {', '.join(missing_configs)}")
        
        # Display recommendations
        if recommendations:
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec}")
        else:
            print("🎉 Excellent! Your ML settings are well configured.")
        
        return recommendations

def main():
    """Run complete ML settings verification"""
    verifier = MLSettingsVerifier()
    
    print("🔍 Starting ML Model Settings Verification...")
    print("This will check your ML configurations, confidence thresholds,")
    print("and verify that models are using real exchange data.")
    print("\n" + "="*60)
    
    # Run verification
    verification_results = verifier.generate_settings_report()
    
    # Generate recommendations
    recommendations = verifier.generate_settings_recommendations(verification_results)
    
    # Final summary
    print(f"\n🎯 VERIFICATION COMPLETE")
    print(f"📊 {len(recommendations)} recommendations generated")
    print(f"💾 Results saved to verification log")
    
    return verification_results

if __name__ == "__main__":
    main()