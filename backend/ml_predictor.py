"""
ml_predictor.py
-------------
Object-Oriented Wait-Time Prediction Engine.
Encapsulates our trained Random Forest wait-time model (trained in ml-model/train_model.py)
and exposes both the `WaitTimePredictor` class and a backward-compatible `predict_wait()` interface.

Architecture:
  - Class: WaitTimePredictor (Encapsulates model weights, column schema, one-hot alignment, inference)
  - Singleton: default_predictor (Shared instance avoiding redundant disk I/O)
  - Function: predict_wait() (Backward-compatible adapter for FastAPI route handlers)

Owner: Abhilash (Phase 3 / IEEE Architecture Section IV)
"""

from typing import Optional, Dict, Any
from pathlib import Path
import pandas as pd
import joblib

DEFAULT_MODEL_PATH = Path(__file__).parent / "wait_time_model.pkl"
DEFAULT_COLUMNS_PATH = Path(__file__).parent / "model_columns.pkl"


class WaitTimePredictor:
    """
    Encapsulated Machine Learning Inference Service.
    Loads and serves the Random Forest regressor for outpatient queue duration forecasting.
    """
    def __init__(
        self,
        model_path: Optional[Path] = None,
        columns_path: Optional[Path] = None,
    ):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.columns_path = Path(columns_path) if columns_path else DEFAULT_COLUMNS_PATH
        self._model = None
        self._model_columns = None
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads serialized model weights and feature columns into private instance state."""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model artifact not found at {self.model_path}")
        if not self.columns_path.exists():
            raise FileNotFoundError(f"Model column schema not found at {self.columns_path}")

        self._model = joblib.load(self.model_path)
        self._model_columns = joblib.load(self.columns_path)

    @property
    def is_ready(self) -> bool:
        """Returns True if model weights and feature column definitions are loaded."""
        return self._model is not None and self._model_columns is not None

    def predict(
        self,
        doctor_id: str,
        department: str,
        doctor_avg_consult_minutes: int,
        day_of_week: str,
        hour_of_day: int,
        queue_length_ahead: int,
        patient_type: str,
    ) -> Dict[str, Any]:
        """
        Executes feature preprocessing, one-hot dummy alignment, and regression prediction.
        Generates contextual natural-language explanations for patient communication.
        """
        if not self.is_ready:
            self._load_artifacts()

        input_data = pd.DataFrame([{
            "doctor_id": str(doctor_id),
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
        input_encoded = input_encoded.reindex(columns=self._model_columns, fill_value=0)

        # Predict remaining wait duration in minutes
        predicted_minutes = float(self._model.predict(input_encoded)[0])
        range_low = predicted_minutes * 0.85
        range_high = predicted_minutes * 1.15

        # Domain explanation rule engine
        if queue_length_ahead >= 5:
            explanation = f"Wait is high mainly due to {queue_length_ahead} patients ahead in the queue."
        elif str(patient_type).lower() == "emergency":
            explanation = "Short wait — emergency patients are seen ahead of the regular queue."
        else:
            explanation = f"Estimate based on {doctor_avg_consult_minutes} min average consultation time and current queue length."

        return {
            "predicted_minutes": round(predicted_minutes, 1),
            "range_low": round(range_low, 1),
            "range_high": round(range_high, 1),
            "explanation": explanation,
        }


# Global Singleton instance for application runtime
default_predictor = WaitTimePredictor()

# Backward-compatible global exports
model = default_predictor._model
model_columns = default_predictor._model_columns

def predict_wait(
    doctor_id: str,
    department: str,
    doctor_avg_consult_minutes: int,
    day_of_week: str,
    hour_of_day: int,
    queue_length_ahead: int,
    patient_type: str,
) -> Dict[str, Any]:
    """Backward-compatible functional adapter delegating to WaitTimePredictor."""
    return default_predictor.predict(
        doctor_id=doctor_id,
        department=department,
        doctor_avg_consult_minutes=doctor_avg_consult_minutes,
        day_of_week=day_of_week,
        hour_of_day=hour_of_day,
        queue_length_ahead=queue_length_ahead,
        patient_type=patient_type,
    )
