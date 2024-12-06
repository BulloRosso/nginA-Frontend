// types/memory.ts
import { UUID } from './common';

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
  id: UUID;
  profileId: UUID;
  sessionId: UUID;
  category: Category;
  description: string;
  timePeriod: Date;
  location?: Location;
  people: Person[];
  emotions: Emotion[];
  imageUrls: string[];
  audioUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  sentimentAnalysis?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    nostalgia: number;
    intensity: number;
  };
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