// src/types/agent.ts
export interface I18nContent {
  de: string;
  en: string;
}

export interface SchemaField {
  type: string;
  description?: string;
}

export interface Agent {
  id: string;
  created_at: string;
  title: I18nContent;
  description: I18nContent;
  input?: Record<string, SchemaField>;
  output?: Record<string, SchemaField>;
  credits_per_run: number;
  workflow_id?: string;
  stars: number;
  image_url?: string;
  max_execution_time_secs?: number;
  agent_endpoint?: string;
}

export interface AgentCreateDto {
  title: I18nContent;
  description: I18nContent;
  input?: Record<string, SchemaField>;
  output?: Record<string, SchemaField>;
  credits_per_run?: number;
  workflow_id?: string;
  stars?: number;
  image_url?: string;
  max_execution_time_secs?: number;
  agent_endpoint?: string;
}