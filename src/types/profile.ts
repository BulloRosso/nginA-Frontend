import { UUID } from './common';

export interface Profile {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  placeOfBirth: string;
  gender: string;
  children: string[];
  spokenLanguages: string[];
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  type: string;
  title: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  color: string;
  requiredCount: number;
  unlockedAt?: Date;
  progress?: number;
  completed?: boolean;
}