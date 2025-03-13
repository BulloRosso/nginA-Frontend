// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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

// State to track refresh token process
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}[] = [];

// Process the failed requests queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else if (token) {
      // Update the authorization header
      request.config.headers.Authorization = `Bearer ${token}`;
      // Retry the request
      request.resolve(api(request.config));
    }
  });

  // Reset the queue
  failedQueue = [];
};

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

    // Prevent infinite loops - if we've already tried to refresh for this request
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Only attempt refresh on 401 errors that aren't from the refresh endpoint itself
    const isRefreshRequest = originalRequest.url?.includes('/api/v1/auth/refresh');

    if (error.response?.status === 401 && !isRefreshRequest) {
      originalRequest._retry = true; // Mark this request as retried

      // If we're already refreshing, add this request to the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Start the refresh process
      isRefreshing = true;

      try {
        // The refresh token will be included automatically as a cookie
        const response = await axios.post(
          `${cleanBaseURL}/api/v1/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );

        const { access_token } = response.data;

        if (access_token) {
          // Update token in localStorage
          localStorage.setItem('token', access_token);

          // Update authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Process any requests that failed while we were refreshing
          processQueue(null, access_token);

          // Return the original request with the new token
          return api(originalRequest);
        } else {
          throw new Error('No access token received');
        }
      } catch (refreshError) {
        // Process queue with error
        processQueue(refreshError);

        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Emit an event instead of direct navigation
        window.dispatchEvent(new CustomEvent('auth:token-expired'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default api;