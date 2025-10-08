const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = {
  async checkHealth() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  async getLocations() {
    const response = await fetch(`${API_BASE_URL}/locations`);
    return response.json();
  },

  async predict(data) {
    // Convert weather data to satellite metadata format
    const now = new Date();
    const features = {
      month: now.getMonth() + 1,
      day: now.getDate(),
      day_of_week: now.getDay(),
      day_of_year: Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)),
      quarter: Math.floor((now.getMonth() + 3) / 3),
      days_since_reference: Math.floor((now - new Date('2020-01-01')) / (1000 * 60 * 60 * 24)),
      scene_id_numeric: Math.floor(Math.random() * 350) + 50,
      data_coverage: data.rainfall > 0 ? 1 : 0,
      filename_length: Math.floor(Math.random() * 12) + 8,
      filename_hash: Math.random(),
      observation_index: Math.floor(Math.random() * 1500)
    };
    
    const requestBody = {
      features: features,
      location: data.location || null
    };
    
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    return response.json();
  },

  async predictBatch(samples) {
    const response = await fetch(`${API_BASE_URL}/predict-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ samples })
    });
    return response.json();
  },

  async getModelInfo() {
    const response = await fetch(`${API_BASE_URL}/model-info`);
    return response.json();
  },

  async predictForLocation(locationId, weatherData) {
    const response = await fetch(`${API_BASE_URL}/locations/${locationId}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weatherData)
    });
    return response.json();
  }
};