// src/services/agents.ts
import api from './api';
import { Agent, AgentCreateDto } from '../types/agent';

interface TestAgentInput {
  input: Record<string, string>;
}

export const AgentService = {
  getAgents: async (limit: number = 100, offset: number = 0): Promise<Agent[]> => {
    const response = await api.get('/api/v1/agents', {
      params: { limit, offset }
    });
    return response.data;
  },

  getAgent: async (id: string): Promise<Agent> => {
    const response = await api.get(`/api/v1/agents/${id}`);
    return response.data;
  },

  createAgent: async (data: AgentCreateDto): Promise<Agent> => {
    const response = await api.post('/api/v1/agents', data);
    return response.data;
  },

  updateAgent: async (id: string, data: AgentCreateDto): Promise<Agent> => {
    const response = await api.put(`/api/v1/agents/${id}`, data);
    return response.data;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/agents/${id}`);
  },

  discoverAgent: async (agentDiscoveryUrl: string): Promise<Agent> => {
    const response = await api.post('/api/v1/agents/discover', { agentDiscoveryUrl });
    return response.data;
  },

  testAgent: async (id: string, data: TestAgentInput): Promise<any> => {
    const response = await api.post(`/api/v1/agents/${id}/test`, data);
    return response.data;
  }
};