import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import './FloodMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const FloodMap = ({ predictions, locations }) => {
  const [locationRisks, setLocationRisks] = useState({});

  useEffect(() => {
    if (predictions.length > 0) {
      updateLocationRisks();
    }
  }, [predictions]);

  const updateLocationRisks = () => {
    const risks = {};
    predictions.forEach(pred => {
      if (pred.locationId) {
        risks[pred.locationId] = pred.risk_level;
      }
    });
    setLocationRisks(risks);
  };

  const getLocationRisk = (locationId) => {
    return locationRisks[locationId] || 'unknown';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  if (!locations || locations.length === 0) {
    return (
      <div className="flood-map">
        <div className="map-header">
          <h2>Loading locations...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flood-map">
      <div className="map-header">
<h2>South Sudan Flood-Prone States</h2>
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color high"></div>
            <span>High Risk</span>
          </div>
          <div className="legend-item">
            <div className="legend-color medium"></div>
            <span>Medium Risk</span>
          </div>
          <div className="legend-item">
            <div className="legend-color low"></div>
            <span>Low Risk</span>
          </div>
        </div>
      </div>
      
      <MapContainer
        center={[6.877, 31.307]}
        zoom={6}
        className="map-container"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {locations.map(location => {
          const risk = getLocationRisk(location.id);
          return (
            <React.Fragment key={location.id}>
              <Circle
                center={[location.lat, location.lng]}
                radius={Math.sqrt(location.population) * 100}
                pathOptions={{
                  color: getRiskColor(risk),
                  fillColor: getRiskColor(risk),
                  fillOpacity: 0.3,
                  weight: 2
                }}
              />
              <Marker position={[location.lat, location.lng]}>
                <Popup>
                  <div className="popup-content">
                    <h3>{location.name}</h3>
                    <p><strong>State:</strong> {location.state}</p>
                    <p><strong>Risk Level:</strong> {risk}</p>
                    <p><strong>Population:</strong> {location.population.toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FloodMap;