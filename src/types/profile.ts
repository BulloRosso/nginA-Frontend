// types/profile.ts
import { UUID } from './common';
import { Dayjs } from 'dayjs';

export interface ProfileMetadata {
  backstory?: string;
  narrator_style?: 'neutral' | 'professional' | 'romantic' | 'optimistic';
  narrator_perspective?: 'ego' | 'third';
  narrator_verbosity?: 'verbose' | 'normal' | 'brief';
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  dateOfBirth: Dayjs;
  backstory?: string;
  metadata?: ProfileMetadata;
}

export interface ProfileMetadata {
  sessionCount: number;
  // Add other metadata fields
}

export interface ProfileData extends Omit<Profile, 'dateOfBirth'> {
  dateOfBirth: Date;
}
// Helper function to calculate age
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

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