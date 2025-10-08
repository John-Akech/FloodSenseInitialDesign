from pydantic import BaseModel
from typing import List

class PredictionInput(BaseModel):
    rainfall: float
    water_level: float
    temperature: float
    humidity: float
    wind_speed: float
    pressure: float

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    confidence: str
    risk_level: str

class BatchPredictionInput(BaseModel):
    samples: List[PredictionInput]

class HealthResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    status: str
    model_loaded: bool
    timestamp: str

class LocationResponse(BaseModel):
    id: int
    name: str
    lat: float
    lng: float
    population: int
    state: str