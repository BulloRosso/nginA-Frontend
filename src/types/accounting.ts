// src/types/accounting.ts
import { UUID } from './common';

export type IntervalType = 'day' | 'month' | 'year';

export interface AgentUsage {
  agent_id: UUID;
  total_credits: number;
  run_count: number;
  avg_credits_per_run: number;
}

export interface CreditReport {
  user_id: UUID;
  interval: IntervalType;
  start_date: string;
  end_date: string;
  total_credits: number;
  agents: AgentUsage[];
}

export interface BalanceResponse {
  user_id: UUID;
  balance: number;
  timestamp: string;
}

export interface TransactionBase {
  credits: number;
  description?: string;
}

export interface ChargeRequest extends TransactionBase {
  agent_id: UUID;
  run_id?: UUID;
}

export interface RefillRequest extends TransactionBase {
  // No additional fields specific to refill
}

export type TransactionType = 'run' | 'refill' | 'other';

export interface Transaction {
  id: UUID;
  timestamp: string;
  user_id: UUID;
  agent_id?: UUID;
  run_id?: UUID;
  type: TransactionType;
  credits: number;
  balance: number;
  description?: string;
}