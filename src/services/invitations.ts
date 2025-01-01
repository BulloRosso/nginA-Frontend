// src/services/invitations.ts
import api from './api';
import { Invitation, InvitationStats, CreateInvitationDto } from '../types/invitation';
import { UUID } from '../types/common';

export const InvitationService = {
  
  createInvitation: async (data: CreateInvitationDto): Promise<Invitation> => {
    const response = await api.post('/api/v1/invitations', { 
        data,
      ...data,
      language: data.language || window.localStorage.getItem('language') || 'en'
    });
    return response.data;
  },

  getDashboard: async (includeExpired: boolean = false): Promise<Invitation[]> => {
    const response = await api.get('/api/v1/invitations/dashboard', {
      params: { include_expired: includeExpired }
    });
    return response.data;
  },

  getStats: async (): Promise<InvitationStats> => {
    const response = await api.get('/api/v1/invitations/stats');
    return response.data;
  },

  extendInvitation: async (invitationId: UUID, days: number = 14): Promise<Invitation> => {
    const response = await api.post(`/api/v1/invitations/${invitationId}/extend`, null, {
      params: { days }
    });
    return response.data;
  },

  revokeInvitation: async (invitationId: UUID): Promise<void> => {
    await api.post(`/api/v1/invitations/${invitationId}/revoke`);
  },

  validateToken: async (token: string): Promise<{
    valid: boolean;
    profile_id?: string;
    error?: string;
  }> => {
    try {
      const response = await api.get(`/api/v1/invitations/validate`,
                                     {
                                       params: { token }
                                     });
      return {
        valid: true,
        profile_id: response.data.profile_id
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.detail || 'Invalid token'
      };
    }
  }
};