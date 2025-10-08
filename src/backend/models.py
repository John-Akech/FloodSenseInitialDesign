from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    SAFE = "safe"
    CAUTION = "caution"
    ALERT = "alert"
    DANGER = "danger"
    EXTREME = "extreme"

class AlertLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"

class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    region: Optional[str] = Field(None, description="Region name")
    country: Optional[str] = Field("South Sudan", description="Country")

class WeatherData(BaseModel):
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")
    water_level: float = Field(..., ge=0, description="Water level in meters")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage")
    wind_speed: Optional[float] = Field(None, ge=0, description="Wind speed in km/h")

class FloodFeatures(BaseModel):
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    day: int = Field(..., ge=1, le=31, description="Day (1-31)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0-6)")
    day_of_year: int = Field(..., ge=1, le=366, description="Day of year (1-366)")
    quarter: int = Field(..., ge=1, le=4, description="Quarter (1-4)")
    days_since_reference: int = Field(..., ge=0, description="Days since reference")
    scene_id_numeric: int = Field(..., ge=0, description="Scene ID numeric")
    data_coverage: int = Field(..., ge=0, le=1, description="Data coverage (0-1)")
    filename_length: int = Field(..., ge=1, description="Filename length")
    filename_hash: float = Field(..., ge=0, le=1, description="Filename hash (0-1)")
    observation_index: int = Field(..., ge=0, description="Observation index")

    @field_validator('day')
    @classmethod
    def validate_day(cls, v, info):
        if info.data:
            month = info.data.get('month')
            if month == 2 and v > 29:
                raise ValueError("Invalid day for February")
            elif month in [4, 6, 9, 11] and v > 30:
                raise ValueError("Invalid day for month with 30 days")
        return v

class FloodPredictionRequest(BaseModel):
    features: FloodFeatures
    location: Optional[Location] = None
    weather_data: Optional[WeatherData] = None
    
class FloodPredictionResponse(BaseModel):
    flood_probability: float = Field(..., ge=0, le=1, description="Flood probability (0-1)")
    risk_level: RiskLevel = Field(..., description="Risk level classification")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    timestamp: str = Field(..., description="Prediction timestamp")
    location: Optional[Location] = None
    recommendations: List[str] = Field(default_factory=list)
    weather_impact: Optional[Dict[str, Any]] = None

class Alert(BaseModel):
    id: int
    level: AlertLevel
    message: str
    region: str
    timestamp: str
    active: bool = True
    priority: int = Field(default=1, ge=1, le=5)

class Region(BaseModel):
    name: str
    risk_level: RiskLevel
    population: int
    coordinates: List[List[float]]
    center: List[float]
    current_alerts: List[Alert] = Field(default_factory=list)

class ModelPerformance(BaseModel):
    accuracy: float = Field(..., ge=0, le=1)
    precision: float = Field(..., ge=0, le=1)
    recall: float = Field(..., ge=0, le=1)
    f1_score: float = Field(..., ge=0, le=1)
    roc_auc: float = Field(..., ge=0, le=1)

class ModelInfo(BaseModel):
    model_type: str
    version: str
    performance: ModelPerformance
    training_date: str
    feature_count: int
    feature_names: List[str]
    last_updated: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    model_loaded: bool
    uptime_seconds: float
    system_info: Optional[Dict[str, Any]] = None

class BatchPredictionRequest(BaseModel):
    predictions: List[FloodPredictionRequest] = Field(..., max_length=100)
    
class BatchPredictionResponse(BaseModel):
    results: List[FloodPredictionResponse]
    total_processed: int
    processing_time_ms: float
    timestamp: str