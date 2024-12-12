// src/services/auth.ts
import api from './api';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export const AuthService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/api/v1/auth/signup', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password
    });

    // Store the token
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Sending login request with:', { email }); // Debug logging

      const response = await api.post('/api/v1/auth/login', {
        email: email,
        password: password
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  async resetPassword(email: string): Promise<void> {
    await api.post('/api/v1/auth/reset-password', { email });
  },

  logout() {
    localStorage.removeItem('token');
  }
};