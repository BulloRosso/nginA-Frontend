export interface MFAData {
  factorId: string;
  challengeId?: string;
  qrCode?: string;
  secret?: string;
  needsSetup: boolean;
  tempToken: string;
}

export interface VerificationResponse {
  access_token: string;
  refresh_token: string;
  message?: string;
  error?: string;
}

export interface AuthError extends Error {
    name: string;
    response?: {
        data: {
            detail: {
                code: string;
                message: string;
            }
        }
    };
}

export interface TOTPFactor {
  id: string;
  friendly_name: string;
  factor_type: string;
}