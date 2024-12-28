// src/services/profiles.ts
import api from './api';
import { Profile  } from '../types/profile';

export interface ProfileRatingData {
  completeness: number;
  memories_count: number;
  memories_with_images: number;
  rating: string;
}

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

  getProfilesForUser: async (userId: string): Promise<Profile[]> => {
      const response = await api.get(`/api/v1/profiles/user/${userId}`);
      return response.data;
  },

  getProfileRating: async (profileId: string): Promise<ProfileRatingData> => {
    console.log('getProfileRating', profileId);
    const response = await api.get(`/api/v1/profiles/rating/${profileId}`);
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