// src/services/vault.ts
import api from './api';

export interface Credential {
  id?: string;
  service_name: string;
  key_name: string;
  secret_key: string;
  created_at?: string;
}

export const VaultService = {
  getCredentials: async (): Promise<Credential[]> => {
    const response = await api.get('/api/v1/vault');
    return response.data;
  },

  createCredential: async (data: Credential): Promise<Credential> => {
    const response = await api.post('/api/v1/vault', data);
    return response.data;
  },

  deleteCredential: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/vault/${id}`);
  }
};