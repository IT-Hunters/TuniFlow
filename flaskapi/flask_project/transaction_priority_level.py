# transaction_priority_level.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.feature_selection import RFE
from imblearn.over_sampling import SMOTE
from sklearn.tree import export_graphviz
import graphviz
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import xgboost

print("XGBoost version:", xgboost.__version__)

# Set random seed for reproducibility
np.random.seed(42)

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
# Transaction type ratio (e.g., Transfer vs. Credit vs. Debit)
transaction_type_counts = df.groupby('AccountID')['TransactionType'].value_counts().unstack(fill_value=0)
transaction_type_counts['transfer_ratio'] = transaction_type_counts.get('Transfer', 0) / (transaction_type_counts.sum(axis=1) + 1e-6)

# Aggregations by AccountID
aggregations = {
    'TransactionAmount': ['sum', 'mean', 'std'],
    'MerchantID': lambda x: x.value_counts().index[0],  # Most frequent merchant
    'TransactionID': 'count'
}
account_profile = df.groupby('AccountID').agg(aggregations)
account_profile.columns = ['total_amount', 'avg_amount', 'std_amount', 'merchant_category', 'transaction_count']

# Merge transfer_ratio
account_profile = account_profile.join(transaction_type_counts['transfer_ratio'])
account_profile['std_amount'] = account_profile['std_amount'].fillna(0)

# New Feature: Average transactions per month
df['TransactionMonth'] = df['TransactionDate'].dt.to_period('M')
transaction_frequency = df.groupby(['AccountID', 'TransactionMonth'])['TransactionID'].count().groupby('AccountID').mean()
account_profile = account_profile.join(transaction_frequency.rename('avg_transactions_per_month'))

# New Feature: Transaction frequency ratio
account_profile['trans_freq_ratio'] = account_profile['avg_transactions_per_month'] / (account_profile['transaction_count'] + 1e-6)

# Extract temporal features
df['Timestamp_Hour'] = df['TransactionDate'].dt.hour
df['Day_of_Month'] = df['TransactionDate'].dt.day
account_profile = account_profile.join(df.groupby('AccountID')[['Timestamp_Hour', 'Day_of_Month']].mean())

# Encode categorical variable
le = LabelEncoder()
account_profile['merchant_category'] = le.fit_transform(account_profile['merchant_category'])
account_profile.reset_index(inplace=True)

# ------------------------------
# 3. Synthetic Target Creation
# ------------------------------
def assign_priority(row):
    if row['total_amount'] > 5000 or row['Day_of_Month'] >= 25 or row['transfer_ratio'] > 0.5:
        return 'High'
    elif row['avg_amount'] > 200 or row['avg_transactions_per_month'] > 5 or 10 <= row['Day_of_Month'] <= 20:
        return 'Medium'
    else:
        return 'Low'

account_profile['Priority_Level'] = account_profile.apply(assign_priority, axis=1)

# Verify class distribution
print("\nTarget Class Distribution:")
print(account_profile['Priority_Level'].value_counts())

# Data distribution check
print("\nData Distribution for Key Features:")
print(account_profile[['total_amount', 'avg_amount', 'transaction_count']].describe())

# ------------------------------
# 4. Prepare Features and Target
# ------------------------------
features = [
    'total_amount', 'avg_amount', 'std_amount', 'transaction_count', 'transfer_ratio',
    'avg_transactions_per_month', 'trans_freq_ratio', 'Timestamp_Hour', 'Day_of_Month', 'merchant_category'
]
X = account_profile[features]
y = account_profile['Priority_Level']

# Check feature correlations
print("\nFeature Correlations with trans_freq_ratio:")
print(account_profile[features].corr()['trans_freq_ratio'])

# Train-validation-test split
X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)
X_test_scaled = scaler.transform(X_test)

# Encode target labels
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
rf_grid.fit(X_train_scaled, y_train_encoded)
models['Random Forest'] = rf_grid.best_estimator_
predictions['Random Forest'] = le_target.inverse_transform(models['Random Forest'].predict(X_test_scaled))
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
lr_grid.fit(X_train_scaled, y_train_encoded)
models['Logistic Regression'] = lr_grid.best_estimator_
predictions['Logistic Regression'] = le_target.inverse_transform(models['Logistic Regression'].predict(X_test_scaled))
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
# 7. Visualize Decision Tree (Optional, using RandomForest's first tree)
# ------------------------------
try:
    # Extract the first tree from RandomForest
    first_tree = models['Random Forest'].estimators_[0]
    dot_data = export_graphviz(first_tree, out_file=None,
                               feature_names=features,
                               class_names=le_target.classes_,
                               filled=True, rounded=True, special_characters=True)
    graph = graphviz.Source(dot_data)
    graph.render("random_forest_first_tree", view=False, format='png')
    print("Random Forest first tree visualization saved as 'random_forest_first_tree.png'")
except graphviz.backend.execute.ExecutableNotFound:
    print("Error: Graphviz executable ('dot') not found. Please install Graphviz and add it to your system PATH.")
except Exception as e:
    print(f"Error during tree visualization: {e}")

# ------------------------------
# 8. Sample Predictions
# ----------------------
test_df = X_test.copy()
test_df['Actual'] = y_test
for name, pred in predictions.items():
    test_df[f'{name}_Pred'] = pred
test_df = test_df.join(account_profile[['AccountID', 'total_amount', 'avg_amount']], rsuffix='_original', how='left')

print("\nPriority Level Predictions (Sample of 5 Accounts):")
unique_accounts = set()
for idx, row in test_df.iterrows():
    account_id = row['AccountID']
    if account_id not in unique_accounts:
        unique_accounts.add(account_id)
        print(f"\nAccountID: {account_id}")
        print(f"Actual Priority: {row['Actual']}")
        for name in models.keys():
            print(f"{name} Prediction: {row[f'{name}_Pred']}")
        print(f"Details: Total Amount=${row['total_amount']:.2f}, Avg Amount=${row['avg_amount']:.2f}")
    if len(unique_accounts) >= 5:
        break

# ------------------------------
# 9. Export Predictions
# ----------------------
export_file_path = r"C:\Users\youss\Downloads\priority_predictions_export.csv"
test_df.to_csv(export_file_path, index=False)
print(f"\nPredictions exported to: {export_file_path}")

# ------------------------------
# 10. Feature Importance (XGBoost)
# ----------------------
selected_features = np.array(features)[rfe.support_]
importances = models['XGBoost'].feature_importances_
feature_importance = pd.DataFrame({'Feature': selected_features, 'Importance': importances}).sort_values('Importance', ascending=False)
print("\nFeature Importance (XGBoost):")
print(feature_importance)

# ------------------------------
# 11. Model Comparison
# ----------------------
print("\nModel Comparison:")
print("Random Forest: High accuracy, robust to outliers, handles non-linear relationships, but less interpretable.")
print("XGBoost: High accuracy, optimized with SMOTE, RFE, regularization, and early stopping to prevent overfitting.")
print("Logistic Regression: Interpretable, fast, but limited by linear assumptions.")

# ------------------------------
# 12. Save Models and Preprocessors
# ----------------------
joblib.dump(models['Random Forest'], 'prio_random_forest_model.pkl')
joblib.dump(models['XGBoost'], 'prio_xgboost_model.pkl')
joblib.dump(models['Logistic Regression'], 'prio_logistic_regression_model.pkl')
joblib.dump(scaler, 'prio_scaler.pkl')
joblib.dump(rfe, 'prio_rfe.pkl')
joblib.dump(le_target, 'prio_label_encoder_target.pkl')
joblib.dump(le, 'prio_label_encoder_merchant.pkl')
plt.tight_layout()
plt.savefig('confusion_matrices.png')
plt.close()

if __name__ == "__main__":
    print("Script executed successfully!")