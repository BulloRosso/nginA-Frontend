// src/types/scratchpad.ts
export interface ScratchpadFileMetadata {
  user_id: string;
  run_id: string;
  url: string;
  created_at: string;
}

export interface ScratchpadFile {
  id: string;
  user_id: string;
  run_id: string;
  agent_id: string;
  filename: string;
  path: string;
  metadata: ScratchpadFileMetadata;
  created_at: string;
}

export interface ScratchpadFiles {
  files: Record<string, ScratchpadFile[]>;
}

export interface ScratchpadFileResponse {
  metadata: ScratchpadFileMetadata;
  url: string;
}