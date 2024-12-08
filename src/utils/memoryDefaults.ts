// src/utils/memoryDefaults.ts
import { Memory, Category } from '../types/memory';
import { Profile } from '../types/profile';

export const createDefaultMemories = (profile: Profile): Memory[] => {
  const today = new Date();
  const birthDate = new Date(profile.date_of_birth);

  const birthMemory: Memory = {
    id: '00000000-0000-0000-0000-000000000001',
    profile_id: profile.id,
    session_id: '00000000-0000-0000-0000-000000000001',
    category: Category.CHILDHOOD,
    description: `${profile.first_name} was born in ${profile.place_of_birth}`,
    time_period: birthDate,
    location: {
      name: profile.place_of_birth,
      city: null,
      country: null,
      description: null
    },
    people: [],
    emotions: [],
    image_urls: [],
    audio_url: null,
    created_at: today,
    updated_at: today,
    sentiment_analysis: null
  };

  const todayMemory: Memory = {
    id: '00000000-0000-0000-0000-000000000002',
    profile_id: profile.id,
    session_id: '00000000-0000-0000-0000-000000000001',
    category: Category.CHILDHOOD,
    description: `Today is ${today.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    time_period: today,
    location: null,
    people: [],
    emotions: [],
    image_urls: [],
    audio_url: null,
    created_at: today,
    updated_at: today,
    sentiment_analysis: null
  };

  return [todayMemory, birthMemory];
};