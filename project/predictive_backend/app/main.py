# predictive_backend/app/main.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import xgboost as xgb
from xgboost import XGBClassifier, XGBRegressor
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from typing import Any

from .schemas import PredictionInput, PredictionOutput
from .model_loader import load_objects, get_model_objects
from .preprocessing import preprocess_input, FEATURE_ORDER

app = FastAPI(
    title="Clinical Assistant Prediction API",
    description="API to predict ED wait times, admission likelihood, etc.",
    version="1.3.0",
)

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("Loading models and imputer...")
    load_objects()
    print("Startup: model loading finished.")

@app.post("/api/predict", response_model=PredictionOutput)
async def predict(
    inputs: PredictionInput,
    models: tuple = Depends(get_model_objects)  # models is a tuple
):
    # Unpack the tuple
    breach_model, admission_model, waiting_model, imputer = models

    try:
        # 1. Preprocess input into the DataFrame expected by your models
        preprocessed_df = preprocess_input(inputs, imputer)

        # 2. Predict Breach Probability
        if hasattr(breach_model, "predict_proba"):
            breach_probs = breach_model.predict_proba(preprocessed_df)
            breach_percent = breach_probs[0][1] * 100
        else:
            breach_percent = 0

        # 3. Predict Admission Likelihood
        if hasattr(admission_model, "predict_proba"):
            admission_probs = admission_model.predict_proba(preprocessed_df)
            admission_percent = admission_probs[0][1] * 100
        else:
            admission_percent = 0

        # 4. Predict Waiting Time
        if hasattr(waiting_model, "predict"):
            wait_preds = waiting_model.predict(preprocessed_df)
            wait_minutes = max(5, round(wait_preds[0]))
        else:
            wait_minutes = 0

        # 5. Clamp predictions between 0 and 100 if needed
        clamp = lambda x, mn, mx: min(max(x, mn), mx)

        return PredictionOutput(
            wait3h=clamp(breach_percent * 0.8, 0, 100),
            wait4h=clamp(breach_percent * 0.9, 0, 100),
            wait5h=clamp(breach_percent * 1.0, 0, 100),
            wait6h=clamp(breach_percent * 1.1, 0, 100),
            admissionLikelihood=clamp(admission_percent, 0, 100),
            predictedWaitMinutes=wait_minutes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# The following code to run uvicorn is commented out:
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)
