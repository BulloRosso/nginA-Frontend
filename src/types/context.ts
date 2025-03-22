// Request model for chain simulation
export interface ChainSimulationRequest {
  prompt: string;
  agents: string[];
}

// Response model for chain simulation
export interface ChainSimulationResponse {
  prompt: string;
  inputParameters: Record<string, any>;
  flow: Array<{
    agentId: string;
    resultJson: Record<string, any>;
    executionId: string;
  }>;
}