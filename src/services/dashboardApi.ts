// src/services/dashboardApi.ts
import axios, { AxiosInstance } from 'axios';

// Use the same base URL as the main API
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev';

// Remove /api/v1 from baseURL if it's included there
const cleanBaseURL = baseURL.endsWith('/api/v1') 
  ? baseURL.slice(0, -7) 
  : baseURL;

console.log('Dashboard API using base URL:', cleanBaseURL);

// Create a separate axios instance for dashboard operations
// that doesn't share interceptors with the main API
const dashboardApi: AxiosInstance = axios.create({
  baseURL: cleanBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep cookies
  timeout: 10000, // 10 second timeout
});

// Custom request interceptor that uses sessionStorage instead of localStorage
dashboardApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('dashboard_token');

  console.log('Dashboard API request to:', config.url);
  console.log('Dashboard token available:', !!token);

  if (token) {
    config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  return config;
});

// Custom response interceptor that doesn't redirect
dashboardApi.interceptors.response.use(
  (response) => {
    console.log('Dashboard API successful response:', response.status);
    return response;
  },
  async (error) => {
    console.error('Dashboard API error response:', error);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }

    // For dashboard, we don't attempt token refresh or redirect
    // Just propagate the error to be handled by the component
    return Promise.reject(error);
  }
);

export default dashboardApi;