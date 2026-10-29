import axios from 'axios';
import { backendUrl } from './config';

const api = axios.create({
  baseURL: `${backendUrl}/api`,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
