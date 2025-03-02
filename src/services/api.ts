// src/services/api.ts
import axios, { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev';

// Remove /api/v1 from baseURL if it's included there
const cleanBaseURL = baseURL.endsWith('/api/v1') 
  ? baseURL.slice(0, -7) 
  : baseURL;

const api: AxiosInstance = axios.create({
  baseURL: cleanBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Important: This ensures cookies are sent with requests
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Ensure proper Bearer token format
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only proceed if this isn't already a refresh request
    const isRefreshRequest = error.config.url?.includes('/api/v1/auth/refresh');

    if (error.response?.status === 401 && !isRefreshRequest) {
      try {
        // The refresh token will be included automatically as a cookie
        // because we set withCredentials: true above
        const response = await api.post('/api/v1/auth/refresh', {});

        localStorage.setItem('token', response.data.access_token);
        error.config.headers.Authorization = `Bearer ${response.data.access_token}`;

        // Retry the original request with the new token
        return api(error.config);
      } catch (refreshError) {
        // Clear auth data and redirect to login on refresh failure
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;