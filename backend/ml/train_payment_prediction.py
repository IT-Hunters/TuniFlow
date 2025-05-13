import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Expanded sample data to include more variety
data = {
    "amount": [100, 200, 150, 300, 500, 250, 400, 150, 99.99, 199.84, 100, 5, 50],
    "days_to_due": [30, 10, 20, 5, 15, 25, 8, 0, 0, 0, 12, 0, 0],
    "category": ["Service", "Product", "Service", "Product", "Service", "Freelance", "Maintenance", "tag", "aa", "Services", "Products", "N/A", "aaaaa"],
    "project_status": ["Active", "Completed", "Active", "Completed", "Active", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING", "PENDING"],
    "status": ["PAID", "PENDING", "PAID", "OVERDUE", "PAID", "CANCELLED", "OVERDUE", "PAID", "PENDING", "PAID", "OVERDUE", "CANCELLED", "PAID"]
}
df = pd.DataFrame(data)

# Encode categorical columns
label_encoders = {}
for column in ["category", "project_status", "status"]:
    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    label_encoders[column] = le

# Split features and target
X = df[["amount", "days_to_due", "category", "project_status"]]
y = df["status"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model with more trees for better accuracy
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
# Get all possible labels and their encoded values
all_labels = label_encoders["status"].classes_
encoded_all_labels = range(len(all_labels))
# Get unique labels in y_test (encoded)
unique_test_labels = y_test.unique()
# Filter labels that are present in y_test
valid_encoded_labels = [lbl for lbl in encoded_all_labels if lbl in unique_test_labels]
valid_labels = label_encoders["status"].inverse_transform(valid_encoded_labels)
# Print classification report
print("Classification Report:")
print(classification_report(y_test, y_pred, labels=valid_encoded_labels, target_names=valid_labels))

# Save model and label encoders
joblib.dump(model, "ml/models/payment_prediction_model.pkl")
joblib.dump(label_encoders, "ml/models/label_encoders.pkl")

print("Model and label encoders saved successfully!")