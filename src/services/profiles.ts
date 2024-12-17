// src/services/profiles.ts
import api from './api';
import { Profile  } from '../types/profile';

export const ProfileService = {
  getAllProfiles: async (): Promise<Profile[]> => {
    const response = await api.get('/api/v1/profiles');  // No need to add /api/v1 here
    return response.data;
  },

  createProfile: async (profileData: FormData): Promise<Profile> => {
    const response = await api.post('/api/v1/profiles', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getProfile: async (profileId: string): Promise<Profile> => {
    const response = await api.get(`/api/v1/profiles/${profileId}`);
    return response.data;
  },

  updateProfile: async (profileId: string, profileData: FormData): Promise<Profile> => {
    const response = await api.put(`/api/v1/profiles/${profileId}`, profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfile: async (profileId: string): Promise<void> => {
    const response = await api.delete(`/api/v1/profiles/${profileId}`);
    if (!response.data?.message) {
      throw new Error('Failed to delete profile');
    }
  }
};

export default ProfileService;