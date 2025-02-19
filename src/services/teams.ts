// src/services/teams.ts
import api from './api';
import { Team, TeamMember } from '../types/team';

export const TeamService = {
  getTeam: async (): Promise<Team> => {
    const response = await api.get('/api/v1/team');
    return response.data;
  },

  addAgent: async (agentId: string): Promise<Team> => {
    const response = await api.post('/api/v1/team/agents', {
      agentId
    });
    return response.data;
  },

  removeAgent: async (agentId: string): Promise<Team> => {
    const response = await api.delete(`/api/v1/team/agents/${agentId}`);
    return response.data;
  }
};