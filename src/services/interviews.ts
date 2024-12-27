// src/services/interviews.ts
import api from './api';

interface InterviewResponse {
  text: string;
  language: string;
  audio_url?: string;
  emotions_detected?: Array<{
    type: string;
    intensity: number;
    description?: string;
  }>;
}



export const InterviewService = {
  startInterview: async (profileId: string, language: string) => {
    const response = await api.post(`/api/v1/interviews/${profileId}/start`, null, {
      params: {
        language
      }
    });
    return response.data;
  },

  submitResponse: async (
    profileId: string, 
    sessionId: string, 
    response: { text: string; language: string, user_id: string }
  ): Promise<{
    sentiment: {
      joy: number;
      sadness: number;
      nostalgia: number;
      intensity: number;
    };
    follow_up: string;
    is_memory: boolean;
    memory_id?: string;
  }> => {
    const result = await api.post(
      `/api/v1/interviews/${profileId}/response`,
      {
        user_id: response.user_id,
        text: response.text,
        language: response.language,
        audio_url: null,
        emotions_detected: []
      },
      {
        params: { session_id: sessionId }  // Add as query parameter
      }
    );
    return result.data;
  },

  getNextQuestion: async (profileId: string, sessionId: string, language: string) => {
    const response = await api.get(`/api/v1/interviews/${profileId}/question`, {
      params: {
        session_id: sessionId,
        language
      }
    });
    return response.data;
  }
};

export default InterviewService;