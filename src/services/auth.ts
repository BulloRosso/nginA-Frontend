// src/services/auth.ts
import api from './api';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface MFAFactors {
  totp: Array<{
    id: string;
    friendly_name: string;
  }>;
}

export interface MFAData {
  factor_id: string;
  challenge_id?: string;
  qr_code?: string;
  secret?: string;
  needs_setup: boolean;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_validated?: boolean;
  };
  mfa_required?: boolean;
  mfa_data?: MFAData;
}

export interface MFAFactors {
  totp: Array<{
    id: string;
    friendly_name: string;
    factor_type: string;
  }>;
}

export interface MFALevel {
  currentLevel: string;
  nextLevel: string;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;  // Add this
  token_type?: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_validated?: boolean;
  };
  mfa_required?: boolean;
  mfa_data?: MFAData;
}

export interface MFAVerificationResponse {
  access_token: string;
  message: string;
}

export const AuthService = {
  
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/api/v1/auth/signup', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password
    });

    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  },

  async listMFAFactors(): Promise<{ data: MFAFactors | null; error: Error | null }> {
    try {
      const response = await api.get('/api/v1/auth/mfa-factors');
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('List MFA factors error:', error);
      return { 
        data: null, 
        error: new Error(error.response?.data?.detail || 'Failed to list MFA factors') 
      };
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/v1/auth/login', {
        email: email,
        password: password
      });

      console.log('Raw login response:', response.data);

      // Store both tokens
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      // Store password temporarily if MFA is required
      if (response.data.mfa_required) {
        sessionStorage.setItem('temp_password', password);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  async verifyMFA(
    factorId: string, 
    code: string, 
    challengeId: string | null,
    accessToken?: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      console.log('Starting MFA verification with:', {
        factorId,
        code,
        hasAccessToken: !!accessToken
      });

      const token = accessToken || localStorage.getItem('token');
      const password = sessionStorage.getItem('temp_password');

      if (!token) {
        throw new Error('No access token available for MFA verification');
      }

      const payload = {
        factor_id: factorId,
        code: code,
        challenge_id: challengeId,
        access_token: token,
        password: password  // Pass the password for re-authentication
      };

      const response = await api.post('/api/v1/auth/verify-mfa', payload);

      // Clear temporary password
      sessionStorage.removeItem('temp_password');

      // Store new tokens
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }

      return response.data;
    } catch (error: any) {
      console.error('MFA verification error details:', error);
      throw error;
    }
  },

  async getAuthLevel(): Promise<{ data: MFALevel | null; error: Error | null }> {
    try {
      const response = await api.get('/api/v1/auth/mfa-level');
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Auth level check error:', error);
      return { 
        data: null, 
        error: new Error(error.response?.data?.detail || 'Failed to check MFA status') 
      };
    }
  },

  async enrollMFA(): Promise<{ data: any; error: Error | null }> {
    try {
      const response = await api.post('/api/v1/auth/enroll-mfa');
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      return {
        data: null,
        error: new Error(error.response?.data?.detail || 'Failed to enroll MFA'),
      };
    }
  },

  async createMFAChallenge(factorId: string): Promise<{ data: { id: string }; error: Error | null }> {
    try {
      const response = await api.post('/api/v1/auth/challenge-mfa', { factor_id: factorId });
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('MFA challenge error:', error);
      return {
        data: null as any,
        error: new Error(error.response?.data?.detail || 'Failed to create MFA challenge'),
      };
    }
  },
  
  async checkValidationStatus(userId: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/v1/auth/validation-status/${userId}`);
      return response.data.is_validated;
    } catch (error) {
      console.error('Validation check error:', error);
      return false;
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await api.post('/api/v1/auth/request-password-reset', { email });
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  },

  async resetPassword(email: string): Promise<void> {
    await api.post('/api/v1/auth/reset-password', { email });
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profileId');
  }
};