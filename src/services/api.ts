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
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // The refresh token is automatically included in the request via cookie
        const response = await api.post('/api/v1/auth/refresh');

        // Store new access token
        const newAccessToken = response.data.access_token;
        localStorage.setItem('token', newAccessToken);

        // Update the failed request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear everything and redirect to login
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Optional: Emit an event that auth context can listen to
        window.dispatchEvent(new Event('auth-error'));

        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;