// src/types/accounting.ts
import { UUID } from './common';

export type IntervalType = 'day' | 'month' | 'year';

export interface AgentUsage {
  agent_id: UUID;
  total_credits: number;
  run_count: number;
  avg_credits_per_run: number;
  agent_title_en?: string;
}

export interface CreditReport {
  user_id: UUID;
  interval: IntervalType;
  start_date: string;
  end_date: string;
  total_credits: number;
  credits_remaining: number;
  agents: AgentUsage[];
}

export interface BalanceResponse {
  user_id: UUID;
  balance: number;
  timestamp: string;
}

export interface TransactionType {
  id: UUID;
  timestamp: string;
  user_id: UUID;
  agent_id?: UUID;
  run_id?: UUID;
  type: 'run' | 'refill' | 'other';
  credits: number;
  balance: number;
  description?: string;
}