"""
ml_predictor.py
-------------
Loads our trained Random Forest wait-time model (trained separately in
ml-model/train_model.py) and exposes predict_wait() for the FastAPI
backend to call directly — no separate microservice, per our paper's
architecture (Section 4.1).

The .pkl files here are COPIES of the ones generated in ml-model/.
If the model is retrained, these two files must be re-copied here.

Owner: Abhilash (Phase 3)
"""

import pandas as pd
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "wait_time_model.pkl"
COLUMNS_PATH = Path(__file__).parent / "model_columns.pkl"

model = joblib.load(MODEL_PATH)
model_columns = joblib.load(COLUMNS_PATH)


def predict_wait(
    doctor_id: str,
    department: str,
    doctor_avg_consult_minutes: int,
    day_of_week: str,
    hour_of_day: int,
    queue_length_ahead: int,
    patient_type: str,
) -> dict:
    """See ml-model/predict.py for full explanation of this logic."""
    input_data = pd.DataFrame([{
        "doctor_id": doctor_id,
        "department": department,
        "doctor_avg_consult_minutes": doctor_avg_consult_minutes,
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day,
        "queue_length_ahead": queue_length_ahead,
        "patient_type": patient_type,
    }])

    input_encoded = pd.get_dummies(input_data, columns=[
        "doctor_id", "department", "day_of_week", "patient_type"
    ])
    input_encoded = input_encoded.reindex(columns=model_columns, fill_value=0)

    predicted_minutes = model.predict(input_encoded)[0]
    range_low = predicted_minutes * 0.85
    range_high = predicted_minutes * 1.15

    if queue_length_ahead >= 5:
        explanation = f"Wait is high mainly due to {queue_length_ahead} patients ahead in the queue."
    elif patient_type == "emergency":
        explanation = "Short wait — emergency patients are seen ahead of the regular queue."
    else:
        explanation = f"Estimate based on {doctor_avg_consult_minutes} min average consultation time and current queue length."

    return {
        "predicted_minutes": round(float(predicted_minutes), 1),
        "range_low": round(float(range_low), 1),
        "range_high": round(float(range_high), 1),
        "explanation": explanation,
    }