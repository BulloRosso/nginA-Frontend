// src/types/operation.ts
import { UUID } from "./common";

export interface AgentRun {
  run_id: UUID;
  startedAt: string;
  finishedAt: string | null;
  duration: number;
  workflowId: string | null;
  status: string | null;
  results: any | null;
}

export interface AgentStatus {
  title: string;
  lastRun: AgentRun | null;
}

export interface TeamStatus {
  agents: AgentStatus[];
}

export interface Operation {
  id: number;
  created_at: string;
  agent_id: UUID | null;
  results: any | null;
  status: string | null;
  prompt: string | null;
  sum_credits: number | null;
  workflow_id: string | null;
  execution_id: string | null;
  finished_at: string | null;
}

export interface OperationCreate {
  agent_id?: UUID;
  results?: any;
  status?: string;
  prompt?: string;
  sum_credits?: number;
  workflow_id?: string;
  finished_at?: string;
}