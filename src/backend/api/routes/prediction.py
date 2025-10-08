from fastapi import APIRouter, HTTPException
from models.schemas import PredictionInput, PredictionResponse, BatchPredictionInput
from services.model_service import model_service

router = APIRouter(tags=["predictions"])

@router.post("/predict", response_model=PredictionResponse)
async def predict_flood(input_data: PredictionInput):
    try:
        if not model_service.is_loaded:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        input_dict = input_data.dict()
        features = model_service.preprocess_features(input_dict)
        prediction, probability = model_service.predict(features)
        
        confidence = "high" if probability > 0.8 else "medium" if probability > 0.6 else "low"
        risk_level = "high" if prediction == 1 and probability > 0.7 else "medium" if prediction == 1 else "low"
        
        return PredictionResponse(
            prediction=int(prediction),
            probability=round(probability, 4),
            confidence=confidence,
            risk_level=risk_level
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict-batch")
async def predict_batch(batch_input: BatchPredictionInput):
    try:
        if not model_service.is_loaded:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        results = []
        for sample in batch_input.samples:
            input_dict = sample.dict()
            features = model_service.preprocess_features(input_dict)
            prediction, probability = model_service.predict(features)
            
            results.append({
                "prediction": int(prediction),
                "probability": round(probability, 4),
                "confidence": "high" if probability > 0.8 else "medium" if probability > 0.6 else "low"
            })
        
        return {
            "predictions": results,
            "total_samples": len(results),
            "flood_count": sum(r["prediction"] for r in results)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@router.get("/model-info")
async def get_model_info():
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_type": type(model_service.model).__name__,
        "features_count": len(model_service.feature_names),
        "feature_names": model_service.feature_names,
        "model_loaded": True
    }