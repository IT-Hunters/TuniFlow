# spending_behavior_classification.py

# Import libraries
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, silhouette_score
from xgboost import XGBClassifier
from sklearn.tree import export_graphviz
import matplotlib.pyplot as plt
import seaborn as sns
import graphviz

# Set random seed for reproducibility
np.random.seed(42)

# ------------------------------
# 1. Data Loading and Preprocessing
# ------------------------------
file_path = r"C:\Users\youss\Downloads\bank_transactions_data_2.csv"
try:
    df = pd.read_csv(file_path)
except FileNotFoundError:
    print(f"Error: File '{file_path}' not found. Please ensure the file exists.")
    exit(1)

# Convert TransactionDate to datetime and extract hour
df['TransactionDate'] = pd.to_datetime(df['TransactionDate'], errors='coerce')
df['Timestamp_Hour'] = df['TransactionDate'].dt.hour

# Calculate transaction frequency per AccountID
transaction_frequency = df.groupby('AccountID').size().reset_index(name='Transaction_Frequency')
df = df.merge(transaction_frequency, on='AccountID', how='left')

# Select and rename features
df_features = df[['TransactionAmount', 'TransactionType', 'MerchantID', 'Transaction_Frequency', 'Timestamp_Hour']].copy()
df_features.rename(columns={
    'TransactionAmount': 'Transaction_Amount',
    'MerchantID': 'Merchant_Category'
}, inplace=True)

# Display sample data
print("First 5 rows of features:")
print(df_features.head())

# ------------------------------
# 2. Encode Categorical Variables
# ------------------------------
label_encoders = {}
categorical_columns = ['TransactionType', 'Merchant_Category']
for column in categorical_columns:
    le = LabelEncoder()
    df_features[column] = le.fit_transform(df_features[column])
    label_encoders[column] = le

# Define features for clustering
X = df_features[['Transaction_Amount', 'TransactionType', 'Merchant_Category', 'Transaction_Frequency', 'Timestamp_Hour']]

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Display scaled data
print("\nFirst 5 scaled rows:")
print(pd.DataFrame(X_scaled, columns=X.columns).head())

# ------------------------------
# 3. K-Means Clustering
# ------------------------------
# Determine optimal number of clusters using elbow method
inertia = []
K = range(2, 6)
for k in K:
    kmeans = KMeans(n_clusters=k, random_state=42)
    kmeans.fit(X_scaled)
    inertia.append(kmeans.inertia_)

# Plot elbow curve
plt.figure(figsize=(8, 5))
plt.plot(K, inertia, 'bo-')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Inertia')
plt.title('Elbow Method for Optimal k')
plt.savefig('elbow_curve.png')
plt.close()

# Fit K-Means with 4 clusters
kmeans = KMeans(n_clusters=4, random_state=42)
cluster_labels = kmeans.fit_predict(X_scaled)

# Add cluster labels to DataFrame
df_features['Cluster'] = cluster_labels

# Calculate silhouette score
silhouette_avg = silhouette_score(X_scaled, cluster_labels)
print(f"\nSilhouette Score: {silhouette_avg}")

# Display cluster distribution
print("\nCluster Distribution:")
print(df_features['Cluster'].value_counts())

# Analyze clusters
cluster_analysis = df_features.groupby('Cluster').mean()
print("\nMean Feature Values per Cluster:")
print(cluster_analysis)

# Assign tentative labels based on cluster analysis
cluster_labels_dict = {
    0: 'Savers' if cluster_analysis.loc[0, 'Transaction_Amount'] < 200 else 'Luxury Shoppers',
    1: 'Impulsive Spenders' if cluster_analysis.loc[1, 'Timestamp_Hour'] > 18 else 'Essential Spenders',
    2: 'Luxury Shoppers' if cluster_analysis.loc[2, 'Transaction_Amount'] > 500 else 'Savers',
    3: 'Essential Spenders' if cluster_analysis.loc[3, 'Transaction_Frequency'] > df_features['Transaction_Frequency'].mean() else 'Impulsive Spenders'
}

# Map cluster numbers to labels
df_features['Cluster_Label'] = df_features['Cluster'].map(cluster_labels_dict)
print("\nCluster Labels Assigned:")
print(df_features[['Cluster', 'Cluster_Label']].head())

# ------------------------------
# 4. Prepare Data for Classification
# ------------------------------
X = X_scaled
y = df_features['Cluster_Label']

# Encode target labels
le_y = LabelEncoder()
y_encoded = le_y.fit_transform(y)

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
print("\nTraining set shape:", X_train.shape)
print("Testing set shape:", X_test.shape)

# ------------------------------
# 5. Train and Evaluate Models
# ------------------------------
models = {}
predictions = {}
y_test_labels = le_y.inverse_transform(y_test)

# KNN
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
y_pred_knn = knn.predict(X_test)
y_pred_knn_labels = le_y.inverse_transform(y_pred_knn)
models['KNN'] = knn
predictions['KNN'] = y_pred_knn_labels
print("\nKNN Accuracy:", accuracy_score(y_test_labels, y_pred_knn_labels))
print("KNN Classification Report:")
print(classification_report(y_test_labels, y_pred_knn_labels))

# Plot KNN confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_knn_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for KNN')
plt.savefig('confusion_matrix_knn.png')
plt.close()

# SVM
svm = SVC(kernel='rbf', C=1, random_state=42)
svm.fit(X_train, y_train)
y_pred_svm = svm.predict(X_test)
y_pred_svm_labels = le_y.inverse_transform(y_pred_svm)
print("\nSVM Accuracy:", accuracy_score(y_test_labels, y_pred_svm_labels))
print("SVM Classification Report:")
print(classification_report(y_test_labels, y_pred_svm_labels))

# Plot SVM confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_svm_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for SVM')
plt.savefig('confusion_matrix_svm.png')
plt.close()

# Tuned SVM
param_grid_svm = {
    'C': [0.1, 1, 10, 100],
    'kernel': ['linear', 'rbf', 'poly'],
    'gamma': ['scale', 'auto', 0.1, 1]
}
svm = SVC(random_state=42)
grid_search_svm = GridSearchCV(svm, param_grid_svm, cv=5, scoring='accuracy', n_jobs=-1)
grid_search_svm.fit(X_train, y_train)
best_svm = grid_search_svm.best_estimator_
y_pred_best_svm = best_svm.predict(X_test)
y_pred_best_svm_labels = le_y.inverse_transform(y_pred_best_svm)
models['SVM'] = best_svm
predictions['SVM'] = y_pred_best_svm_labels
print("\nTuned SVM Best Parameters:", grid_search_svm.best_params_)
print("Tuned SVM Best Cross-Validation Accuracy:", grid_search_svm.best_score_)
print("Tuned SVM Accuracy:", accuracy_score(y_test_labels, y_pred_best_svm_labels))
print("Tuned SVM Classification Report:")
print(classification_report(y_test_labels, y_pred_best_svm_labels))

# Plot tuned SVM confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_best_svm_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for Tuned SVM')
plt.savefig('confusion_matrix_tuned_svm.png')
plt.close()

# Decision Tree
dt = DecisionTreeClassifier(random_state=42)
dt.fit(X_train, y_train)
y_pred_dt = dt.predict(X_test)
y_pred_dt_labels = le_y.inverse_transform(y_pred_dt)
print("\nDecision Tree Accuracy:", accuracy_score(y_test_labels, y_pred_dt_labels))
print("Decision Tree Classification Report:")
print(classification_report(y_test_labels, y_pred_dt_labels))

# Plot Decision Tree confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_dt_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for Decision Tree')
plt.savefig('confusion_matrix_dt.png')
plt.close()

# Visualize Decision Tree
try:
    dot_data = export_graphviz(dt, out_file=None,
                               feature_names=['Transaction_Amount', 'TransactionType', 'Merchant_Category', 'Transaction_Frequency', 'Timestamp_Hour'],
                               class_names=le_y.classes_,
                               filled=True, rounded=True, special_characters=True)
    graph = graphviz.Source(dot_data)
    graph.render("decision_tree", view=False, format='png')
    print("Decision Tree visualization saved as 'decision_tree.png'")
except graphviz.backend.execute.ExecutableNotFound:
    print("Error: Graphviz executable ('dot') not found. Please install Graphviz and add it to your system PATH.")
except Exception as e:
    print(f"Error during Decision Tree visualization: {e}")

# Tuned Decision Tree
param_grid_dt = {
    'max_depth': [3, 5, 7, 10, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}
dt = DecisionTreeClassifier(random_state=42)
grid_search_dt = GridSearchCV(dt, param_grid_dt, cv=5, scoring='accuracy', n_jobs=-1)
grid_search_dt.fit(X_train, y_train)
best_dt = grid_search_dt.best_estimator_
y_pred_best_dt = best_dt.predict(X_test)
y_pred_best_dt_labels = le_y.inverse_transform(y_pred_best_dt)
models['Decision Tree'] = best_dt
predictions['Decision Tree'] = y_pred_best_dt_labels
print("\nTuned Decision Tree Best Parameters:", grid_search_dt.best_params_)
print("Tuned Decision Tree Best Cross-Validation Accuracy:", grid_search_dt.best_score_)
print("Tuned Decision Tree Accuracy:", accuracy_score(y_test_labels, y_pred_best_dt_labels))
print("Tuned Decision Tree Classification Report:")
print(classification_report(y_test_labels, y_pred_best_dt_labels))

# Plot tuned Decision Tree confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_best_dt_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for Tuned Decision Tree')
plt.savefig('confusion_matrix_tuned_dt.png')
plt.close()

# XGBoost
xgb = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='mlogloss')
xgb.fit(X_train, y_train)
y_pred_xgb = xgb.predict(X_test)
y_pred_xgb_labels = le_y.inverse_transform(y_pred_xgb)
print("\nXGBoost Accuracy:", accuracy_score(y_test_labels, y_pred_xgb_labels))
print("XGBoost Classification Report:")
print(classification_report(y_test_labels, y_pred_xgb_labels))

# Plot XGBoost confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_xgb_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for XGBoost')
plt.savefig('confusion_matrix_xgb.png')
plt.close()

# Tuned XGBoost
param_grid_xgb = {
    'n_estimators': [100, 200],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.1, 0.3]
}
xgb = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='mlogloss')
grid_search_xgb = GridSearchCV(xgb, param_grid_xgb, cv=5, scoring='accuracy', n_jobs=-1)
grid_search_xgb.fit(X_train, y_train)
best_xgb = grid_search_xgb.best_estimator_
y_pred_best_xgb = best_xgb.predict(X_test)
y_pred_best_xgb_labels = le_y.inverse_transform(y_pred_best_xgb)
models['XGBoost'] = best_xgb
predictions['XGBoost'] = y_pred_best_xgb_labels
print("\nTuned XGBoost Best Parameters:", grid_search_xgb.best_params_)
print("Tuned XGBoost Best Cross-Validation Accuracy:", grid_search_xgb.best_score_)
print("Tuned XGBoost Accuracy:", accuracy_score(y_test_labels, y_pred_best_xgb_labels))
print("Tuned XGBoost Classification Report:")
print(classification_report(y_test_labels, y_pred_best_xgb_labels))

# Plot tuned XGBoost confusion matrix
plt.figure(figsize=(8, 6))
sns.heatmap(pd.crosstab(y_test_labels, y_pred_best_xgb_labels, rownames=['True'], colnames=['Predicted'], normalize='all'), annot=True, cmap='Blues')
plt.title('Confusion Matrix for Tuned XGBoost')
plt.savefig('confusion_matrix_tuned_xgb.png')
plt.close()

# ------------------------------
# 6. Model Comparison
# ------------------------------
print("\nModel Comparison:")
for name, pred_labels in predictions.items():
    print(f"{name} Accuracy: {accuracy_score(y_test_labels, pred_labels):.3f}")

print("\nDetailed Classification Reports:")
for name, pred_labels in predictions.items():
    print(f"\n{name} Classification Report:")
    print(classification_report(y_test_labels, pred_labels))

# ------------------------------
# 7. Export Predictions
# ------------------------------
export_df = pd.DataFrame(X_test, columns=['Transaction_Amount', 'TransactionType', 'Merchant_Category', 'Transaction_Frequency', 'Timestamp_Hour'])
export_df['Actual_Label'] = y_test_labels
for name, pred_labels in predictions.items():
    export_df[f'{name}_Predicted_Label'] = pred_labels
export_file_path = r"C:\Users\youss\Downloads\spending_behavior_predictions.csv"
export_df.to_csv(export_file_path, index=False)
print(f"\nPredictions exported to: {export_file_path}")

# ------------------------------
# 8. Save Models and Preprocessors
# ------------------------------
import joblib
joblib.dump(models['KNN'], 'knn_model.pkl')
joblib.dump(models['SVM'], 'svm_model.pkl')
joblib.dump(models['Decision Tree'], 'decision_tree_model.pkl')
joblib.dump(models['XGBoost'], 'xgboost_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(le_y, 'label_encoder_y.pkl')
for column, le in label_encoders.items():
    joblib.dump(le, f'label_encoder_{column.lower()}.pkl')
print("\nModels and preprocessors saved successfully.")

if __name__ == "__main__":
    print("Script executed successfully!")