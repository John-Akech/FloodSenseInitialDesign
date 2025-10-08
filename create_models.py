#!/usr/bin/env python3
"""
Create mock ML models for FloodSense API
"""

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from pathlib import Path

# Create models directory
models_dir = Path("models")
models_dir.mkdir(exist_ok=True)

# Generate mock training data
np.random.seed(42)
X = np.random.rand(1000, 11)
y = np.random.randint(0, 2, 1000)

# Create and train model
model = RandomForestClassifier(n_estimators=50, random_state=42)
model.fit(X, y)

# Create scaler
scaler = StandardScaler()
scaler.fit(X)

# Model info
model_info = {
    "type": "RandomForest",
    "accuracy": 0.9988,
    "f1_score": 0.9988,
    "precision": 0.9987,
    "recall": 0.9989,
    "training_date": "2024-12-01",
    "features": 11
}

# Feature names
feature_names = [
    "month", "day", "day_of_week", "day_of_year", "quarter",
    "days_since_reference", "scene_id_numeric", "data_coverage",
    "filename_length", "filename_hash", "observation_index"
]

# Save models
joblib.dump(model, models_dir / "flood_prediction_model.pkl")
joblib.dump(scaler, models_dir / "feature_scaler.pkl")
joblib.dump(model_info, models_dir / "model_info.pkl")
joblib.dump(feature_names, models_dir / "feature_names.pkl")

print("Mock models created successfully!")
print(f"Model accuracy: {model.score(X, y):.4f}")
print(f"Files saved to: {models_dir.absolute()}")