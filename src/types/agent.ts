// src/types/agent.ts
export interface I18nContent {
  de: string;
  en: string;
}

export interface Credential {
  key: string;
  value: string;
}

export interface Text {
  key: string;
  value: string;
}

export interface File {
  key: string;
  url: string;
  mimeType: string;
}

export interface IOConfig {
  credentials?: Credential[];
  texts?: Text[];
  files?: File[];
}

export interface Agent {
  id: string;
  created_at: string;
  title: I18nContent;
  description: I18nContent;
  input?: IOConfig;
  output?: IOConfig;
  credits_per_run: number;
  workflow_id?: string;
  stars: number;
  image_url?: string;
}

export interface AgentCreateDto {
  title: I18nContent;
  description: I18nContent;
  input?: IOConfig;
  output?: IOConfig;
  credits_per_run?: number;
  workflow_id?: string;
  stars?: number;
  image_url?: string;
}