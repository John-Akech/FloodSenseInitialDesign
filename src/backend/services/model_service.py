import joblib
import numpy as np
from typing import Tuple
import os

class ModelService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.is_loaded = False
    
    def load_model(self, model_path: str, scaler_path: str, features_path: str) -> bool:
        try:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_names = joblib.load(features_path)
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def preprocess_features(self, input_data: dict) -> np.ndarray:
        if not self.is_loaded:
            raise ValueError("Model not loaded")
        
        features = []
        for feature_name in self.feature_names:
            if feature_name in input_data:
                features.append(input_data[feature_name])
            else:
                features.append(0.0)
        
        return np.array(features).reshape(1, -1)
    
    def predict(self, features: np.ndarray) -> Tuple[int, float]:
        if not self.is_loaded:
            raise ValueError("Model not loaded")
        
        scaled_features = self.scaler.transform(features)
        prediction = self.model.predict(scaled_features)[0]
        probability = self.model.predict_proba(scaled_features)[0][1]
        
        return prediction, probability

model_service = ModelService()