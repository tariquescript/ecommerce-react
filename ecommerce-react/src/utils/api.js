import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log('🌐 API Instance created with baseURL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
});

// Log all requests
api.interceptors.request.use(config => {
  console.log('📤 API Request:', config.method.toUpperCase(), config.url);
  return config;
});

// Log all responses
api.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;

