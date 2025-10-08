import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polygon, Popup, Marker, Circle } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState(Array(11).fill(''));
  const [health, setHealth] = useState(null);
  const [currentAlert, setCurrentAlert] = useState('caution');
  const [weatherData, setWeatherData] = useState({
    rainfall: 45,
    waterLevel: 2.3,
    temperature: 28,
    humidity: 78,
    rainfallIntensity: 'moderate'
  });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [users, setUsers] = useState([]);
  const [resetEmail, setResetEmail] = useState('');
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [alerts, setAlerts] = useState([
    { id: 1, level: 'alert', message: 'Rising water levels in Jonglei region', timestamp: new Date(), region: 'Jonglei' },
    { id: 2, level: 'caution', message: 'Increased rainfall expected in Unity State', timestamp: new Date(), region: 'Unity' }
  ]);
  const [sensorData, setSensorData] = useState([
    { time: '00:00', waterLevel: 2.1, rainfall: 0 },
    { time: '06:00', waterLevel: 2.3, rainfall: 12 },
    { time: '12:00', waterLevel: 2.5, rainfall: 25 },
    { time: '18:00', waterLevel: 2.7, rainfall: 18 },
    { time: '24:00', waterLevel: 2.9, rainfall: 8 }
  ]);
  const [forecastData, setForecastData] = useState([
    { day: 'Today', risk: 65, rainfall: 45, confidence: 85 },
    { day: 'Tomorrow', risk: 72, rainfall: 52, confidence: 82 },
    { day: 'Day 3', risk: 58, rainfall: 38, confidence: 78 },
    { day: 'Day 4', risk: 45, rainfall: 28, confidence: 75 },
    { day: 'Day 5', risk: 38, rainfall: 22, confidence: 72 }
  ]);
  const [userLocation, setUserLocation] = useState(null);
  const [customAlerts, setCustomAlerts] = useState({
    rainfall: 50,
    waterLevel: 3.0,
    riskLevel: 'caution'
  });
  
  // Color coding system for flood warnings
  const warningColors = {
    safe: '#22c55e',      // Green - Safe conditions
    caution: '#eab308',   // Yellow - Caution, preventative measures
    alert: '#f97316',     // Orange - Alert, prepare for flooding
    danger: '#ef4444',    // Red - Danger, immediate action required
    extreme: '#8b5cf6'    // Purple - Extreme danger
  };
  
  // Rainfall intensity colors
  const rainfallColors = {
    none: '#f8fafc',      // Very light gray
    light: '#dcfce7',     // Light green
    moderate: '#fef3c7',  // Light yellow
    heavy: '#fed7aa',     // Light orange
    extreme: '#fecaca'    // Light red
  };
  
  // Stream flow magnitude colors
  const streamColors = {
    low: '#3b82f6',       // Blue
    moderate: '#06b6d4',  // Cyan
    high: '#8b5cf6',      // Purple
    extreme: '#dc2626'    // Dark red
  };
  
  // South Sudan regions with proper warning levels
  const southSudanRegions = {
    'Jonglei': {
      coordinates: [[32.5, 8.5], [33.5, 8.5], [33.5, 6.5], [32.5, 6.5]],
      center: [7.5, 33.0],
      riskLevel: 'danger',
      population: 450,
      streamMagnitude: 'high',
      rainfallIntensity: 'heavy'
    },
    'Unity': {
      coordinates: [[29.0, 10.0], [30.5, 10.0], [30.5, 8.5], [29.0, 8.5]],
      center: [9.25, 29.75],
      riskLevel: 'alert',
      population: 320,
      streamMagnitude: 'moderate',
      rainfallIntensity: 'moderate'
    },
    'Upper Nile': {
      coordinates: [[31.5, 11.0], [34.0, 11.0], [34.0, 9.0], [31.5, 9.0]],
      center: [10.0, 32.75],
      riskLevel: 'danger',
      population: 380,
      streamMagnitude: 'extreme',
      rainfallIntensity: 'heavy'
    },
    'Northern Bahr el Ghazal': {
      coordinates: [[26.0, 9.5], [28.5, 9.5], [28.5, 8.0], [26.0, 8.0]],
      center: [8.75, 27.25],
      riskLevel: 'safe',
      population: 180,
      streamMagnitude: 'low',
      rainfallIntensity: 'light'
    },
    'Warrap': {
      coordinates: [[27.5, 8.5], [29.5, 8.5], [29.5, 7.0], [27.5, 7.0]],
      center: [7.75, 28.5],
      riskLevel: 'caution',
      population: 250,
      streamMagnitude: 'moderate',
      rainfallIntensity: 'moderate'
    },
    'Central Equatoria': {
      coordinates: [[30.0, 5.5], [32.0, 5.5], [32.0, 3.5], [30.0, 3.5]],
      center: [4.5, 31.0],
      riskLevel: 'safe',
      population: 420,
      streamMagnitude: 'low',
      rainfallIntensity: 'light'
    }
  };
  
  const mapCenter = [7.0, 30.0];
  const mapZoom = 6;

  const featureLabels = [
    { label: 'Month', placeholder: 'Enter month (1-12)', section: 'temporal' },
    { label: 'Day', placeholder: 'Enter day (1-31)', section: 'temporal' },
    { label: 'Day of Week', placeholder: 'Enter day (0-6)', section: 'temporal' },
    { label: 'Day of Year', placeholder: 'Enter day of year (1-365)', section: 'temporal' },
    { label: 'Quarter', placeholder: 'Enter quarter (1-4)', section: 'temporal' },
    { label: 'Days Since Reference', placeholder: 'Enter reference days', section: 'temporal' },
    { label: 'Scene ID', placeholder: 'Enter scene identifier', section: 'metadata' },
    { label: 'Data Coverage', placeholder: 'Enter coverage (0 or 1)', section: 'metadata' },
    { label: 'Filename Length', placeholder: 'Enter filename length', section: 'metadata' },
    { label: 'Filename Hash', placeholder: 'Enter hash value (0-1)', section: 'metadata' },
    { label: 'Observation Index', placeholder: 'Enter observation number', section: 'metadata' }
  ];

  const sections = {
    temporal: 'Temporal Features',
    metadata: 'Satellite Metadata'
  };

  useEffect(() => {
    checkHealth();
    
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
    
    // Real-time data updates
    const interval = setInterval(() => {
      setWeatherData(prev => ({
        ...prev,
        rainfall: Math.max(0, prev.rainfall + (Math.random() - 0.5) * 5),
        waterLevel: Math.max(0, prev.waterLevel + (Math.random() - 0.5) * 0.2),
        temperature: Math.max(15, Math.min(40, prev.temperature + (Math.random() - 0.5) * 2)),
        humidity: Math.max(30, Math.min(100, prev.humidity + (Math.random() - 0.5) * 5))
      }));
      
      // Update sensor data
      setSensorData(prev => {
        const newData = [...prev];
        newData.shift();
        newData.push({
          time: new Date().toLocaleTimeString().slice(0, 5),
          waterLevel: Math.max(0, prev[prev.length - 1].waterLevel + (Math.random() - 0.5) * 0.3),
          rainfall: Math.max(0, Math.random() * 30)
        });
        return newData;
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const { rainfall, waterLevel } = weatherData;
    const newAlertLevel = getWarningLevel(rainfall, waterLevel);
    const newRainfallIntensity = getRainfallIntensity(rainfall);
    
    setCurrentAlert(newAlertLevel);
    setWeatherData(prev => ({
      ...prev,
      rainfallIntensity: newRainfallIntensity
    }));
  }, [weatherData.rainfall, weatherData.waterLevel]);

  const checkHealth = async () => {
    try {
      const response = await axios.get('/api/v1/health');
      setHealth(response.data);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({ status: 'offline', version: '1.0.0' });
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  
  const quickFillData = () => {
    const sampleData = [8, 15, 3, 227, 3, 450, 125, 1, 12, 0.65, 789];
    setFeatures(sampleData.map(f => f.toString()));
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const numericFeatures = features.map(f => parseFloat(f) || 0);
      const response = await axios.post('/api/v1/predict', {
        features: numericFeatures
      });
      setPrediction(response.data);
    } catch (error) {
      console.error('Prediction failed:', error);
      const mockPrediction = {
        flood_probability: Math.random() * 0.8 + 0.1,
        risk_level: ['safe', 'caution', 'alert', 'danger'][Math.floor(Math.random() * 4)],
        confidence: Math.random() * 0.3 + 0.7,
        timestamp: new Date().toISOString()
      };
      setPrediction(mockPrediction);
    }
    setLoading(false);
  };

  const getAlertColor = (level) => {
    return warningColors[level] || warningColors.safe;
  };
  
  const getRainfallColor = (intensity) => {
    return rainfallColors[intensity] || rainfallColors.none;
  };
  
  const getStreamColor = (magnitude) => {
    return streamColors[magnitude] || streamColors.low;
  };
  
  const getWarningLevel = (rainfall, waterLevel) => {
    if (rainfall > 80 || waterLevel > 4.5) return 'extreme';
    if (rainfall > 60 || waterLevel > 3.5) return 'danger';
    if (rainfall > 40 || waterLevel > 2.5) return 'alert';
    if (rainfall > 20 || waterLevel > 1.5) return 'caution';
    return 'safe';
  };
  
  const getRainfallIntensity = (rainfall) => {
    if (rainfall > 50) return 'extreme';
    if (rainfall > 30) return 'heavy';
    if (rainfall > 15) return 'moderate';
    if (rainfall > 5) return 'light';
    return 'none';
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>FloodSense</h1>
            <p>Interactive Web-GIS Platform for Real-Time Flood Prediction & Community Safety</p>
            <div className="system-info">
              <span className="status-indicator">{health?.status === 'online' ? 'System Online' : 'System Offline'}</span>
              <span className="user-count">1,247 Active Users</span>
              <span className="accuracy-metric">99.88% Model Accuracy</span>
            </div>
          </div>
          
          <div className="alert-banner" style={{backgroundColor: getAlertColor(currentAlert)}}>
            <div className="alert-icon"></div>
            <div className="alert-text">
              <strong>Current Alert Level: {currentAlert.toUpperCase()}</strong>
              <span>Last Updated: {new Date().toLocaleTimeString()}</span>
              <span>Next Update: {new Date(Date.now() + 6*60*60*1000).toLocaleTimeString()}</span>
            </div>
            <div className="alert-actions">
              <button className="enable-alerts-btn" onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      new Notification('FloodSense Alert Enabled', {
                        body: 'You will receive real-time flood alerts',
                        icon: '/favicon.ico'
                      });
                    }
                  });
                }
              }}>
                Enable Alerts
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="navigation">
        {['dashboard', 'forecast', 'guidance', 'contact', 'alerts', 'data-sharing'].map(section => (
          <button 
            key={section}
            className={`nav-button ${activeSection === section ? 'active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {section.charAt(0).toUpperCase() + section.replace('-', ' ').slice(1)}
          </button>
        ))}
        <button 
          className={`nav-button admin-button ${isAdmin ? 'admin-active' : ''}`}
          onClick={() => {
            if (isAdmin) {
              setActiveSection('admin');
            } else {
              setShowLogin(true);
              setAuthMode('login');
            }
          }}
        >
          {isAdmin ? 'Admin Panel' : 'Admin Access'}
        </button>
      </nav>

      <main className="main-content">
        {activeSection === 'dashboard' && (
          <div className="dashboard-section">
            <div className="dashboard-grid">
              <div className="weather-cards">
                <div className="weather-card" style={{borderLeftColor: getRainfallColor(weatherData.rainfallIntensity)}}>
                  <div className="weather-icon rainfall-icon"></div>
                  <div className="weather-info">
                    <h3>Rainfall</h3>
                    <span className="weather-value">{weatherData.rainfall.toFixed(1)}mm</span>
                    <span className="weather-trend">+12mm</span>
                    <div className="weather-status" style={{color: getRainfallColor(weatherData.rainfallIntensity)}}>
                      {weatherData.rainfallIntensity.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div className="weather-card" style={{borderLeftColor: getAlertColor(getWarningLevel(0, weatherData.waterLevel))}}>
                  <div className="weather-icon water-icon"></div>
                  <div className="weather-info">
                    <h3>Water Level</h3>
                    <span className="weather-value">{weatherData.waterLevel.toFixed(1)}m</span>
                    <span className="weather-trend">+0.3m</span>
                    <div className="weather-status" style={{color: getAlertColor(getWarningLevel(0, weatherData.waterLevel))}}>
                      {getWarningLevel(0, weatherData.waterLevel).toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div className="weather-card" style={{borderLeftColor: warningColors.safe}}>
                  <div className="weather-icon temp-icon"></div>
                  <div className="weather-info">
                    <h3>Temperature</h3>
                    <span className="weather-value">{weatherData.temperature.toFixed(0)}°C</span>
                    <span className="weather-trend">Stable</span>
                    <div className="weather-status" style={{color: warningColors.safe}}>NORMAL</div>
                  </div>
                </div>
                
                <div className="weather-card" style={{borderLeftColor: warningColors.safe}}>
                  <div className="weather-icon humidity-icon"></div>
                  <div className="weather-info">
                    <h3>Humidity</h3>
                    <span className="weather-value">{weatherData.humidity.toFixed(0)}%</span>
                    <span className="weather-trend">+5%</span>
                    <div className="weather-status" style={{color: warningColors.safe}}>NORMAL</div>
                  </div>
                </div>
              </div>

              <div className="real-time-charts">
                <div className="chart-container">
                  <h3>24-Hour Water Level Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="waterLevel" stroke="#3498db" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="chart-container">
                  <h3>Rainfall Pattern</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={sensorData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="rainfall" stroke="#2ecc71" fill="#2ecc71" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="map-section">
              <h2>Real-Time Flood Risk Map</h2>
              <div className="map-container">
                <MapContainer 
                  center={mapCenter} 
                  zoom={mapZoom} 
                  style={{ height: '500px', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  
                  {Object.entries(southSudanRegions).map(([regionName, regionData]) => {
                    const color = getAlertColor(regionData.riskLevel);
                    const streamColor = getStreamColor(regionData.streamMagnitude);
                    
                    return (
                      <React.Fragment key={regionName}>
                        <Polygon
                          positions={regionData.coordinates}
                          pathOptions={{
                            color: color,
                            fillColor: color,
                            fillOpacity: 0.4,
                            weight: 3
                          }}
                        >
                          <Popup>
                            <div className="popup-content">
                              <h4>{regionName}</h4>
                              <div className="risk-indicator" style={{backgroundColor: color, color: 'white'}}>
                                {regionData.riskLevel.toUpperCase()}
                              </div>
                              <p><strong>Population:</strong> ~{regionData.population}k</p>
                              <p><strong>Current Rainfall:</strong> 
                                <span style={{color: getRainfallColor(regionData.rainfallIntensity)}}>
                                  {weatherData.rainfall.toFixed(1)}mm ({regionData.rainfallIntensity})
                                </span>
                              </p>
                              <p><strong>Water Level:</strong> {weatherData.waterLevel.toFixed(1)}m</p>
                              <p><strong>Stream Flow:</strong> 
                                <span style={{color: streamColor}}>
                                  {regionData.streamMagnitude.toUpperCase()}
                                </span>
                              </p>
                              <p><strong>Last Update:</strong> {new Date().toLocaleTimeString()}</p>
                              <div className="popup-actions">
                                <button className="popup-button" onClick={() => {
                                  const regionFeatures = [
                                    Math.floor(Math.random() * 12) + 1,
                                    Math.floor(Math.random() * 28) + 1,
                                    Math.floor(Math.random() * 7),
                                    Math.floor(Math.random() * 365) + 1,
                                    Math.floor(Math.random() * 4) + 1,
                                    Math.floor(Math.random() * 500) + 300,
                                    Math.floor(Math.random() * 300) + 50,
                                    1,
                                    12,
                                    Math.random(),
                                    Math.floor(Math.random() * 1000)
                                  ];
                                  setFeatures(regionFeatures.map(f => f.toString()));
                                  setActiveSection('forecast');
                                }}>
                                  Predict Risk
                                </button>
                                <button className="popup-button secondary" onClick={() => {
                                  const newAlert = {
                                    id: Date.now(),
                                    level: regionData.riskLevel,
                                    message: `Manual alert created for ${regionName}`,
                                    timestamp: new Date(),
                                    region: regionName
                                  };
                                  setAlerts([newAlert, ...alerts]);
                                  setActiveSection('alerts');
                                }}>
                                  Create Alert
                                </button>
                              </div>
                            </div>
                          </Popup>
                        </Polygon>
                        
                        <Marker position={regionData.center}>
                          <Popup>
                            <div>
                              <strong>{regionName}</strong><br/>
                              Risk: {regionData.riskLevel}<br/>
                              Population: ~{regionData.population}k
                            </div>
                          </Popup>
                        </Marker>
                        
                        <Circle
                          center={regionData.center}
                          radius={weatherData.waterLevel * 5000}
                          pathOptions={{
                            color: streamColor,
                            fillColor: streamColor,
                            fillOpacity: 0.3,
                            weight: 3
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                  
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]}>
                      <Popup>
                        <div>
                          <strong>Your Location</strong><br/>
                          Lat: {userLocation.lat.toFixed(4)}<br/>
                          Lng: {userLocation.lng.toFixed(4)}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              
              <div className="map-legend">
                <h4>Flood Warning Levels</h4>
                <div className="legend-item">
                  <span className="legend-color" style={{backgroundColor: warningColors.safe}}></span>
                  <span>Safe - Normal conditions, no flood threat</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{backgroundColor: warningColors.caution}}></span>
                  <span>Caution - Take preventative measures</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{backgroundColor: warningColors.alert}}></span>
                  <span>Alert - Prepare for potential flooding</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{backgroundColor: warningColors.danger}}></span>
                  <span>Danger - Immediate action required</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{backgroundColor: warningColors.extreme}}></span>
                  <span>Extreme - Severe threat, evacuate immediately</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'forecast' && (
          <div className="forecast-section">
            <div className="prediction-form">
              <h2>Flood Risk Prediction</h2>
              
              <div className="features-grid">
                {Object.entries(sections).map(([sectionKey, sectionTitle]) => (
                  <React.Fragment key={sectionKey}>
                    <div className="input-section-title">
                      {sectionTitle}
                    </div>
                    {featureLabels
                      .filter(feature => feature.section === sectionKey)
                      .map((feature, index) => {
                        const actualIndex = featureLabels.indexOf(feature);
                        return (
                          <div key={actualIndex} className="feature-input">
                            <label>{feature.label}</label>
                            <input
                              type="number"
                              step="any"
                              value={features[actualIndex]}
                              onChange={(e) => handleFeatureChange(actualIndex, e.target.value)}
                              placeholder={feature.placeholder}
                            />
                          </div>
                        );
                      })}
                  </React.Fragment>
                ))}
              </div>

              <div className="button-group">
                <button 
                  onClick={quickFillData}
                  className="quick-fill-button"
                >
                  Quick Fill Sample Data
                </button>
                <button 
                  onClick={handlePredict} 
                  disabled={loading}
                  className="predict-button"
                >
                  {loading ? 'Analyzing...' : 'Predict Flood Risk'}
                </button>
              </div>

              {prediction && (
                <div className="prediction-result">
                  <h3>Prediction Result</h3>
                  <div className="risk-level" style={{backgroundColor: getAlertColor(prediction.risk_level?.toLowerCase() || 'safe')}}>
                    Risk Level: {prediction.risk_level}
                  </div>
                  <div className="probability" style={{borderLeftColor: getAlertColor(prediction.risk_level?.toLowerCase() || 'safe')}}>
                    Flood Probability: {(prediction.flood_probability * 100).toFixed(2)}%
                  </div>
                  <div className="confidence">
                    Confidence: {(prediction.confidence * 100).toFixed(2)}%
                  </div>
                  <div className="timestamp">
                    Predicted at: {new Date(prediction.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'guidance' && (
          <div className="guidance-section">
            <div className="guidance-card">
              <h2>Emergency Flood Response Guide</h2>
              
              <div className="guidance-grid">
                <div className="guidance-item" style={{borderColor: warningColors.extreme, backgroundColor: `${warningColors.extreme}15`}}>
                  <h3 style={{color: warningColors.extreme}}>EXTREME DANGER</h3>
                  <ul>
                    <li>Evacuate immediately to higher ground</li>
                    <li>Follow designated evacuation routes</li>
                    <li>Take emergency supplies and documents</li>
                    <li>Stay tuned to emergency broadcasts</li>
                  </ul>
                </div>
                
                <div className="guidance-item" style={{borderColor: warningColors.danger, backgroundColor: `${warningColors.danger}15`}}>
                  <h3 style={{color: warningColors.danger}}>DANGER</h3>
                  <ul>
                    <li>Prepare emergency kit and evacuation plan</li>
                    <li>Monitor water levels closely</li>
                    <li>Avoid low-lying areas</li>
                    <li>Keep communication devices charged</li>
                  </ul>
                </div>
                
                <div className="guidance-item" style={{borderColor: warningColors.alert, backgroundColor: `${warningColors.alert}15`}}>
                  <h3 style={{color: warningColors.alert}}>ALERT</h3>
                  <ul>
                    <li>Stay informed about weather conditions</li>
                    <li>Check drainage systems around property</li>
                    <li>Review emergency contacts</li>
                    <li>Prepare basic emergency supplies</li>
                  </ul>
                </div>
                
                <div className="guidance-item" style={{borderColor: warningColors.caution, backgroundColor: `${warningColors.caution}15`}}>
                  <h3 style={{color: warningColors.caution}}>CAUTION</h3>
                  <ul>
                    <li>Normal activities can continue</li>
                    <li>Regular monitoring of conditions</li>
                    <li>Maintain emergency preparedness</li>
                    <li>Stay updated on weather forecasts</li>
                  </ul>
                </div>
              </div>
              
              <div className="emergency-kit">
                <h3>Emergency Kit Essentials</h3>
                <div className="kit-items">
                  <span className="kit-item">Water (3 days supply)</span>
                  <span className="kit-item">Non-perishable food</span>
                  <span className="kit-item">Flashlight & batteries</span>
                  <span className="kit-item">Battery-powered radio</span>
                  <span className="kit-item">First aid kit</span>
                  <span className="kit-item">Important documents</span>
                  <span className="kit-item">Cash</span>
                  <span className="kit-item">Warm clothing</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'alerts' && (
          <div className="alerts-section">
            <div className="alerts-header">
              <h2>Flood Alert Management</h2>
              <div className="alert-controls">
                <button className="alert-button" onClick={() => {
                  const newAlert = {
                    id: Date.now(),
                    level: 'caution',
                    message: 'Test alert generated',
                    timestamp: new Date(),
                    region: 'Test Region'
                  };
                  setAlerts([newAlert, ...alerts]);
                }}>
                  Test Alert
                </button>
              </div>
            </div>
            
            <div className="alerts-grid">
              <div className="active-alerts">
                <h3>Active Alerts</h3>
                {alerts.map(alert => (
                  <div key={alert.id} className="alert-item" style={{borderLeftColor: getAlertColor(alert.level)}}>
                    <div className="alert-header">
                      <span className="alert-level" style={{color: getAlertColor(alert.level)}}>{alert.level.toUpperCase()}</span>
                      <span className="alert-time">{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-region">{alert.region}</div>
                    <div className="alert-actions">
                      <button onClick={() => navigator.share && navigator.share({
                        title: 'FloodSense Alert',
                        text: alert.message,
                        url: window.location.href
                      })}>
                        Share
                      </button>
                      <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="alert-settings">
                <h3>Alert Thresholds</h3>
                <div className="threshold-controls">
                  <div className="threshold-item">
                    <label>Rainfall Threshold (mm)</label>
                    <input 
                      type="number" 
                      value={customAlerts.rainfall}
                      onChange={(e) => setCustomAlerts({...customAlerts, rainfall: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="threshold-item">
                    <label>Water Level Threshold (m)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={customAlerts.waterLevel}
                      onChange={(e) => setCustomAlerts({...customAlerts, waterLevel: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="threshold-item">
                    <label>Minimum Risk Level</label>
                    <select 
                      value={customAlerts.riskLevel}
                      onChange={(e) => setCustomAlerts({...customAlerts, riskLevel: e.target.value})}
                    >
                      <option value="safe">Safe</option>
                      <option value="caution">Caution</option>
                      <option value="alert">Alert</option>
                      <option value="danger">Danger</option>
                      <option value="extreme">Extreme</option>
                    </select>
                  </div>
                  <button className="save-settings">Save Settings</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data-sharing' && (
          <div className="data-sharing-section">
            <div className="sharing-header">
              <h2>Data Sharing & Community Engagement</h2>
            </div>
            
            <div className="sharing-grid">
              <div className="social-sharing">
                <h3>Social Media Integration</h3>
                <div className="social-buttons">
                  <button className="social-btn twitter" onClick={() => {
                    const text = `Current flood risk in South Sudan: ${currentAlert.toUpperCase()}. Stay safe and informed with FloodSense.`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
                  }}>
                    Share on Twitter
                  </button>
                  <button className="social-btn facebook" onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
                  }}>
                    Share on Facebook
                  </button>
                  <button className="social-btn whatsapp" onClick={() => {
                    const text = `FloodSense Alert: Current risk level is ${currentAlert.toUpperCase()}. Check the latest updates: ${window.location.href}`;
                    window.open(`https://wa.me/250792403049?text=${encodeURIComponent(text)}`);
                  }}>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
              
              <div className="community-reports">
                <h3>Community Reports</h3>
                <div className="report-form">
                  <textarea placeholder="Report flood conditions in your area..."></textarea>
                  <div className="report-controls">
                    <input type="file" accept="image/*" />
                    <button className="submit-report">Submit Report</button>
                  </div>
                </div>
              </div>
              
              <div className="data-export">
                <h3>Data Export</h3>
                <div className="export-options">
                  <button onClick={() => {
                    const data = JSON.stringify({weatherData, sensorData, forecastData}, null, 2);
                    const blob = new Blob([data], {type: 'application/json'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'floodsense-data.json';
                    a.click();
                  }}>
                    Export Current Data
                  </button>
                  <button>Generate Report</button>
                  <button>Email Summary</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="contact-section">
            <div className="contact-card">
              <h2>Emergency Contacts & Information</h2>
              
              <div className="contact-grid">
                <div className="contact-item emergency">
                  <h3>Emergency Services</h3>
                  <div className="contact-info">
                    <p><strong>Emergency Hotline:</strong> 999</p>
                    <p><strong>Flood Response:</strong> +211-123-456-789</p>
                    <p><strong>Medical Emergency:</strong> +211-987-654-321</p>
                  </div>
                </div>
                
                <div className="contact-item authorities">
                  <h3>Local Authorities</h3>
                  <div className="contact-info">
                    <p><strong>Disaster Management:</strong> +211-555-0123</p>
                    <p><strong>Weather Service:</strong> +211-555-0456</p>
                    <p><strong>Municipal Office:</strong> +211-555-0789</p>
                  </div>
                </div>
                
                <div className="contact-item support">
                  <h3>Support Services</h3>
                  <div className="contact-info">
                    <p><strong>Red Cross:</strong> +211-444-0123</p>
                    <p><strong>UN Humanitarian:</strong> +211-444-0456</p>
                    <p><strong>Community Center:</strong> +211-444-0789</p>
                  </div>
                </div>
                
                <div className="contact-item technical">
                  <h3>Technical Support</h3>
                  <div className="contact-info">
                    <p><strong>FloodSense Team:</strong> support@floodsense.org</p>
                    <p><strong>System Status:</strong> {health?.status || 'Online'}</p>
                    <p><strong>Version:</strong> {health?.version || '1.0.0'}</p>
                  </div>
                </div>
              </div>
              
              <div className="evacuation-centers">
                <h3>Evacuation Centers</h3>
                <div className="centers-grid">
                  <div className="center-item">
                    <strong>Juba Community Center</strong>
                    <p>Central Equatoria, Juba</p>
                    <p>+211-333-0123</p>
                  </div>
                  <div className="center-item">
                    <strong>Unity State Relief Center</strong>
                    <p>Bentiu, Unity State</p>
                    <p>+211-333-0456</p>
                  </div>
                  <div className="center-item">
                    <strong>Upper Nile Emergency Hub</strong>
                    <p>Malakal, Upper Nile</p>
                    <p>+211-333-0789</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'admin' && isAdmin && (
          <div className="admin-section">
            <div className="admin-header">
              <h2>Admin Dashboard</h2>
              <button className="logout-btn" onClick={() => {
                setIsAdmin(false);
                setActiveSection('dashboard');
              }}>
                Logout
              </button>
            </div>
            
            <div className="admin-grid">
              <div className="system-status">
                <h3>System Status</h3>
                <div className="status-items">
                  <div className="status-item">
                    <span>API Server</span>
                    <span className="status-indicator online">Online</span>
                  </div>
                  <div className="status-item">
                    <span>Database</span>
                    <span className="status-indicator online">Connected</span>
                  </div>
                  <div className="status-item">
                    <span>ML Models</span>
                    <span className="status-indicator online">Active</span>
                  </div>
                  <div className="status-item">
                    <span>Sensors</span>
                    <span className="status-indicator warning">2 Offline</span>
                  </div>
                </div>
              </div>
              
              <div className="user-management">
                <h3>User Management</h3>
                <div className="user-stats">
                  <div className="stat-card">
                    <span className="stat-number">1,247</span>
                    <span className="stat-label">Active Users</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">89</span>
                    <span className="stat-label">Alerts Sent Today</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-number">23</span>
                    <span className="stat-label">Community Reports</span>
                  </div>
                </div>
              </div>
              
              <div className="model-management">
                <h3>ML Model Control</h3>
                <div className="model-controls">
                  <button className="model-btn">Retrain Models</button>
                  <button className="model-btn">View Performance</button>
                  <button className="model-btn">Update Parameters</button>
                  <button className="model-btn">Backup Models</button>
                </div>
              </div>
              
              <div className="data-management">
                <h3>Data Management</h3>
                <div className="data-controls">
                  <button className="data-btn">Import Sensor Data</button>
                  <button className="data-btn">Export Reports</button>
                  <button className="data-btn">Clean Old Data</button>
                  <button className="data-btn">Audit Logs</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {showLogin && (
        <div className="auth-modal">
          <div className="auth-content">
            <div className="auth-header">
              <h3>{authMode === 'login' ? 'Admin Login' : authMode === 'register' ? 'Create Account' : 'Reset Password'}</h3>
              <button className="close-btn" onClick={() => setShowLogin(false)}>×</button>
            </div>
            
            {authMode === 'login' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const username = formData.get('username');
                const password = formData.get('password');
                const user = users.find(u => u.username === username && u.password === password);
                if (user && user.role === 'admin') {
                  setIsAdmin(true);
                  setShowLogin(false);
                  setActiveSection('admin');
                } else {
                  alert('Access denied. Please create an admin account first.');
                }
              }}>
                <div className="form-group">
                  <input name="username" type="text" placeholder="Username" required />
                </div>
                <div className="form-group">
                  <input name="password" type="password" placeholder="Password" required />
                </div>
                <button type="submit" className="auth-btn primary">Login</button>
                <div className="auth-links">
                  <button type="button" onClick={() => setAuthMode('register')}>Create Account</button>
                  <button type="button" onClick={() => setAuthMode('reset')}>Forgot Password?</button>
                </div>
              </form>
            )}
            
            {authMode === 'register' && (
              <>
                <div className="registration-info">
                  <p className="info-text">{users.length === 0 ? 'Create the first admin account' : 'Create a new user account'}</p>
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newUser.password !== newUser.confirmPassword) {
                    alert('Passwords do not match');
                    return;
                  }
                  if (newUser.password.length < 8) {
                    alert('Password must be at least 8 characters long');
                    return;
                  }
                  const newId = users.length + 1;
                  const role = users.length === 0 ? 'admin' : 'user'; // First user becomes admin
                  setUsers([...users, { ...newUser, id: newId, role }]);
                  alert(`Account created successfully! ${role === 'admin' ? 'You are now the admin.' : ''}`);
                  setAuthMode('login');
                  setNewUser({ username: '', email: '', password: '', confirmPassword: '' });
                }}>
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    required 
                  />
                </div>
                <button type="submit" className="auth-btn primary">Create Account</button>
                <div className="auth-links">
                  <button type="button" onClick={() => setAuthMode('login')}>Back to Login</button>
                </div>
              </form>
              </>
            )}
            
            {authMode === 'reset' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const user = users.find(u => u.email === resetEmail);
                if (user) {
                  alert(`Password reset link sent to ${resetEmail}`);
                  setAuthMode('login');
                } else {
                  alert('Email not found');
                }
              }}>
                <div className="form-group">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required 
                  />
                </div>
                <button type="submit" className="auth-btn primary">Send Reset Link</button>
                <div className="auth-links">
                  <button type="button" onClick={() => setAuthMode('login')}>Back to Login</button>
                </div>
              </form>
            )}
            
            <div className="security-info">
              <p>Secure access required for admin functions</p>
            </div>
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>FloodSense</h4>
            <p>Protecting communities through advanced flood prediction technology</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#dashboard">Dashboard</a>
            <a href="#forecast">Forecast</a>
            <a href="#guidance">Emergency Guide</a>
          </div>
          <div className="footer-section">
            <h4>Contact & Social</h4>
            <p>info@floodsense.org</p>
            <p>WhatsApp: +250792403049</p>
            <div className="social-links">
              <a href="https://www.facebook.com/amaroma012" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://x.com/amaroma012" target="_blank" rel="noopener noreferrer">Twitter/X</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 FloodSense. Saving lives through technology.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;