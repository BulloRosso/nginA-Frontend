// src/services/memories.ts
import { Memory, Category, Location, Person, Emotion } from '../types/memory';
import api from './api';
import { UUID } from '../types/common';

interface MemoryResponse {
  id: UUID;
  profile_id: UUID;
  session_id: UUID;
  category: Category;
  description: string;
  time_period: string;
  location?: Location;
  people: Person[];
  emotions: Emotion[];
  image_urls: string[];
  audio_url?: string;
  created_at: string;
  updated_at: string;
  sentiment_analysis?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    nostalgia: number;
    intensity: number;
  };
}

class MemoryService {
  /**
   * Get all memories for a profile
   */
  static async getMemories(profileId: UUID): Promise<Memory[]> {
    try {
      const response = await api.get<MemoryResponse[]>(`/api/v1/memories/${profileId}`);
      return response.data.map(memory => ({
        ...memory,
        timePeriod: new Date(memory.time_period),
        createdAt: new Date(memory.created_at),
        updatedAt: new Date(memory.updated_at)
      }));
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      throw new Error('Failed to fetch memories');
    }
  }

  /**
   * Create a new memory
   */
  static async createMemory(
    profileId: UUID, 
    sessionId: UUID, 
    memory: MemoryCreate
  ): Promise<Memory> {
    try {
      // Convert the memory data to the format expected by the API
      const memoryData = {
        profile_id: profileId,
        session_id: sessionId,
        category: memory.category,
        description: memory.description,
        time_period: memory.time_period,
        location: memory.location || {
          name: "Unknown",
          city: null,
          country: null,
          description: null
        },
        people: memory.people || [],
        emotions: memory.emotions || [],
        image_urls: memory.image_urls || [],
        audio_url: memory.audio_url || null
      };

      const response = await api.post<MemoryResponse>(
        '/api/v1/memories',
        memoryData,
        {
          params: {
            profile_id: profileId,
            session_id: sessionId
          }
        }
      );

      return {
        ...response.data,
        timePeriod: new Date(response.data.time_period),
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at)
      };
    } catch (error) {
      console.error('Failed to create memory:', error);
      throw new Error('Failed to create memory');
    }
  }

  /**
   * Upload media files (images or audio) for a memory
   */
  static async uploadMedia(formData: FormData): Promise<{ url: string }> {
    try {
      const response = await api.post<{ url: string }>(
        '/api/v1/memories/media',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to upload media:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(memoryId: UUID): Promise<void> {
    try {
      await api.delete(`/memories/${memoryId}`);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw new Error('Failed to delete memory');
    }
  }

  /**
   * Update an existing memory
   */
  static async updateMemory(
    memoryId: UUID,
    updates: Partial<MemoryCreate>
  ): Promise<Memory> {
    try {
      const response = await api.put<MemoryResponse>(
        `/api/v1/memories/${memoryId}`,
        updates
      );

      return {
        ...response.data,
        timePeriod: new Date(response.data.time_period),
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at)
      };
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw new Error('Failed to update memory');
    }
  }

  /**
   * Add media files to an existing memory
   */
  static async addMediaToMemory(
    memoryId: UUID,
    files: File[]
  ): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post<{ urls: string[] }>(
        `/api/v1/memories/${memoryId}/media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.urls;
    } catch (error) {
      console.error('Failed to add media to memory:', error);
      throw new Error('Failed to add media to memory');
    }
  }

  /**
   * Export memories to PDF
   */
  static async exportToPDF(profileId: UUID): Promise<string> {
    try {
      const response = await api.post<{ url: string }>(
        '/api/v1/memories/export-pdf',
        { profile_id: profileId }
      );
      return response.data.url;
    } catch (error) {
      console.error('Failed to export memories to PDF:', error);
      throw new Error('Failed to export memories to PDF');
    }
  }

  /**
   * Get memories by category
   */
  static async getMemoriesByCategory(
    profileId: UUID,
    category: Category
  ): Promise<Memory[]> {
    try {
      const memories = await this.getMemories(profileId);
      return memories.filter(memory => memory.category === category);
    } catch (error) {
      console.error('Failed to fetch memories by category:', error);
      throw new Error('Failed to fetch memories by category');
    }
  }

  /**
   * Get memories by date range
   */
  static async getMemoriesByDateRange(
    profileId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<Memory[]> {
    try {
      const memories = await this.getMemories(profileId);
      return memories.filter(memory => 
        memory.timePeriod >= startDate && memory.timePeriod <= endDate
      );
    } catch (error) {
      console.error('Failed to fetch memories by date range:', error);
      throw new Error('Failed to fetch memories by date range');
    }
  }
}

export default MemoryService;