// src/services/operations.ts
import api from './api';
import { Operation, OperationCreate, TeamStatus } from '../types/operation';
import { UUID } from '../types/common';

// Define the HumanFeedbackItem interface
export interface HumanFeedbackItem {
  id: UUID;
  created_at: string;
  run_id: UUID;
  status: string;
  email_settings: {
    subject: string;
    recipients: Array<{
      email: string;
      name: string;
    }>;
  };
  reason: string | null;
  callback_url: string | null;
  workflow_id: string | null;
}

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

  getAgentRunHistory: async (agentId: UUID): Promise<Operation[]> => {
    const response = await api.get(`/api/v1/operations/history/${agentId}`);
    return response.data;
  },

  // Method to get human feedback items for a specific run
  getHumanFeedbackItems: async (runId: UUID, status?: string): Promise<HumanFeedbackItem[]> => {
    let url = `/api/v1/operations/human-feedback?run_id=${runId}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Method to update human feedback status
  updateHumanFeedback: async (
    feedbackId: UUID, 
    status: 'approved' | 'rejected', 
    reason: string
  ): Promise<any> => {
    const response = await api.post(`/api/v1/operations/human-feedback/${feedbackId}/update`, {
      status,
      reason
    });
    return response.data;
  },

  // Method to start a run for a specific agent
  startRun: async (agentId: UUID, prompt: string, parameters: any): Promise<Operation> => {
    // Create the run object according to the expected backend API structure
    // Based on the backend code in operations.py
    const data: OperationCreate = {
      agent_id: agentId,
      prompt: prompt,
      status: 'pending',
      results: {
        inputParameters: parameters
      }
    };

    // If there are commChannels in the parameters, add them to email_settings
    if (parameters.commChannels && parameters.commChannels.length > 0) {
      // Convert commChannels to email_settings format expected by the backend
      const emailRecipients = [];

      // Process each communication channel
      for (const channel of parameters.commChannels) {
        if (channel.type === 'email' && channel.recipients) {
          // Add each recipient from this email channel
          for (const recipient of channel.recipients) {
            if (recipient.address) {
              emailRecipients.push({
                email: recipient.address,
                name: recipient.address.split('@')[0] // Use part before @ as name or empty string
              });
            }
          }
        }
      }

      // Only add email_settings if we found email recipients
      if (emailRecipients.length > 0) {
        // Add email_settings to the run data
        data.email_settings = {
          subject: `Agent Run: ${parameters['Accept-Language'] || 'en'}`,
          recipients: emailRecipients
        };
      }
    }

    // Send the request to the backend API
    return await OperationService.createOrUpdateOperation(data);
  }
};