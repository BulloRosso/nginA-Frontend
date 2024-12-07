// types/api.ts
import { Memory } from './memory';

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