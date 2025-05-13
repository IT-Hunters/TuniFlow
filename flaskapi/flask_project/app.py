from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# ------------------------------
# Load Models and Preprocessors
# ------------------------------
try:
    # Recommendation Models
    if not os.path.exists('reco_random_forest_model.pkl'):
        raise FileNotFoundError("Recommendation Random Forest model file not found")
    if not os.path.exists('reco_xgboost_model.pkl'):
        raise FileNotFoundError("Recommendation XGBoost model file not found")
    if not os.path.exists('reco_logistic_regression_model.pkl'):
        raise FileNotFoundError("Recommendation Logistic Regression model file not found")
    if not os.path.exists('reco_scaler.pkl'):
        raise FileNotFoundError("Recommendation Scaler file not found")
    if not os.path.exists('reco_rfe.pkl'):
        raise FileNotFoundError("Recommendation RFE file not found")
    if not os.path.exists('reco_label_encoder_target.pkl'):
        raise FileNotFoundError("Recommendation Label Encoder file not found")

    reco_rf_model = joblib.load('reco_random_forest_model.pkl')
    reco_xgb_model = joblib.load('reco_xgboost_model.pkl')
    reco_lr_model = joblib.load('reco_logistic_regression_model.pkl')
    reco_scaler = joblib.load('reco_scaler.pkl')
    reco_rfe = joblib.load('reco_rfe.pkl')
    reco_le_target = joblib.load('reco_label_encoder_target.pkl')

    # Priority Level Models
    if not os.path.exists('prio_random_forest_model.pkl'):
        raise FileNotFoundError("Priority Random Forest model file not found")
    if not os.path.exists('prio_xgboost_model.pkl'):
        raise FileNotFoundError("Priority XGBoost model file not found")
    if not os.path.exists('prio_logistic_regression_model.pkl'):
        raise FileNotFoundError("Priority Logistic Regression model file not found")
    if not os.path.exists('prio_scaler.pkl'):
        raise FileNotFoundError("Priority Scaler file not found")
    if not os.path.exists('prio_rfe.pkl'):
        raise FileNotFoundError("Priority RFE file not found")
    if not os.path.exists('prio_label_encoder_target.pkl'):
        raise FileNotFoundError("Priority Label Encoder file not found")
    if not os.path.exists('prio_label_encoder_merchant.pkl'):
        raise FileNotFoundError("Priority Merchant Label Encoder file not found")

    prio_rf_model = joblib.load('prio_random_forest_model.pkl')
    prio_xgb_model = joblib.load('prio_xgboost_model.pkl')
    prio_lr_model = joblib.load('prio_logistic_regression_model.pkl')
    prio_scaler = joblib.load('prio_scaler.pkl')
    prio_rfe = joblib.load('prio_rfe.pkl')
    prio_le_target = joblib.load('prio_label_encoder_target.pkl')
    prio_le_merchant = joblib.load('prio_label_encoder_merchant.pkl')

    # Spending Behavior Models
    if not os.path.exists('knn_model.pkl'):
        raise FileNotFoundError("KNN model file not found")
    if not os.path.exists('svm_model.pkl'):
        raise FileNotFoundError("SVM model file not found")
    if not os.path.exists('decision_tree_model.pkl'):
        raise FileNotFoundError("Decision Tree model file not found")
    if not os.path.exists('xgboost_model.pkl'):
        raise FileNotFoundError("Spending XGBoost model file not found")
    if not os.path.exists('scaler.pkl'):
        raise FileNotFoundError("Spending Scaler file not found")
    if not os.path.exists('label_encoder_transactiontype.pkl'):
        raise FileNotFoundError("TransactionType Label Encoder file not found")
    if not os.path.exists('label_encoder_merchant_category.pkl'):
        raise FileNotFoundError("Merchant_Category Label Encoder file not found")
    if not os.path.exists('label_encoder_y.pkl'):
        raise FileNotFoundError("Spending Label Encoder file not found")

    knn_model = joblib.load('knn_model.pkl')
    svm_model = joblib.load('svm_model.pkl')
    dt_model = joblib.load('decision_tree_model.pkl')
    spend_xgb_model = joblib.load('xgboost_model.pkl')
    spend_scaler = joblib.load('scaler.pkl')
    le_transactiontype = joblib.load('label_encoder_transactiontype.pkl')
    le_merchant_category = joblib.load('label_encoder_merchant_category.pkl')
    spend_le_target = joblib.load('label_encoder_y.pkl')
except Exception as e:
    print(f"Error loading models: {e}")
    raise

# ------------------------------
# Define Feature Sets
# ------------------------------
features = ['total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration', 
            'transaction_count', 'debit_credit_ratio', 'account_balance', 
            'customer_age', 'customer_occupation', 'avg_transactions_per_month', 
            'trans_freq_ratio']

prio_features = [
    'total_amount', 'avg_amount', 'std_amount', 'transaction_count',
    'transfer_ratio', 'avg_transactions_per_month', 'trans_freq_ratio',
    'Timestamp_Hour', 'Day_of_Month', 'merchant_category'
]

spend_features = [
    'Transaction_Amount', 'TransactionType', 'Merchant_Category',
    'Transaction_Frequency', 'Timestamp_Hour'
]

# ------------------------------
# Helper Functions
# ------------------------------
def preprocess_input(data, features, numeric_only=True):
    """Preprocess input data, setting missing features to 0 and converting to float."""
    for feature in features:
        if feature not in data:
            data[feature] = 0
        else:
            if numeric_only:
                try:
                    data[feature] = float(data[feature])
                except (ValueError, TypeError):
                    return None, f"Invalid value for {feature}: must be numeric"
    return data, None

def encode_merchant_category(data, le_merchant):
    """Encode merchant_category for priority level."""
    if 'merchant_category' in data:
        try:
            data['merchant_category'] = le_merchant.transform([data['merchant_category']])[0]
        except ValueError:
            data['merchant_category'] = le_merchant.transform([le_merchant.classes_[0]])[0]
    else:
        data['merchant_category'] = le_merchant.transform([le_merchant.classes_[0]])[0]
    return data

def encode_spending_categories(data, le_transactiontype, le_merchant_category):
    """Encode TransactionType and Merchant_Category for spending behavior."""
    if 'TransactionType' in data:
        try:
            data['TransactionType'] = le_transactiontype.transform([data['TransactionType']])[0]
        except ValueError:
            data['TransactionType'] = le_transactiontype.transform([le_transactiontype.classes_[0]])[0]
    else:
        data['TransactionType'] = le_transactiontype.transform([le_transactiontype.classes_[0]])[0]
    
    if 'Merchant_Category' in data:
        try:
            data['Merchant_Category'] = le_merchant_category.transform([data['Merchant_Category']])[0]
        except ValueError:
            data['Merchant_Category'] = le_merchant_category.transform([le_merchant_category.classes_[0]])[0]
    else:
        data['Merchant_Category'] = le_merchant_category.transform([le_merchant_category.classes_[0]])[0]
    return data

# ------------------------------
# Endpoints
# ------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        for feature in features:
            if feature not in data:
                data[feature] = 0
            else:
                try:
                    data[feature] = float(data[feature])
                except (ValueError, TypeError):
                    return jsonify({'error': f'Invalid value for {feature}: must be numeric'}), 400

        input_df = pd.DataFrame([data])
        X = input_df[features]
        X_scaled = reco_scaler.transform(X)
        X_scaled_rfe = reco_rfe.transform(X_scaled)

        rf_pred = reco_rf_model.predict(X)[0]
        xgb_pred = reco_le_target.inverse_transform(reco_xgb_model.predict(X_scaled_rfe))[0]
        lr_pred = reco_lr_model.predict(X_scaled)[0]

        rf_pred = str(rf_pred) if isinstance(rf_pred, np.ndarray) else rf_pred
        xgb_pred = str(xgb_pred) if isinstance(xgb_pred, np.ndarray) else xgb_pred
        lr_pred = str(lr_pred) if isinstance(lr_pred, np.ndarray) else lr_pred

        predictions = [rf_pred, xgb_pred, lr_pred]
        most_common_pred = max(set(predictions), key=predictions.count)
        if predictions.count(most_common_pred) == 1:
            most_common_pred = xgb_pred

        return jsonify({
            'Best Prediction': most_common_pred
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/recommend_project', methods=['POST'])
def recommend_project():
    try:
        data = request.get_json()
        if not data or 'project_id' not in data or 'financial_data' not in data:
            return jsonify({'error': 'project_id and financial_data are required'}), 400

        project_id = data['project_id']
        financial_data = data['financial_data']

        # Validate and extract required features
        required_features = ['total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration', 
                            'transaction_count', 'debit_credit_ratio', 'account_balance', 
                            'customer_age', 'customer_occupation', 'avg_transactions_per_month', 
                            'trans_freq_ratio']
        
        for feature in required_features:
            if feature not in financial_data:
                financial_data[feature] = 0
            else:
                try:
                    financial_data[feature] = float(financial_data[feature])
                except (ValueError, TypeError):
                    return jsonify({'error': f'Invalid value for {feature}: must be numeric'}), 400

        # Prepare data for prediction
        input_df = pd.DataFrame([financial_data])
        X = input_df[features]
        X_scaled = reco_scaler.transform(X)
        X_scaled_rfe = reco_rfe.transform(X_scaled)

        # Make predictions
        rf_pred = reco_rf_model.predict(X)[0]
        xgb_pred = reco_le_target.inverse_transform(reco_xgb_model.predict(X_scaled_rfe))[0]
        lr_pred = reco_lr_model.predict(X_scaled)[0]

        rf_pred = str(rf_pred) if isinstance(rf_pred, np.ndarray) else rf_pred
        xgb_pred = str(xgb_pred) if isinstance(xgb_pred, np.ndarray) else xgb_pred
        lr_pred = str(lr_pred) if isinstance(lr_pred, np.ndarray) else lr_pred

        predictions = [rf_pred, xgb_pred, lr_pred]
        most_common_pred = max(set(predictions), key=predictions.count)
        if predictions.count(most_common_pred) == 1:
            most_common_pred = xgb_pred

        return jsonify({
            'project_id': str(project_id),
            'Best Recommendation': most_common_pred
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict_priority', methods=['POST'])
def predict_priority():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Encode merchant_category
        data = encode_merchant_category(data, prio_le_merchant)
        
        # Preprocess numeric features
        data, error = preprocess_input(data, prio_features)
        if error:
            return jsonify({'error': error}), 400

        input_df = pd.DataFrame([data], columns=prio_features)
        X_scaled = prio_scaler.transform(input_df)
        X_scaled_rfe = prio_rfe.transform(X_scaled)

        rf_pred = prio_le_target.inverse_transform(prio_rf_model.predict(X_scaled))[0]
        xgb_pred = prio_le_target.inverse_transform(prio_xgb_model.predict(X_scaled_rfe))[0]
        lr_pred = prio_le_target.inverse_transform(prio_lr_model.predict(X_scaled))[0]

        rf_pred = str(rf_pred)
        xgb_pred = str(xgb_pred)
        lr_pred = str(lr_pred)

        predictions = [rf_pred, xgb_pred, lr_pred]
        most_common_pred = max(set(predictions), key=predictions.count)
        if predictions.count(most_common_pred) == 1:
            most_common_pred = xgb_pred

        return jsonify({
            'Best Prediction': most_common_pred
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/predict_spending_behavior', methods=['POST'])
def predict_spending_behavior():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Encode categorical features
        data = encode_spending_categories(data, le_transactiontype, le_merchant_category)
        
        # Preprocess numeric features
        numeric_features = ['Transaction_Amount', 'Transaction_Frequency', 'Timestamp_Hour']
        data, error = preprocess_input(data, numeric_features)
        if error:
            return jsonify({'error': error}), 400

        input_df = pd.DataFrame([data], columns=spend_features)
        X_scaled = spend_scaler.transform(input_df)

        knn_pred = spend_le_target.inverse_transform(knn_model.predict(X_scaled))[0]
        svm_pred = spend_le_target.inverse_transform(svm_model.predict(X_scaled))[0]
        dt_pred = spend_le_target.inverse_transform(dt_model.predict(X_scaled))[0]
        xgb_pred = spend_le_target.inverse_transform(spend_xgb_model.predict(X_scaled))[0]

        knn_pred = str(knn_pred)
        svm_pred = str(svm_pred)
        dt_pred = str(dt_pred)
        xgb_pred = str(xgb_pred)

        predictions = [knn_pred, svm_pred, dt_pred, xgb_pred]
        most_common_pred = max(set(predictions), key=predictions.count)
        if predictions.count(most_common_pred) == 1:
            most_common_pred = xgb_pred

        return jsonify({
            'Best Prediction': most_common_pred
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(port=8000, debug=True)