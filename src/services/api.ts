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
    if (error.response) {
      // Log the error for debugging
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });

      // Handle specific error cases
      switch (error.response.status) {
        case 401:

          const errorDetail = error.response.data?.detail;

          // Skip token removal for structured error responses (like email confirmation)
          if (typeof errorDetail === 'object') {
            break;
          }
          
          // Handle string error details for token validation
          if (typeof errorDetail === 'string' && (
            errorDetail.includes('Invalid token') || 
            errorDetail.includes('Token has expired') ||
            errorDetail.includes('Could not validate credentials')
          )) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;


        case 403:
          console.warn('Forbidden access:', error.response.data);
          break;

        case 404:
          console.warn('Resource not found:', error.response.data);
          break;

        case 500:
          console.error('Server error:', error.response.data);
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;