// src/components/Dashboard/utils/axiosConfig.js
import axios from 'axios';

const apiPort = process.env.REACT_APP_API_PORT || '3001';
const fallbackBase = () => {
  const url = new URL(window.location.href);
  return `${url.protocol}//${url.hostname}:${apiPort}`;
};

const base = (process.env.REACT_APP_API_BASE || '').trim() || fallbackBase();
axios.defaults.baseURL = base.replace(/\/$/, '');


// Request interceptor - token hozzáadása
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token hozzáadva a kéréshez');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hibakezelés
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ 401 Unauthorized - token invalid');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default axios;
