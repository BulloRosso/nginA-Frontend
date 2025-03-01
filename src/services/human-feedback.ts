// src/services/human-feedback.ts
import api from './api';

export interface HumanFeedbackData {
  id: string;
  created_at: string;
  run_id: string;
  status: string;
  email_settings?: {
    subject: string;
    recipients: Array<{
      name: string;
      email: string;
    }>;
    flagAsImportant: boolean;
  };
  workflow_id?: string;
  reason?: string;
  callback_url?: string;
}

export interface FeedbackSubmission {
  status: 'approved' | 'rejected';
  reason?: string;  // Changed from 'feedback' to 'reason'
}

export const HumanFeedbackService = {
  /**
   * Get human feedback request by ID
   */
  getHumanFeedback: async (id: string): Promise<HumanFeedbackData> => {
    const response = await api.get(`/api/v1/operations/human-feedback/${id}`);
    return response.data;
  },

  /**
   * Update human feedback status (approve/reject)
   */
  updateHumanFeedback: async (id: string, data: FeedbackSubmission): Promise<any> => {
    // The API expects 'reason', which is already in our data object
    console.log('Sending update with data:', data);
    const response = await api.post(`/api/v1/operations/human-feedback/${id}/update`, data);
    return response.data;
  },

  /**
   * Request human feedback for a workflow
   */
  requestHumanFeedback: async (runId: string, agentId: string, data: {
    workflow_id: string;
    callback_url: string;
    reason?: string;
    email_settings?: any;
  }): Promise<HumanFeedbackData> => {
    const response = await api.post(
      `/api/v1/operations/workflow/${runId}/request-human-feedback/${agentId}`, 
      data
    );
    return response.data;
  }
};