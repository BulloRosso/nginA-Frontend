// types/memory.ts
import { UUID } from './common';
import { Category } from './enums';
import { Dayjs } from 'dayjs';

export enum Category {
  CHILDHOOD = 'childhood',
  CAREER = 'career',
  TRAVEL = 'travel',
  RELATIONSHIPS = 'relationships',
  HOBBIES = 'hobbies',
  PETS = 'pets'
}

export interface Person {
  name: string;
  relation: string;
  ageAtTime?: number;
}

export interface Location {
  name: string;
  city?: string;
  country?: string;
  description?: string;
}

export interface Emotion {
  type: string;
  intensity: number;
  description?: string;
}

export interface Memory {
  id: string;
  profileId: string;
  sessionId: string;
  category: Category;
  description: string;
  timePeriod: Date;
  caption: string;
  original_description: string;
  imageUrls: string[];
  location?: {
    name: string;
    city: string | null;
    country: string | null;
    description: string | null;
  };
  people?: string[];
  emotions?: string[];
  audioUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentimentAnalysis?: {
    sentiment: string;
    score: number;
  } | null;
}

export interface MemoryCreate {
  profileId: string;
  sessionId: string;
  category: Category;
  description: string;
  timePeriod: Date;
  location?: Memory['location'];
  people?: string[];
  emotions?: string[];
  imageUrls?: string[];
  audioUrl?: string | null;
}

export interface InterviewResponse {
  text: string;
  language: string;
  audioUrl?: string;
  emotionsDetected?: Emotion[];
}

export interface InterviewQuestion {
  text: string;
  context?: string;
  suggestedTopics: string[];
  requiresMedia: boolean;
}