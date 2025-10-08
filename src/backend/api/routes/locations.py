from fastapi import APIRouter
from typing import List
from models.schemas import LocationResponse

router = APIRouter(tags=["locations"])

@router.get("/locations", response_model=List[LocationResponse])
async def get_locations():
    return [
        {
            "id": 1,
            "name": "Bor",
            "lat": 6.2088,
            "lng": 31.5594,
            "population": 315000,
            "state": "Jonglei"
        },
        {
            "id": 2,
            "name": "Bentiu",
            "lat": 9.2333,
            "lng": 29.7833,
            "population": 100000,
            "state": "Unity"
        },
        {
            "id": 3,
            "name": "Malakal",
            "lat": 9.5334,
            "lng": 31.6605,
            "population": 160000,
            "state": "Upper Nile"
        },
        {
            "id": 4,
            "name": "Aweil",
            "lat": 8.7667,
            "lng": 27.4000,
            "population": 120000,
            "state": "Northern Bahr el Ghazal"
        },
        {
            "id": 5,
            "name": "Kuacjok",
            "lat": 8.1167,
            "lng": 29.6667,
            "population": 95000,
            "state": "Warrap"
        },
        {
            "id": 6,
            "name": "Juba",
            "lat": 4.8594,
            "lng": 31.5713,
            "population": 525000,
            "state": "Central Equatoria"
        }
    ]

@router.post("/locations/{location_id}/predict")
async def predict_for_location(location_id: int, weather_data: dict):
    from services.model_service import model_service
    
    if not model_service.is_loaded:
        return {"error": "Model not loaded"}
    
    try:
        features = model_service.preprocess_features(weather_data)
        prediction, probability = model_service.predict(features)
        
        return {
            "location_id": location_id,
            "prediction": int(prediction),
            "probability": round(probability, 4),
            "risk_level": "high" if prediction == 1 and probability > 0.7 else "medium" if prediction == 1 else "low"
        }
    except Exception as e:
        return {"error": str(e)}