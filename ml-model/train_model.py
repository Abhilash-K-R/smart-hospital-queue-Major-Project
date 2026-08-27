r"""
ml-model/train_model.py
-------------
Trains and compares two models on our synthetic dataset:
  1. Linear Regression — the baseline (simple, assumes additive effects)
  2. Random Forest Regressor — our proposed model (handles the
     multiplicative interactions our data was deliberately designed with)

This replicates the exact methodology from our published paper:
  - 80/20 train/test split
  - One-hot encoding for categorical features (so both models see
    identical, fairly-encoded input — necessary for a fair comparison)
  - Random Forest: 200 estimators, max depth 10 (matches paper)
  - Metrics reported: MAE, RMSE, R²

Expected results (from our paper, Table 2):
  Linear Regression — MAE 10.64 min, RMSE 14.80, R² 0.810
  Random Forest     — MAE 4.69 min,  RMSE 6.33,  R² 0.965

Owner: Abhilash (Phase 3)

HOW TO RUN:
    (venv) PS ...\ml-model> python train_model.py
    → saves the trained Random Forest model as wait_time_model.pkl
"""

import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def load_and_prepare_data():
    df = pd.read_csv("dataset.csv")

    # Separate the target (what we're predicting) from the features
    # (what we're predicting it FROM)
    y = df["wait_time_minutes"]
    X = df.drop(columns=["wait_time_minutes"])

    # One-hot encoding: turns categorical columns like "department"
    # (text) into multiple 0/1 numeric columns, e.g. department_Cardiology,
    # department_Pediatrics, etc. Models can only work with numbers,
    # not raw text, so this step is required.
    X_encoded = pd.get_dummies(X, columns=[
        "doctor_id", "department", "day_of_week", "patient_type"
    ])

    return X_encoded, y


def train_and_evaluate():
    X, y = load_and_prepare_data()

    # 80/20 split: train on 80% of records, test on the remaining 20%
    # the model has NEVER seen — this is how we measure real performance,
    # not just how well it memorized the training data.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training set: {X_train.shape[0]} records")
    print(f"Test set: {X_test.shape[0]} records\n")

    # ---- Baseline: Linear Regression ----
    lr_model = LinearRegression()
    lr_model.fit(X_train, y_train)
    lr_predictions = lr_model.predict(X_test)

    lr_mae = mean_absolute_error(y_test, lr_predictions)
    lr_rmse = np.sqrt(mean_squared_error(y_test, lr_predictions))
    lr_r2 = r2_score(y_test, lr_predictions)

    print("=== Linear Regression (baseline) ===")
    print(f"MAE:  {lr_mae:.2f} minutes")
    print(f"RMSE: {lr_rmse:.2f} minutes")
    print(f"R²:   {lr_r2:.3f}\n")

    # ---- Proposed model: Random Forest ----
    rf_model = RandomForestRegressor(
        n_estimators=200,   # 200 individual decision trees, averaged together
        max_depth=10,       # prevents any single tree from overfitting too deeply
        random_state=42,
    )
    rf_model.fit(X_train, y_train)
    rf_predictions = rf_model.predict(X_test)

    rf_mae = mean_absolute_error(y_test, rf_predictions)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_predictions))
    rf_r2 = r2_score(y_test, rf_predictions)

    print("=== Random Forest (proposed) ===")
    print(f"MAE:  {rf_mae:.2f} minutes")
    print(f"RMSE: {rf_rmse:.2f} minutes")
    print(f"R²:   {rf_r2:.3f}\n")

    improvement = (1 - rf_mae / lr_mae) * 100
    print(f"Random Forest reduced MAE by {improvement:.1f}% vs Linear Regression baseline")

    # Save the trained Random Forest model AND the exact column structure
    # it expects — we need both later when making live predictions,
    # since new incoming data must be one-hot encoded the SAME way.
    joblib.dump(rf_model, "wait_time_model.pkl")
    joblib.dump(list(X.columns), "model_columns.pkl")
    print("\nModel saved to wait_time_model.pkl")
    print("Column structure saved to model_columns.pkl")
    
    # ---- Feature importance ----
    # Shows which input features the Random Forest relied on most —
    # this is what powers our "explainability" feature (Section 4.3):
    # telling the patient WHY their wait is long, not just a bare number.
    importances = pd.Series(rf_model.feature_importances_, index=X.columns)
    top_features = importances.sort_values(ascending=False).head(10)
    print("\n=== Top 10 Feature Importances ===")
    print(top_features)

    return rf_model, X.columns


if __name__ == "__main__":
    train_and_evaluate()