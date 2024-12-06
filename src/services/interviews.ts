import api from './api';
import { Interview, InterviewResponse } from '../types';

export const InterviewService = {
  startInterview: async (profileId: string) => {
    const response = await api.post(`/api/v1/interviews/${profileId}/start`);
    return response.data;
  },

  submitResponse: async (profileId: string, sessionId: string, response: InterviewResponse) => {
    const result = await api.post(`/api/v1/interviews/${profileId}/response`, {
      session_id: sessionId,
      ...response
    });
    return result.data;
  },

  getNextQuestion: async (profileId: string, sessionId: string) => {
    const response = await api.get(`/api/v1/interviews/${profileId}/question`, {
      params: { session_id: sessionId }
    });
    return response.data;
  }
};