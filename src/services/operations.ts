// src/services/operations.ts
import api from './api';
import { Operation, OperationCreate, TeamStatus } from '../types/operation';

export const OperationService = {
  createOrUpdateOperation: async (data: OperationCreate): Promise<Operation> => {
    const response = await api.post('/api/v1/operations/run', data);
    return response.data;
  },

  getOperation: async (id: number): Promise<Operation> => {
    const response = await api.get(`/api/v1/operations/run/${id}`);
    return response.data;
  },

  deleteOperation: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/operations/run/${id}`);
  },

  getTeamStatus: async (): Promise<TeamStatus> => {
    const response = await api.get('/api/v1/operations/team-status');
    return response.data;
  },
};