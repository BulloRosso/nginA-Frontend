// src/services/tags.ts
import api from './api';
import { TagNode, TagResponse } from '../types/tag';

export const TagService = {
  getAgentTags: async (agentId: string): Promise<string[]> => {
    const response = await api.get<TagResponse>(`/api/v1/tagging/${agentId}`);
    return response.data.tags ? response.data.tags.split(',') : [];
  },

  setAgentTags: async (agentId: string, tags: string[]): Promise<string[]> => {
    const response = await api.post<TagResponse>(`/api/v1/tagging/${agentId}`, {
      tags: tags.join(',')
    });
    return response.data.tags ? response.data.tags.split(',') : [];
  },

  deleteAgentTags: async (agentId: string): Promise<void> => {
    await api.delete(`/api/v1/tagging/${agentId}`);
  },

  getTagTree: async (): Promise<TagNode[]> => {
    const response = await api.get<TagNode[]>('/api/v1/tagging/tree');
    return response.data;
  },

  getTagSuggestions: async (query: string): Promise<string[]> => {
    const response = await api.get<string[]>('/api/v1/tagging/autocomplete', {
      params: { q: query }
    });
    return response.data;
  }
};