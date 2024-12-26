// src/services/supportbot.ts
import api from './api';

export interface SupportBotResponse {
  answer: string;
}

export interface BugReportData {
  severity: 'Feature Request' | 'Bug' | 'Severe Bug';
  subject: string;
  message: string;
  userEmail: string;
}

export const SupportBotService = {
  
  sendMessage: async (message: string, language: string): Promise<SupportBotResponse> => {
    try {
      const response = await api.post('/api/v1/supportbot', {
        message,
        language
      });

      return response.data;
    } catch (error) {
      console.error('Error in supportbot service:', error);
      throw error;
    }
  },

  submitBugReport: async (bugReport: BugReportData): Promise<void> => {
    try {
      await api.post('/api/v1/supportbot/bugreport', bugReport);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      throw error;
    }
  }
  
};

export default SupportBotService;