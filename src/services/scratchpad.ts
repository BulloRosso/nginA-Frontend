// src/services/scratchpad.ts
import api from './api';
import { ScratchpadFiles, ScratchpadFileResponse, ScratchpadFile } from '../types/scratchpad';

// Define a special agent ID for input files
const INPUT_AGENT_ID = '00000000-0000-0000-0000-000000000001'; // Use the UUID format from backend

export const ScratchpadService = {
  /**
   * Get all files for a specific run_id, grouped by agent_id
   */
  getScratchpadFiles: async (runId: string): Promise<ScratchpadFiles> => {
    const response = await api.get(`/api/v1/scratchpads/${runId}`);
    return response.data;
  },

  /**
   * Get input files specifically for a run
   */
  getInputFiles: async (runId: string): Promise<ScratchpadFile[]> => {
    try {
      const response = await api.get(`/api/v1/scratchpads/${runId}/input`);
      console.log('Raw input files response:', response.data);

      // Handle different possible response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.files)) {
        return response.data.files;
      } else if (response.data && typeof response.data === 'object') {
        // Log what we've received to help debug
        console.log('Input files response structure:', Object.keys(response.data));

        // Try to find any array in the response that might contain our files
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`Found array in response.data.${key} with ${response.data[key].length} items`);
            return response.data[key];
          }
        }
      }

      // If we can't determine the structure, return an empty array
      console.warn('Could not determine input files structure, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching input files:', error);
      return [];
    }
  },

  /**
   * Upload a file to the input folder for a run
   * @param runId The run ID to upload for
   * @param file The file to upload
   * @param onProgress Optional callback to track upload progress
   */
  uploadInputFile: async (
    runId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<ScratchpadFile> => {
    // Get the current user ID from localStorage
    let userId: string;
    const userString = localStorage.getItem('user');

    if (userString) {
      try {
        const user = JSON.parse(userString);
        userId = user.id;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        throw new Error('Invalid user data. Please log in again.');
      }
    } else {
      throw new Error('User not found. Please log in again.');
    }

    // Get JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }

    // Use the original endpoint that we know works
    const endpoint = `/api/v1/scratchpads/${userId}/${runId}/${INPUT_AGENT_ID}`;

    // Log the upload attempt
    console.log(`Uploading file with name: ${file.name}, size: ${file.size}, type: ${file.type}`);
    console.log(`Upload endpoint: ${endpoint}`);

    // Create a form element
    const form = new FormData();
    form.append('file', file, file.name);

    // Use XMLHttpRequest with direct control
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress handler
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      // Success handler
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Upload response:', response);

            if (response.files && Array.isArray(response.files) && response.files.length > 0) {
              resolve(response.files[0]);
            } else {
              console.error('Upload successful but no file data in response');
              reject(new Error('Upload successful but server did not return file data'));
            }
          } catch (e) {
            console.error('Failed to parse response:', e);
            reject(new Error('Invalid response format'));
          }
        } else {
          console.error('Upload failed with status:', xhr.status);
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Error details:', errorResponse);
            reject(new Error(errorResponse.detail || `HTTP Error: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        }
      };

      // Error handler
      xhr.onerror = function() {
        console.error('Network error during upload');
        reject(new Error('Network error'));
      };

      // Open the request - use original endpoint for compatibility
      xhr.open('POST', `${api.defaults.baseURL}${endpoint}`);

      // Set headers
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('X-Debug-Info', 'ScratchpadService.uploadInputFile');
      // Critically important: DO NOT set Content-Type header manually

      // Include credentials (cookies)
      xhr.withCredentials = true;

      // Log what we're about to send
      console.log('Sending form data with file:', file.name);

      // Send the request
      xhr.send(form);
    });
  },

  /**
   * Get file metadata and URL by path
   */
  getFileByPath: async (runId: string, path: string): Promise<ScratchpadFileResponse> => {
    const response = await api.get(`/api/v1/scratchpads/${runId}/${path}`);
    return response.data;
  },

  /**
   * Delete all files for a specific run_id
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