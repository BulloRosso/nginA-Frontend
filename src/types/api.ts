// types/api.ts
import { Memory } from './memory';
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export const MemoryService = {
  getMemories: async (profileId: string) => {
    const response = await api.get(`/api/v1/memories/${profileId}`);
    return response.data;
  },

  createMemory: async (profileId: string, memory: Memory) => {
    const response = await api.post('/api/v1/memories', {
      profile_id: profileId,
      ...memory
    });
    return response.data;
  }
};