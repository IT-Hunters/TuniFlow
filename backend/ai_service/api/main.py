from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pickle

# Initialize FastAPI app
app = FastAPI()

# Setup CORS (important for frontend-backend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (adjust if needed for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the machine learning model and encoder
with open("../model/completion_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("../model/objectivetype_encoder.pkl", "rb") as f:
    encoder = pickle.load(f)

# Define the Pydantic model for input validation
class ObjectiveFeatures(BaseModel):
    target_amount: float
    minbudget: float
    maxbudget: float
    current_progress: float
    avg_weekly_progress: float
    objectivetype: str

# Define the prediction endpoint
@app.post("/predict-completion")
def predict_completion(objective: ObjectiveFeatures):
    # Convert objectivetype to uppercase to handle case-insensitivity
    objective_type = objective.objectivetype.upper()

    # Check if the provided type exists in the encoder
    if objective_type not in encoder.classes_:
        return {"error": f"Unknown objectivetype '{objective_type}'. Please use one of {list(encoder.classes_)}"}

    # Encode the objectivetype
    objectivetype_encoded = encoder.transform([objective_type])

    # Prepare the features for prediction
    features = [
        objective.target_amount,
        objective.minbudget,
        objective.maxbudget,
        objective.current_progress,
        objective.avg_weekly_progress,
        objectivetype_encoded[0]
    ]

    final_features = np.array(features).reshape(1, -1)

    # Make prediction
    prediction = model.predict(final_features)

    # Return the result
    return {
        "completed": bool(prediction[0])
    }
