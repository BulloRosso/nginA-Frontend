// src/services/prompts.ts
import api from './api';
import { Prompt, PromptCreateDto, PromptCompare } from '../types/prompt';

export class PromptService {
  static async getPrompts(limit: number = 100, offset: number = 0): Promise<Prompt[]> {
    const response = await api.get(`/api/v1/prompts?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  static async getPrompt(id: string): Promise<Prompt | null> {
    try {
      const response = await api.get(`/api/v1/prompts/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getPromptByName(name: string): Promise<Prompt | null> {
    try {
      const response = await api.get(`/api/v1/prompts/${name}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getPromptByNameAndVersion(name: string, version: number): Promise<Prompt | null> {
    try {
      const response = await api.get(`/api/v1/prompts/${name}/${version}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async createPrompt(promptData: PromptCreateDto): Promise<Prompt> {
    const response = await api.post('/api/v1/prompts', promptData);
    return response.data;
  }

  static async updatePrompt(id: string, promptData: Partial<PromptCreateDto>): Promise<Prompt | null> {
    try {
      const response = await api.put(`/api/v1/prompts/${id}`, promptData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async deletePrompt(id: string): Promise<boolean> {
    try {
      await api.delete(`/api/v1/prompts/${id}`);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  static async replacePrompt(name: string, version: number, promptText: string): Promise<Prompt> {
    const response = await api.post(`/api/v1/prompts/replace/${name}/${version}`, {
      prompt_text: promptText
    });
    return response.data;
  }

  static async deletePromptGroup(name: string): Promise<boolean> {
    try {
      await api.delete(`/api/v1/prompts/purge/${name}`);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  static async comparePrompts(name: string, version1: number, version2: number): Promise<PromptCompare> {
    try {
      const response = await api.get(`/api/v1/prompts/compare/${name}/${version1}/${version2}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Could not find prompts to compare: ${name} (versions ${version1} and ${version2})`);
      }
      throw error;
    }
  }

  static async activatePrompt(name: string, version: number): Promise<Prompt> {
    const response = await api.post(`/api/v1/prompts/activate/${name}/${version}`);
    return response.data;
  }
}

export default PromptService;