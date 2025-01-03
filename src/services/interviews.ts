// src/services/interviews.ts
import api from './api';

export interface InterviewResponse {
  text: string;
  user_id: string;
  language: string;
}

export interface InterviewSession {
  session_id: string;
  initial_question: string;
}

export interface InterviewResult {
  follow_up: string;
  is_memory: boolean;
  memory_id?: string;
}

export class InterviewService {
  static async startInterview(profileId: string, language: string = 'en'): Promise<InterviewSession> {
    try {
      const response = await api.post(`/api/v1/interviews/${profileId}/start`, null, {
        params: { language }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('no longer active')) {
        // Rethrow session-specific errors with custom error type
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }

  static async submitResponse(
    profileId: string,
    sessionId: string,
    response: InterviewResponse
  ): Promise<InterviewResult> {
    try {
      const result = await api.post(
        `/api/v1/interviews/${profileId}/response`,
        response,
        {
          params: { session_id: sessionId }
        }
      );
      return result.data;
    } catch (error) {
      // Check for session-specific errors
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('no longer active')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }

  static async getNextQuestion(
    profileId: string,
    sessionId: string,
    language: string = 'en'
  ): Promise<string> {
    try {
      const response = await api.get(`/api/v1/interviews/${profileId}/question`, {
        params: { session_id: sessionId, language }
      });
      return response.data.text;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('no longer active')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }
}