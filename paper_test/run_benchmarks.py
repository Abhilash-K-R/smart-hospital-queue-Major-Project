import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, KFold
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Set seed for reproducibility
np.random.seed(42)

# Set publication style for matplotlib
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.titlesize': 14,
    'figure.dpi': 300
})

os.makedirs('paper_test', exist_ok=True)

# ---------------------------------------------------------
# Load Data
# ---------------------------------------------------------
df = pd.read_csv('ml-model/dataset.csv')
y = df['wait_time_minutes']
X = df.drop(columns=['wait_time_minutes'])

# One-hot encoding
X_encoded = pd.get_dummies(X, columns=['doctor_id', 'department', 'day_of_week', 'patient_type'], dtype=float)

# Fixed 80/20 train/test split
X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)

print("="*60)
print(f"Dataset Total Records: {len(df)}")
print(f"Train Records: {len(X_train)} | Test Records: {len(X_test)}")
print("="*60)

# Define models
models = {
    'Linear Regression': LinearRegression(),
    'Decision Tree': DecisionTreeRegressor(max_depth=10, random_state=42),
    'Random Forest': RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42),
    'XGBoost': XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42)
}

# ---------------------------------------------------------
# TASK 1: Benchmark on Held-out Test Set (80/20 Split)
# ---------------------------------------------------------
print("\n" + "="*60)
print("TASK 1: HELD-OUT TEST BENCHMARK (80/20 Split)")
print("="*60)

task1_results = {}
predictions = {}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    predictions[name] = y_pred
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    task1_results[name] = {
        'MAE': float(mae),
        'RMSE': float(rmse),
        'R2': float(r2)
    }
    print(f"{name:20s} | MAE: {mae:6.2f} min | RMSE: {rmse:6.2f} min | R2: {r2:.4f}")

# ---------------------------------------------------------
# TASK 2: 5-Fold Cross-Validation
# ---------------------------------------------------------
print("\n" + "="*60)
print("TASK 2: 5-FOLD CROSS-VALIDATION")
print("="*60)

kf = KFold(n_splits=5, shuffle=True, random_state=42)
cv_results = {}

for name, model in models.items():
    fold_maes = []
    fold_rmses = []
    fold_r2s = []
    
    for train_idx, val_idx in kf.split(X_encoded, y):
        X_tr, X_val = X_encoded.iloc[train_idx], X_encoded.iloc[val_idx]
        y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]
        
        m = None
        if name == 'Linear Regression':
            m = LinearRegression()
        elif name == 'Decision Tree':
            m = DecisionTreeRegressor(max_depth=10, random_state=42)
        elif name == 'Random Forest':
            m = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
        elif name == 'XGBoost':
            m = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42)
            
        m.fit(X_tr, y_tr)
        val_pred = m.predict(X_val)
        
        fold_maes.append(mean_absolute_error(y_val, val_pred))
        fold_rmses.append(np.sqrt(mean_squared_error(y_val, val_pred)))
        fold_r2s.append(r2_score(y_val, val_pred))
        
    cv_results[name] = {
        'MAE_mean': float(np.mean(fold_maes)),
        'MAE_std': float(np.std(fold_maes)),
        'RMSE_mean': float(np.mean(fold_rmses)),
        'RMSE_std': float(np.std(fold_rmses)),
        'R2_mean': float(np.mean(fold_r2s)),
        'R2_std': float(np.std(fold_r2s)),
        'fold_maes': [float(x) for x in fold_maes],
        'fold_rmses': [float(x) for x in fold_rmses],
        'fold_r2s': [float(x) for x in fold_r2s]
    }
    
    print(f"{name:20s} | MAE: {np.mean(fold_maes):.2f} ± {np.std(fold_maes):.2f} | RMSE: {np.mean(fold_rmses):.2f} ± {np.std(fold_rmses):.2f} | R2: {np.mean(fold_r2s):.4f} ± {np.std(fold_r2s):.4f}")

# ---------------------------------------------------------
# TASK 3: Figures for Random Forest
# ---------------------------------------------------------
print("\n" + "="*60)
print("TASK 3: GENERATING PUBLICATION-GRADE FIGURES (RANDOM FOREST)")
print("="*60)

rf_preds = predictions['Random Forest']
residuals = y_test.values - rf_preds

# Figure 1: Predicted vs Actual
plt.figure(figsize=(7, 6))
plt.scatter(y_test, rf_preds, alpha=0.35, color='#1f77b4', edgecolors='none', s=35, label='Held-out Test Cases')
lims = [0, max(y_test.max(), rf_preds.max()) + 10]
plt.plot(lims, lims, color='#d62728', linestyle='--', linewidth=1.8, label='Ideal Identity Line ($y = x$)')
plt.xlabel('Actual Waiting Time (minutes)')
plt.ylabel('Predicted Waiting Time (minutes)')
plt.title('Random Forest: Predicted vs. Actual Waiting Time')
plt.xlim(lims)
plt.ylim(lims)
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(loc='upper left', frameon=True)
plt.tight_layout()
fig1_path = 'paper_test/fig_predicted_vs_actual.png'
plt.savefig(fig1_path, dpi=300)
plt.close()
print(f"Saved: {fig1_path}")

# Figure 2: Residual Plot
plt.figure(figsize=(7, 6))
plt.scatter(rf_preds, residuals, alpha=0.35, color='#2ca02c', edgecolors='none', s=35, label='Residuals')
plt.axhline(0, color='#d62728', linestyle='--', linewidth=1.8, label='Zero Error Line ($e = 0$)')
plt.xlabel('Predicted Waiting Time (minutes)')
plt.ylabel('Residual Error (Actual - Predicted, minutes)')
plt.title('Random Forest: Residual Error Distribution')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(loc='upper left', frameon=True)
plt.tight_layout()
fig2_path = 'paper_test/fig_residual_plot.png'
plt.savefig(fig2_path, dpi=300)
plt.close()
print(f"Saved: {fig2_path}")

# ---------------------------------------------------------
# TASK 4: Smart Departure Notification Simulation
# ---------------------------------------------------------
print("\n" + "="*60)
print("TASK 4: SMART DEPARTURE NOTIFICATION SIMULATION")
print("="*60)

# We evaluate on the held-out test set (800 patient cases)
# Real actual wait time = y_test
# ML predicted wait time = rf_preds
# Commute travel time distribution: realistic urban/suburban range 10 to 45 mins
# Jitter simulates real-world traffic uncertainty N(0, 3^2)

n_test = len(y_test)
actual_waits = y_test.values
pred_waits = rf_preds

# Re-seed for simulation determinism
np.random.seed(42)
commute_estimates = np.random.uniform(10, 45, size=n_test)  # ORS API estimated travel time
traffic_noise = np.random.normal(0, 3.0, size=n_test)       # real-world traffic variance
actual_commutes = np.maximum(5.0, commute_estimates + traffic_noise) # actual travel duration

delta_buffer = 10.0  # Safety buffer (minutes) to ensure on-time arrival before doctor consultation

# Policy P0: Baseline (Leave Immediately / Uncoordinated)
# Patient sets out immediately upon booking (t_depart = 0)
# Patient arrives at hospital at t_arrive = actual_commute
# Turn occurs at actual_wait
# Waiting time in hospital waiting room = max(0, actual_wait - actual_commute)
# Arrival lead time relative to consultation = actual_wait - actual_commute
p0_depart = np.zeros(n_test)
p0_arrive = actual_commutes
p0_wait_hospital = np.maximum(0.0, actual_waits - p0_arrive)
p0_lead_time = actual_waits - p0_arrive
p0_ontime = (p0_lead_time >= 0).mean() * 100.0

# Policy P1: Smart Departure Notification (Proposed)
# System notifies patient to depart when: pred_wait - commute_estimate - delta_buffer <= 0
# Ideal planned departure time: t_depart = max(0, pred_wait - commute_estimate - delta_buffer)
# Patient departs at t_depart
# Patient arrives at hospital at t_arrive = t_depart + actual_commute
# Turn occurs at actual_wait
# Waiting time in hospital waiting room = max(0, actual_waits - p1_arrive)
# Arrival lead time relative to consultation = actual_waits - p1_arrive
p1_depart = np.maximum(0.0, pred_waits - commute_estimates - delta_buffer)
p1_arrive = p1_depart + actual_commutes
p1_wait_hospital = np.maximum(0.0, actual_waits - p1_arrive)
p1_lead_time = actual_waits - p1_arrive
p1_ontime = (p1_lead_time >= 0).mean() * 100.0
# Clinical tolerance (within 5 minutes grace period if slightly delayed by traffic)
p1_punctual_tolerance = (p1_lead_time >= -5.0).mean() * 100.0

p0_mean_wait = np.mean(p0_wait_hospital)
p1_mean_wait = np.mean(p1_wait_hospital)
wait_reduction_mins = p0_mean_wait - p1_mean_wait
wait_reduction_pct = (wait_reduction_mins / p0_mean_wait) * 100.0

p0_mean_lead = np.mean(p0_lead_time)
p1_mean_lead = np.mean(p1_lead_time)

sim_results = {
    'sample_size': n_test,
    'buffer_minutes': delta_buffer,
    'P0_mean_hospital_wait': float(p0_mean_wait),
    'P0_std_hospital_wait': float(np.std(p0_wait_hospital)),
    'P0_mean_lead_time': float(p0_mean_lead),
    'P0_ontime_rate_pct': float(p0_ontime),
    'P1_mean_hospital_wait': float(p1_mean_wait),
    'P1_std_hospital_wait': float(np.std(p1_wait_hospital)),
    'P1_mean_lead_time': float(p1_mean_lead),
    'P1_ontime_rate_pct': float(p1_ontime),
    'P1_punctual_tolerance_pct': float(p1_punctual_tolerance),
    'wait_reduction_minutes': float(wait_reduction_mins),
    'wait_reduction_pct': float(wait_reduction_pct)
}

print(f"Policy P0 (Leave Immediately):")
print(f"  Avg Hospital Waiting Room Time: {p0_mean_wait:.2f} ± {np.std(p0_wait_hospital):.2f} min")
print(f"  Avg Arrival Lead Time:          {p0_mean_lead:.2f} min")
print(f"  Punctuality (On-time Arrival):  {p0_ontime:.1f}%")

print(f"\nPolicy P1 (Smart Departure Notification, Buffer={delta_buffer}m):")
print(f"  Avg Hospital Waiting Room Time: {p1_mean_wait:.2f} ± {np.std(p1_wait_hospital):.2f} min")
print(f"  Avg Arrival Lead Time:          {p1_mean_lead:.2f} min")
print(f"  Punctuality (Strict Lead >= 0): {p1_ontime:.1f}%")
print(f"  Punctuality (Grace <= 5m Late): {p1_punctual_tolerance:.1f}%")

print(f"\nComparative Impact:")
print(f"  Physical Waiting Room Time Saved: {wait_reduction_mins:.2f} min ({wait_reduction_pct:.1f}% reduction)")

# Figure 3: Simulation Comparison Figure
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Subplot 1: Hospital Waiting Room Duration Boxplot / Distribution
sns.boxplot(data=[p0_wait_hospital, p1_wait_hospital], ax=axes[0], palette=['#e74c3c', '#2ecc71'], width=0.45)
axes[0].set_xticklabels(['Policy P0\n(Leave Immediately)', 'Policy P1\n(Smart Departure)'])
axes[0].set_ylabel('In-Hospital Waiting Time (minutes)')
axes[0].set_title('(a) Physical Hospital Waiting Time')
axes[0].grid(True, linestyle=':', alpha=0.6)

# Subplot 2: Arrival Lead Time Distribution
sns.kdeplot(p0_lead_time, ax=axes[1], color='#e74c3c', label='P0: Leave Immediately', linewidth=2)
sns.kdeplot(p1_lead_time, ax=axes[1], color='#2ecc71', label='P1: Smart Departure', linewidth=2)
axes[1].axvline(0, color='black', linestyle='--', linewidth=1.5, label='Turn Ready Threshold (0 min)')
axes[1].axvline(delta_buffer, color='#3498db', linestyle=':', linewidth=1.5, label=f'Target Buffer ({delta_buffer} min)')
axes[1].set_xlabel('Arrival Lead Time Before Consultation (minutes)')
axes[1].set_ylabel('Density')
axes[1].set_title('(b) Patient Arrival Lead-Time Distribution')
axes[1].grid(True, linestyle=':', alpha=0.6)
axes[1].legend(loc='upper right', frameon=True)

plt.tight_layout()
fig3_path = 'paper_test/fig_departure_simulation.png'
plt.savefig(fig3_path, dpi=300)
plt.close()
print(f"Saved: {fig3_path}")

# ---------------------------------------------------------
# Save All Numerical Results to JSON
# ---------------------------------------------------------
full_results = {
    'task1_benchmark': task1_results,
    'task2_cross_validation': cv_results,
    'task4_simulation': sim_results
}

with open('paper_test/results.json', 'w') as f:
    json.dump(full_results, f, indent=4)

print("\n" + "="*60)
print("EXPERIMENTS COMPLETED SUCCESSFULLY! RESULTS SAVED TO paper_test/results.json")
print("="*60)

