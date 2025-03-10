// src/types/prompt.ts

export interface Prompt {
  id: string;
  created_at: string;
  name: string;
  prompt_text: string;
  version: number;
  is_active: boolean;
}

export interface PromptCreateDto {
  name: string;
  prompt_text: string;
  version?: number;
  is_active?: boolean;
}

export interface PromptCompare {
  prompts: Prompt[];
}

export interface PromptGrouped {
  name: string;
  prompts: Prompt[];
  activePrompt?: Prompt;
}