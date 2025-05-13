import sys
import json
import pandas as pd
import joblib

# Load the model and label encoders only once
model = joblib.load("ml/models/payment_prediction_model.pkl")
label_encoders = joblib.load("ml/models/label_encoders.pkl")

# Read input data (single invoice as JSON)
input_data = json.loads(sys.argv[1])
df = pd.DataFrame([input_data])

# Encode categorical columns
for column in ["category", "project_status"]:
    df[column] = df[column].astype(str)
    if column in label_encoders:
        # Handle unknown labels by replacing with "Other"
        df[column] = df[column].apply(lambda x: x if x in label_encoders[column].classes_ else "Other")
        df[column] = label_encoders[column].transform(df[column])

# Predict
predictions = model.predict(df[["amount", "days_to_due", "category", "project_status"]])
probabilities = model.predict_proba(df[["amount", "days_to_due", "category", "project_status"]])

# Decode predictions
decoded_prediction = label_encoders["status"].inverse_transform(predictions)[0]
decoded_probabilities = {
    label: prob for label, prob in zip(label_encoders["status"].classes_, probabilities[0])
}

# Prepare output
output = {"prediction": decoded_prediction, "probabilities": decoded_probabilities}

# Return prediction as JSON
print(json.dumps(output))