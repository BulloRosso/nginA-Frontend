// src/services/memories.ts
import { Memory, Category, Location, Person, MemoryCreate , Emotion } from '../types/memory';
import api from './api';
import { UUID } from '../types/common';
import dayjs from 'dayjs';

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

const mapResponseToMemory = (data: any): Memory => {
  if (!data) {
    throw new Error('Cannot map null or undefined data to Memory');
  }

  return {
    id: data.id,
    profileId: data.profile_id,
    sessionId: data.session_id,
    category: data.category || Category.CHILDHOOD, // Provide default category
    description: data.description || '',
    timePeriod: new Date(data.time_period), // Fixed: data instead of memory
    caption: data.caption || '',
    original_description: data.original_description || '',
    imageUrls: data.image_urls || [],
    location: data.location || null,
    people: data.people || [],
    emotions: data.emotions || [],
    audioUrl: data.audio_url || null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    sentimentAnalysis: data.sentiment_analysis
  };
};

class MemoryService {

  /**
   * Get a single memory for partial refresh
   */
  static async getMemory(memoryId: string): Promise<Memory> {
    try {
      const response = await api.get<MemoryResponse>(`/api/v1/memories/${memoryId}`);

      if (!response.data || !response.data.id) {
        throw new Error('Invalid memory data received from API');
      }

      // Apply the same mapping logic used in getMemories
      const memory = {
        id: response.data.id,
        profileId: response.data.profile_id,
        sessionId: response.data.session_id,
        category: response.data.category || Category.CHILDHOOD,
        description: response.data.description || '',
        timePeriod: dayjs(response.data.time_period),  // Use dayjs for consistency
        caption: response.data.caption || '',
        original_description: response.data.original_description || '',
        imageUrls: response.data.image_urls || [],
        location: response.data.location || null,
        people: response.data.people || [],
        emotions: response.data.emotions || [],
        audioUrl: response.data.audio_url || null,
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
        sentimentAnalysis: response.data.sentiment_analysis
      };

      console.log('Mapped memory:', memory);
      return memory;
    } catch (error) {
      console.error('Failed to fetch memory:', error);
      throw error;
    }
  }
  
  /**
   * Get all memories for a profile
   */
  static async getMemories(profileId: UUID): Promise<Memory[]> {
    try {
      const response = await api.get<MemoryResponse[]>(`/api/v1/memories/${profileId}`);
      console.log('Raw API response:', response.data);

      // Map the response data to Memory objects with error handling
      return response.data.map(memoryData => {
        try {
          return mapResponseToMemory(memoryData);
        } catch (error) {
          console.error('Error mapping memory:', memoryData, error);
          // Return a default memory object or filter out invalid ones
          return null;
        }
      }).filter((memory): memory is Memory => memory !== null); // Remove any null entries
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      throw new Error('Failed to fetch memories');
    }
  }

  static async deleteImage(memoryId: UUID, filename: string): Promise<void> {
    try {

      console.log('Calling deleteImage API:', {
          memoryId,
          filename
      });
      
      // Delete file from Supabase storage
      const response = await api.delete(`/api/v1/memories/${memoryId}/media/${filename}`);
      console.log('Delete API response:', response.data);
      if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw new Error('Failed to delete image');
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
        time_period: memory.timePeriod,
        location: memory.location || {
          name: "Unknown",
          city: null,
          country: null,
          description: null
        },
        people: memory.people || [],
        emotions: memory.emotions || [],
        image_urls: memory.imageUrls || [],
        audio_url: memory.audioUrl || null
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
  static async uploadMedia(formData: FormData, memoryId: string): Promise<string[]> {
    try {
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
      console.error('Failed to upload media:', error);
      throw new Error('Failed to upload media');
    }
  }

  /**
   * Delete a memory
   */
  static async deleteMemory(memoryId: UUID): Promise<void> {
    try {
      await api.delete(`/api/v1/memories/${memoryId}`);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      throw new Error('Failed to delete memory');
    }
  }

  /**
   * Update an existing memory
   */
  static async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<Memory> {
    try {
      console.log('Starting memory update with:', {
        memoryId,
        updates
      });

      // Convert frontend camelCase to backend snake_case
      const apiUpdates = {
        ...updates,
        time_period: updates.timePeriod || updates.time_period,  // Try both formats
      };

      console.log('Converted updates for API:', apiUpdates);

      const response = await api.put<MemoryResponse>(
        `/api/v1/memories/${memoryId}`,
        apiUpdates
      );

      console.log('Raw API response:', response.data);

      // Map response back to frontend format
      return {
        ...response.data,
        timePeriod: new Date(response.data.time_period),
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at)
      };
    } catch (error) {
      console.error('Failed to update memory:', error);
      throw error;
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