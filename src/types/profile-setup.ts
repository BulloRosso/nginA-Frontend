// src/types/profile-setup.ts
export interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  placeOfBirth: string;
  gender: string;
  children: string[];
  spokenLanguages: string[];
  profileImage: File | null;
  imageUrl: string | null;
  backstory: string;
  narratorStyle?: string;  // Add these for memory style
  narratorPerspective?: string;
  narratorVerbosity?: string;
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender?: string;
  profileImage?: string;
  backstory?: string;
}

export interface SetupStepProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
  errors: ValidationErrors;
  setErrors: (errors: ValidationErrors) => void;
}