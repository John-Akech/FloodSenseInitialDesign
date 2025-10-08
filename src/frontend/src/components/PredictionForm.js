import React, { useState } from 'react';
import { api } from '../services/api';
import './PredictionForm.css';

const PredictionForm = ({ onPrediction, locations }) => {
  const [formData, setFormData] = useState({
    rainfall: '',
    water_level: '',
    temperature: '',
    humidity: '',
    wind_speed: '',
    pressure: ''
  });
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value) || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await api.predict(formData);
      setResult(data);
      onPrediction({ 
        ...data, 
        timestamp: new Date().toISOString(), 
        input: formData,
        locationId: selectedLocation ? parseInt(selectedLocation) : null
      });
    } catch (error) {
      setResult({ error: 'Prediction failed. Please check if the backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form">
      <div className="form-header">
        <h2>Flood Risk Prediction</h2>
        <p>Enter current weather conditions to assess flood risk</p>
      </div>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="location">Location (Optional)</label>
          <select
            id="location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="location-select"
          >
            <option value="">Select a location</option>
            {locations && locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}, {location.state}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="rainfall">Rainfall (mm)</label>
            <input
              type="number"
              id="rainfall"
              name="rainfall"
              value={formData.rainfall}
              onChange={handleChange}
              step="0.1"
              required
              placeholder="0.0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="water_level">Water Level (m)</label>
            <input
              type="number"
              id="water_level"
              name="water_level"
              value={formData.water_level}
              onChange={handleChange}
              step="0.1"
              required
              placeholder="0.0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="temperature">Temperature (°C)</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={formData.temperature}
              onChange={handleChange}
              step="0.1"
              required
              placeholder="25.0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="humidity">Humidity (%)</label>
            <input
              type="number"
              id="humidity"
              name="humidity"
              value={formData.humidity}
              onChange={handleChange}
              step="0.1"
              min="0"
              max="100"
              required
              placeholder="60.0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="wind_speed">Wind Speed (km/h)</label>
            <input
              type="number"
              id="wind_speed"
              name="wind_speed"
              value={formData.wind_speed}
              onChange={handleChange}
              step="0.1"
              required
              placeholder="10.0"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pressure">Pressure (hPa)</label>
            <input
              type="number"
              id="pressure"
              name="pressure"
              value={formData.pressure}
              onChange={handleChange}
              step="0.1"
              required
              placeholder="1013.25"
            />
          </div>
        </div>
        
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Analyzing...' : 'Predict Flood Risk'}
        </button>
      </form>
      
      {result && (
        <div className={`result-card ${result.error ? 'error' : result.risk_level}`}>
          {result.error ? (
            <div className="error-content">
              <h3>Error</h3>
              <p>{result.error}</p>
            </div>
          ) : (
            <div className="result-content">
              <h3>Prediction Result</h3>
              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Flood Probability</span>
                  <span className="stat-value">{(result.flood_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Confidence</span>
                  <span className="stat-value">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Risk Level</span>
                  <span className="stat-value">{result.risk_level}</span>
                </div>
              </div>
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="recommendations">
                  <h4>Recommendations:</h4>
                  <ul>
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionForm;