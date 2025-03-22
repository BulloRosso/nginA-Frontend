// src/services/contexts.ts
import api from './api';
import { UUID } from '../types/common';
import { ChainSimulationRequest, ChainSimulationResponse  } from '../types/context';

interface AgentInputRequest {
  agent_id: UUID;
  run_id: UUID | null;
}

// Response type for getAgentInputFromEnv
interface AgentInputResponse {
  // Will contain agent input parameters as a dynamic object
  [key: string]: any;
}

// Type for getAgentInputTransformerFromEnv response (string containing JavaScript code)
type TransformerFunction = string;

export const ContextService = {
  /**
   * Extracts agent input from runtime environment
   * @param agentId - The ID of the agent
   * @param runId - The run ID (can be null for testing)
   * @returns Extracted input parameters as JSON if successful, error message if not
   */
  getAgentInputFromEnv: async (agentId: UUID, runId: UUID | null = null): Promise<AgentInputResponse> => {
    try {
      const request: AgentInputRequest = {
        agent_id: agentId,
        run_id: runId,
      };

      // TODO: Allow access via JWT in the API endpoint
      const response = await api.post('/api/v1/context/resolvers/get-agent-input-from-env', request, {
        headers: {
          'x-ngina-key': 'abc-def-gha-12346'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching agent input from environment:', error);

      // Return error response if available, otherwise throw
      if (error.response && error.response.data) {
        return error.response.data;
      }

      throw error;
    }
  },

  /**
   * Generates a JavaScript transformer function for agent input
   * @param agentId - The ID of the agent
   * @param runId - The run ID (can be null for testing)
   * @returns JavaScript transformer function as a string
   */
  getAgentInputTransformerFromEnv: async (agentId: UUID, runId: UUID | null = null): Promise<TransformerFunction> => {
    try {
      const request: AgentInputRequest = {
        agent_id: agentId,
        run_id: runId,
      };

      // TODO: Allow access via JWT in the API endpoint
      const response = await api.post('/api/v1/context/resolvers/get-agent-input-transformer-from-env', request, {
        headers: {
          'x-ngina-key': 'abc-def-gha-12346'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error generating agent input transformer:', error);

      // Return error response if available, otherwise throw
      if (error.response && error.response.data) {
        return error.response.data;
      }

      throw error;
    }
  },

  /**
   * Simulates a chain environment for testing
   * @param agentId - The ID of the agent to simulate for
   * @param prompt - The initial prompt text
   * @param chainAgentIds - IDs of previous agents in the chain
   * @returns Simulated chain environment data
   */
  simulateChainEnvironment: async (agentId: string, prompt: string, chainAgentIds: string[]): Promise<ChainSimulationResponse> => {
    try {
      const request: ChainSimulationRequest = {
        prompt,
        agents: chainAgentIds
      };

      const response = await api.post(`/api/v1/context/simulation/chain/env/${agentId}`, request);
      return response.data;
    } catch (error: any) {
      console.error('Error simulating chain environment:', error);

      // Return error response if available, otherwise throw
      if (error.response && error.response.data) {
        return error.response.data;
      }

      throw error;
    }
  }
};

export default ContextService;