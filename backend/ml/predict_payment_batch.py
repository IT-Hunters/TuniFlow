import sys
import json
import pandas as pd
import joblib

# Load the model and label encoders
try:
    model = joblib.load("ml/models/payment_prediction_model.pkl")
    label_encoders = joblib.load("ml/models/label_encoders.pkl")
except Exception as e:
    print(json.dumps({
        "error": f"Failed to load model or encoders: {str(e)}"
    }), file=sys.stderr)
    sys.exit(1)

try:
    # Lire les données depuis stdin
    input_str = sys.stdin.read().strip()
    if not input_str:
        raise ValueError("No input data received")
    
    input_data = json.loads(input_str)
    if not isinstance(input_data, list):
        raise ValueError("Input must be a list of invoices")

    # Convertir en DataFrame
    df = pd.DataFrame(input_data)
    required_columns = ["amount", "days_to_due", "category", "project_status"]
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Encoder les colonnes catégorielles
    for column in ["category", "project_status"]:
        df[column] = df[column].astype(str)
        if column in label_encoders:
            default_label = label_encoders[column].classes_[0]
            df[column] = df[column].apply(lambda x: x if x in label_encoders[column].classes_ else default_label)
            df[column] = label_encoders[column].transform(df[column])

    # Prédire
    predictions = model.predict(df[required_columns])
    probabilities = model.predict_proba(df[required_columns])

    # Décoder les prédictions
    decoded_predictions = label_encoders["status"].inverse_transform(predictions)
    decoded_probabilities = [
        {label: float(prob) for label, prob in zip(label_encoders["status"].classes_, prob_row)}
        for prob_row in probabilities
    ]

    # Préparer la sortie
    output = [
        {
            "prediction": pred,
            "probabilities": probs,
            "confidence": float(max(probs.values()))
        }
        for pred, probs in zip(decoded_predictions, decoded_probabilities)
    ]

    # Retourner les prédictions en JSON
    print(json.dumps(output))
    sys.exit(0)

except Exception as e:
    print(json.dumps({
        "error": f"Prediction failed: {str(e)}",
        "traceback": str(sys.exc_info())
    }), file=sys.stderr)
    sys.exit(1)