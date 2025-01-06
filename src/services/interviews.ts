// src/services/interviews.ts
import api from './api';

export interface InterviewResponse {
  text: string;
  user_id: string;
  language: string;
  memory_id: string | null;
  session_id: string | null;
}

export interface InterviewSession {
  id: string;
  profile_id: string;
  started_at: string;
  completed_at?: string;
  status: 'active' | 'completed';
  last_question?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewResult {
  follow_up: string;
  is_memory: boolean;
  memory_id?: string;
  memory_is_new: boolean;
}

export class InterviewService {
  /**
   * Start a new interview session or get existing active session
   */
  static async startInterview(profileId: string, language: string = 'en'): Promise<{
    session_id: string;
    initial_question: string;
    started_at: string;
  }> {
    try {
      const response = await api.post(`/api/v1/interviews/${profileId}/start`, null, {
        params: { language }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('no longer active')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * Get the next question for the interview
   */
  static async getNextQuestion(sessionId: string, language: string = 'en'): Promise<string> {
    try {
      const response = await api.post(`/api/v1/interviews/${sessionId}/next_question`, null, {
        params: { language }
      });
      return response.data.text;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('expired')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * Submit a response to the current question
   */
  static async submitResponse(
    sessionId: string,
    response: InterviewResponse
  ): Promise<InterviewResult> {
    try {
      const result = await api.post(
        `/api/v1/interviews/${sessionId}/response`,
        response
      );
      return result.data;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('expired')) {
        throw new Error('SESSION_EXPIRED');
      }
      throw error;
    }
  }

  /**
   * End the current interview session
   */
  static async endSession(sessionId: string): Promise<void> {
    try {
      await api.post(`/api/v1/interviews/${sessionId}/end`);
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Get all interview sessions for a profile
   */
  static async getInterviewSessions(profileId: string): Promise<InterviewSession[]> {
    try {
      const response = await api.get(`/api/v1/interviews/${profileId}/sessions`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch interview sessions:', error);
      throw error;
    }
  }
}