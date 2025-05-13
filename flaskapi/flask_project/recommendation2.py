import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.feature_selection import RFE
from imblearn.over_sampling import SMOTE
import xgboost
print("XGBoost version:", xgboost.__version__)

# ------------------------------
# 1. Data Ingestion & Cleaning
# ------------------------------
file_path = r"C:\Users\youss\Downloads\bank_transactions_data_2.csv"
df = pd.read_csv(file_path)
df['TransactionDate'] = pd.to_datetime(df['TransactionDate'], errors='coerce')
df = df.sort_values(by=['AccountID', 'TransactionDate'])
df = df.dropna()

# ------------------------------
# 2. Feature Engineering & Aggregation
# ------------------------------
# Debit vs. credit ratio
transaction_type_counts = df.groupby('AccountID')['TransactionType'].value_counts().unstack(fill_value=0)
transaction_type_counts['debit_credit_ratio'] = transaction_type_counts.get('Debit', 0) / (transaction_type_counts.get('Credit', 0) + 1e-6)

# Aggregations
aggregations = {
    'TransactionAmount': ['sum', 'mean', 'std'],
    'TransactionDuration': 'mean',
    'TransactionID': 'count',
    'AccountBalance': 'last',
    'CustomerAge': 'last',
    'CustomerOccupation': lambda x: x.value_counts().index[0]
}
user_profile = df.groupby('AccountID').agg(aggregations)
user_profile.columns = ['total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration', 'transaction_count', 'account_balance', 'customer_age', 'customer_occupation']

# Merge debit_credit_ratio
user_profile = user_profile.join(transaction_type_counts['debit_credit_ratio'])
user_profile['std_spend'] = user_profile['std_spend'].fillna(0)

# New Feature: Average transactions per month
df['TransactionMonth'] = df['TransactionDate'].dt.to_period('M')
transaction_frequency = df.groupby(['AccountID', 'TransactionMonth'])['TransactionID'].count().groupby('AccountID').mean()
user_profile = user_profile.join(transaction_frequency.rename('avg_transactions_per_month'))

# New Feature: Transaction frequency ratio
user_profile['trans_freq_ratio'] = user_profile['avg_transactions_per_month'] / (user_profile['transaction_count'] + 1e-6)

# Encode categorical variable
le = LabelEncoder()
user_profile['customer_occupation'] = le.fit_transform(user_profile['customer_occupation'])
user_profile.reset_index(inplace=True)

# ------------------------------
# 3. Synthetic Target Creation
# ------------------------------
def assign_recommendation(row):
    if row['account_balance'] < 4000 and row['total_spend'] > 2500:
        return 'High Priority: Personal Loan'
    elif row['account_balance'] > 12000 and row['transaction_count'] < 5:
        return 'High Priority: Premium Savings Plan'
    elif row['customer_age'] < 30 and 100 <= row['avg_spend'] <= 800:
        if row['account_balance'] >= 5000:
            return 'Credit Card with Rewards'
        else:
            return 'Starter Credit Card'
    elif 5000 <= row['account_balance'] <= 10000 and row['total_spend'] < 2000:
        return 'Standard Savings Plan'
    elif row['account_balance'] > 7000 and row['total_spend'] > 3000:
        return 'Investment Options'
    else:
        return 'No Specific Recommendation'

user_profile['RecommendedProduct'] = user_profile.apply(assign_recommendation, axis=1)

# Verify class distribution
print("\nTarget Class Distribution:")
print(user_profile['RecommendedProduct'].value_counts())

# Data distribution check
print("\nData Distribution for Key Features:")
print(user_profile[['account_balance', 'total_spend', 'transaction_count']].describe())

# ------------------------------
# 4. Prepare Features and Target
# ------------------------------
features = ['total_spend', 'avg_spend', 'std_spend', 'avg_transaction_duration', 'transaction_count', 'debit_credit_ratio', 'account_balance', 'customer_age', 'customer_occupation', 'avg_transactions_per_month', 'trans_freq_ratio']
X = user_profile[features]
y = user_profile['RecommendedProduct']

# Check feature correlations
print("\nFeature Correlations with trans_freq_ratio:")
print(user_profile[features].corr()['trans_freq_ratio'])

# Train-validation-test split
X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

# Encode target labels for XGBoost
le_target = LabelEncoder()
y_train_encoded = le_target.fit_transform(y_train)
y_val_encoded = le_target.transform(y_val)
y_test_encoded = le_target.transform(y_test)

# Check training class distribution
print("\nTraining Class Distribution:")
print(pd.Series(y_train).value_counts())

# ------------------------------
# 5. Train Models with Hyperparameter Tuning
# ----------------------
models = {}
predictions = {}

# Random Forest
rf_param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2]
}
rf_grid = GridSearchCV(RandomForestClassifier(random_state=42), rf_param_grid, cv=3, scoring='accuracy', n_jobs=-1)
rf_grid.fit(X_train, y_train)
models['Random Forest'] = rf_grid.best_estimator_   
predictions['Random Forest'] = models['Random Forest'].predict(X_test)
print("Best Random Forest Parameters:", rf_grid.best_params_)

# XGBoost with Optimizations
# Handle class imbalance with SMOTE
smote = SMOTE(random_state=42, k_neighbors=2)
X_train_scaled_resampled, y_train_encoded_resampled = smote.fit_resample(X_train_scaled, y_train_encoded)
print("\nClass Distribution After SMOTE:")
print(pd.Series(y_train_encoded_resampled).value_counts())

# Feature selection with RFE
rfe = RFE(estimator=XGBClassifier(random_state=42, eval_metric='mlogloss'), n_features_to_select=8)
X_train_scaled_rfe = rfe.fit_transform(X_train_scaled_resampled, y_train_encoded_resampled)
X_val_scaled_rfe = rfe.transform(X_val_scaled)
X_test_scaled_rfe = rfe.transform(X_test_scaled)
print("\nSelected Features by RFE:", np.array(features)[rfe.support_])

# Expanded hyperparameter tuning
xgb_param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [3, 4, 5],
    'learning_rate': [0.01, 0.05, 0.1],
    'subsample': [0.6, 0.8, 1.0],
    'colsample_bytree': [0.6, 0.8, 1.0],
    'reg_alpha': [0.0, 0.1, 1.0],
    'reg_lambda': [0.1, 1.0, 10.0]
}
skf = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
xgb_random = RandomizedSearchCV(
    XGBClassifier(random_state=42, eval_metric='mlogloss'),
    xgb_param_grid,
    n_iter=20,
    cv=skf,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)
xgb_random.fit(X_train_scaled_rfe, y_train_encoded_resampled)

# Train best model with early stopping
best_xgb = XGBClassifier(
    **xgb_random.best_params_,
    random_state=42,
    eval_metric='mlogloss',
    early_stopping_rounds=10
)
best_xgb.fit(
    X_train_scaled_rfe,
    y_train_encoded_resampled,
    eval_set=[(X_val_scaled_rfe, y_val_encoded)],
    verbose=False
)
models['XGBoost'] = best_xgb
predictions['XGBoost'] = le_target.inverse_transform(models['XGBoost'].predict(X_test_scaled_rfe))
print("Best XGBoost Parameters:", xgb_random.best_params_)

# Logistic Regression
lr_param_grid = {
    'C': [0.1, 1, 10],
    'solver': ['lbfgs', 'liblinear'],
    'max_iter': [1000]
}
lr_grid = GridSearchCV(LogisticRegression(random_state=42), lr_param_grid, cv=3, scoring='accuracy', n_jobs=-1)
lr_grid.fit(X_train_scaled, y_train)
models['Logistic Regression'] = lr_grid.best_estimator_
predictions['Logistic Regression'] = models['Logistic Regression'].predict(X_test_scaled)
print("Best Logistic Regression Parameters:", lr_grid.best_params_)

# ------------------------------
# 6. Evaluate Models
# ----------------------
print("\nModel Performance:")
for name, pred in predictions.items():
    print(f"\n{name} Accuracy: {accuracy_score(y_test, pred):.4f}")
    print(f"{name} Classification Report:\n{classification_report(y_test, pred)}")

# Train and Validation Accuracy for XGBoost
train_pred = le_target.inverse_transform(models['XGBoost'].predict(X_train_scaled_rfe))
val_pred = le_target.inverse_transform(models['XGBoost'].predict(X_val_scaled_rfe))
print(f"\nXGBoost Train Accuracy: {accuracy_score(le_target.inverse_transform(y_train_encoded_resampled), train_pred):.4f}")
print(f"XGBoost Validation Accuracy: {accuracy_score(y_val, val_pred):.4f}")

# ------------------------------
# 7. Sample Recommendations
# ----------------------
test_df = X_test.copy()
test_df['Actual'] = y_test
for name, pred in predictions.items():
    test_df[f'{name}_Pred'] = pred
test_df = test_df.join(user_profile[['AccountID', 'account_balance', 'avg_spend']], rsuffix='_original', how='left')

print("\nFinancial Product Recommendations (Sample of 5 Accounts):")
unique_accounts = set()
for idx, row in test_df.iterrows():
    account_id = row['AccountID']
    if account_id not in unique_accounts:
        unique_accounts.add(account_id)
        print(f"\nAccountID: {account_id}")
        print(f"Actual Recommendation: {row['Actual']}")
        for name in models.keys():
            print(f"{name} Prediction: {row[f'{name}_Pred']}")
        print(f"Details: Balance=${row['account_balance']:.2f}, Avg Spend=${row['avg_spend']:.2f}")
    if len(unique_accounts) >= 5:
        break

# ------------------------------
# 8. Export Recommendations
# ----------------------
export_file_path = r"C:\Users\youss\Downloads\recommendation2Export_optimized.csv"
test_df.to_csv(export_file_path, index=False)
print(f"\nRecommendations exported to: {export_file_path}")

# ------------------------------
# 9. Feature Importance (XGBoost)
# ----------------------
selected_features = np.array(features)[rfe.support_]
importances = models['XGBoost'].feature_importances_
feature_importance = pd.DataFrame({'Feature': selected_features, 'Importance': importances}).sort_values('Importance', ascending=False)
print("\nFeature Importance (XGBoost):")
print(feature_importance)

# ------------------------------
# 10. Model Comparison
# ----------------------
print("\nModel Comparison:")
print("Random Forest: High accuracy, robust to outliers, handles non-linear relationships, but less interpretable.")
print("XGBoost: High accuracy, optimized with SMOTE, RFE, regularization, and early stopping to prevent overfitting.")
print("Logistic Regression: Interpretable, fast, but limited by linear assumptions.")

# Save models, scaler, RFE, and label encoder
import joblib
joblib.dump(models['Random Forest'], 'reco_random_forest_model.pkl')
joblib.dump(models['XGBoost'], 'reco_xgboost_model.pkl')
joblib.dump(models['Logistic Regression'], 'reco_logistic_regression_model.pkl')
joblib.dump(scaler, 'reco_scaler.pkl')
joblib.dump(rfe, 'reco_rfe.pkl')
joblib.dump(le_target, 'reco_label_encoder_target.pkl')