// src/utils/memoryDefaults.ts
import { Memory, Category } from '../types/memory';
import { Profile } from '../types/profile';
import dayjs from 'dayjs';

export const createDefaultMemories = (profile: Profile): Memory[] => {
  const today = new Date();
  const birthDate = new Date(profile.dateOfBirth);

  const birthMemory: Memory = {
    id: '00000000-0000-0000-0000-000000000001',
    profileId: profile.id,
    sessionId: '00000000-0000-0000-0000-000000000001',
    category: Category.CHILDHOOD,
    caption: '',
    original_description: '',
    description: `${profile.name} was born,`,
    timePeriod: dayjs(birthDate),
    location: {
      name: '',
      city: null,
      country: null,
      description: null
    },
    people: [],
    emotions: [],
    imageUrls: [],
    audioUrl: null,
    createdAt: today,
    updatedAt: today,
    sentimentAnalysis: null
  };

  const todayMemory: Memory = {
    id: '00000000-0000-0000-0000-000000000002',
    profileId: profile.id,
    sessionId: '00000000-0000-0000-0000-000000000001',
    category: Category.CHILDHOOD,
    caption: '',
    original_description: '',
    description: `Today is ${today.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    timePeriod: dayjs(today),
    location: null,
    people: [],
    emotions: [],
    imageUrls: [],
    audioUrl: null,
    createdAt: today,
    updatedAt: today,
    sentimentAnalysis: null
  };

  return [todayMemory, birthMemory];
};