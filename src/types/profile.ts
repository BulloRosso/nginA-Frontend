// types/profile.ts
import { UUID } from './common';

export interface Profile {
  id: UUID;
  first_name: string;  // Changed from firstName to match backend
  last_name: string;   // Changed from lastName to match backend
  date_of_birth: string;
  place_of_birth: string;
  gender: string;
  children: string[];
  spoken_languages: string[];
  profile_image_url?: string;  // Changed from profileImageUrl to match backend
  created_at: string;
  updated_at: string;
  subscribed_at: string | null;
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