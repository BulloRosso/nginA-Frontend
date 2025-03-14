// src/services/auth.ts
import api from './api';

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  enableMFA?: boolean; 
  language:string;
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
    refresh_token: string;
    message?: string;
    token_type?: string;
    expires_in?: number;
    expires_at?: number;
    user?: {
        id: string;
    };
}

export const AuthService = {
  
  async signup(data: SignupData): Promise<AuthResponse> {
    console.log('Signup API request data:', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        enable_mfa: data.enableMFA,
        password: data.password,
        language: data.language
    });
    
    const response = await api.post('/api/v1/auth/signup', {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      password: data.password,
      enable_mfa: data.enableMFA,
      language: data.language
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

  async dashboardLogin(email: string, password: string): Promise<AuthResponse> {
    try {
      // Use fetch directly to completely bypass the axios interceptors
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://e5ede652-5081-48eb-9e93-64c13c6bbf50-00-2cmwk7hnytqn6.worf.replit.dev';

      // Clean the URL if needed
      const cleanBaseURL = apiBaseUrl.endsWith('/api/v1') 
        ? apiBaseUrl.slice(0, -7) 
        : apiBaseUrl;

      const response = await fetch(`${cleanBaseURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: email, 
          password: password 
        }),
        credentials: 'include' // Important for cookies
      });

      const data = await response.json();

      // Check for errors in the response
      if (!response.ok) {
        if (data?.detail?.code === 'email_not_confirmed') {
          const authError = new Error(data.detail.message || 'Email not confirmed');
          authError.name = 'EmailNotConfirmedError';
          throw authError;
        }

        // Create a response-like error object for consistency
        const error = new Error(data?.detail || 'Login failed');
        (error as any).response = { 
          status: response.status,
          data: data
        };
        throw error;
      }

      console.log('Dashboard login response:', data);

      // IMPORTANT: Store only in sessionStorage for dashboard
      if (data.access_token) {
        sessionStorage.setItem('dashboard_token', data.access_token);
      }

      return data;
    } catch (error: any) {
      console.error('Dashboard login error:', error);
      throw error;
    }
  },
  
  async resendConfirmationEmail(email: string): Promise<{ message: string }> {
      try {
          const response = await api.post('/api/v1/auth/resend-confirmation', {
              email: email
          });
          return response.data;
      } catch (error: any) {
          console.error('Error resending confirmation email:', error);
          throw new Error(error.response?.data?.detail || 'Failed to resend confirmation email');
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
      
      // Store password temporarily if MFA is required
      if (response.data.mfa_required) {
        sessionStorage.setItem('temp_password', password);
      }

      return response.data;
    } catch (error: any) {
      // Detailed error logging
      console.error('Login error details:', {
          error: error,
          response: error.response,
          data: error.response?.data,
          detail: error.response?.data?.detail
      });

      if (error.response?.data?.detail?.code === 'email_not_confirmed') {
          // Create a proper error object with all necessary information
          const authError = new Error(error.response.data.detail.message || 'Email not confirmed');
          authError.name = 'EmailNotConfirmedError';
          (authError as any).response = error.response;
          (authError as any).code = error.response.data.detail.code;
          throw authError;
      }

      // For any other error, throw with proper message
      const errorMessage = error.response?.data?.detail?.message 
          || error.response?.data?.detail 
          || error.message 
          || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  async verifyMFA(
    factorId: string, 
    code: string, 
    challengeId: string | null,
    accessToken?: string,
    tempToken?: string
  ): Promise<{ access_token: string; refresh_token: string; message?: string }> {
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
            password: password
        };

        const response = await api.post('/api/v1/auth/verify-mfa', payload);
        console.log('MFA verification response:', response.data);  // Add this for debugging

        // Clear temporary password
        sessionStorage.removeItem('temp_password');

        // Validate response structure
        if (!response.data.access_token || !response.data.refresh_token) {
            throw new Error('Invalid MFA verification response structure');
        }

        // Store new tokens
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('refresh_token', response.data.refresh_token);

        return {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            message: response.data.message
        };
    } catch (error: any) {
        console.error('MFA verification error:', error);
        if (error.response?.data?.detail) {
            throw new Error(error.response.data.detail);
        }
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

  async requestPasswordReset(email: string) {
    const response = await api.post('/api/v1/auth/request-password-reset', { email });
    return response.data;
  },

  async resetPassword(newPassword: string, token: string) {
    const response = await api.post('/api/v1/auth/reset-password', { 
      new_password: newPassword,
      token: token
    });
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profileId');
  }
};