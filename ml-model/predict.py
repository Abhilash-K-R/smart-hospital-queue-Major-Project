"""
ml-model/predict.py
-------------
Loads our trained Random Forest model and provides a single reusable
function, predict_wait(), that takes one patient's details and returns
a predicted wait time RANGE plus a plain-language explanation.

This file will be imported directly by the FastAPI backend (Phase 3
integration) — no separate microservice needed, since everything is
Python end-to-end.

Owner: Abhilash (Phase 3)
"""

import pandas as pd
import joblib
from pathlib import Path

# Load the model and its expected column structure ONCE when this file
# is imported, not every time predict_wait() is called — loading a .pkl
# file from disk is relatively slow, so we don't want to repeat it
# on every single prediction request.
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
    """
    Predicts a patient's wait time given their situation.

    Returns a dict with:
      - predicted_minutes: the model's raw point estimate
      - range_low / range_high: an honest range instead of a fake-precise
        single number (per our paper's design — Section 4.3)
      - explanation: a short, plain-language reason, based on which
        input feature the model weighted most heavily for THIS instance
    """
    # Build a single-row dataframe matching the training data's shape
    input_data = pd.DataFrame([{
        "doctor_id": doctor_id,
        "department": department,
        "doctor_avg_consult_minutes": doctor_avg_consult_minutes,
        "day_of_week": day_of_week,
        "hour_of_day": hour_of_day,
        "queue_length_ahead": queue_length_ahead,
        "patient_type": patient_type,
    }])

    # One-hot encode this single row the SAME way training data was encoded
    input_encoded = pd.get_dummies(input_data, columns=[
        "doctor_id", "department", "day_of_week", "patient_type"
    ])

    # Add any columns that exist in the training data but not in this
    # single input row (e.g. if this doctor's ID column wasn't generated
    # because we only have one row), filling them with 0. Then reorder
    # columns to EXACTLY match what the model was trained on — models
    # are strict about column order and presence.
    input_encoded = input_encoded.reindex(columns=model_columns, fill_value=0)

    predicted_minutes = model.predict(input_encoded)[0]

    # Present as an honest range rather than false precision —
    # +/- 15% band around the point estimate
    range_low = round(predicted_minutes * 0.85, 1)
    range_high = round(predicted_minutes * 1.15, 1)

    # Simple explainability: call out the two biggest known drivers
    # (queue length, doctor pace) if they stand out for this input
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

if __name__ == "__main__":
    # Quick manual test when running this file directly
    result = predict_wait(
        doctor_id="DOC1",
        department="Cardiology",
        doctor_avg_consult_minutes=15,
        day_of_week="Monday",
        hour_of_day=10,
        queue_length_ahead=3,
        patient_type="normal",
    )
    print(result)