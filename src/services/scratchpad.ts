// src/services/scratchpad.ts
import api from './api';
import { ScratchpadFiles, ScratchpadFileResponse } from '../types/scratchpad';

export const ScratchpadService = {
  /**
   * Get all files for a specific run_id, grouped by agent_id
   * Uses JWT authentication via the api interceptor
   */
  getScratchpadFiles: async (runId: string): Promise<ScratchpadFiles> => {
    const response = await api.get(`/api/v1/scratchpads/${runId}`);
    return response.data;
  },

  /**
   * Get file metadata and URL by path
   * Uses JWT authentication via the api interceptor
   */
  getFileByPath: async (runId: string, path: string): Promise<ScratchpadFileResponse> => {
    const response = await api.get(`/api/v1/scratchpads/${runId}/${path}`);
    return response.data;
  },

  /**
   * Delete all files for a specific run_id
   * Uses JWT authentication via the api interceptor
   */
  deleteScratchpad: async (runId: string): Promise<any> => {
    const response = await api.delete(`/api/v1/scratchpads/${runId}`);
    return response.data;
  },

  /**
   * Fetch file content as text
   */
  fetchFileContent: async (url: string): Promise<string> => {
    const response = await fetch(url);
    return await response.text();
  }
};