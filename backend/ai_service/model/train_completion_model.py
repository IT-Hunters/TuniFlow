import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Load dataset
data = pd.read_csv("../data/objectives.csv")

# --- FEATURE ENGINEERING ---

# Calculate project duration in weeks
data['duration_weeks'] = (pd.to_datetime(data['datefin']) - pd.to_datetime(data['datedebut'])).dt.days / 7

# Rename "progress" to "current_progress" for clarity
data['current_progress'] = data['progress']

# Calculate avg weekly progress
# Avoid division by zero
data['avg_weekly_progress'] = data.apply(
    lambda row: row['progress'] / row['duration_weeks'] if row['duration_weeks'] > 0 else 0,
    axis=1
)

# Label encode the 'objectivetype' field (because ML models need numbers not strings)
le = LabelEncoder()
data['objectivetype_encoded'] = le.fit_transform(data['objectivetype'])

# Select features and target
features = ["target_amount", "minbudget", "maxbudget", "current_progress", "avg_weekly_progress", "objectivetype_encoded"]
X = data[features]
y = data['completed']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest Classifier
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate the model (optional for now)
score = model.score(X_test, y_test)
print(f"✅ Model accuracy on test set: {score*100:.2f}%")

# Save model and label encoder
with open("../model/completion_model.pkl", "wb") as f:
    pickle.dump(model, f)

with open("../model/objectivetype_encoder.pkl", "wb") as f:
    pickle.dump(le, f)

print("✅ Model and encoder saved!")
