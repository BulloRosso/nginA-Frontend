// src/services/chat.ts
import api from './api';

export const ChatService = {
  sendMessage: async (message: string) => {
    try {
      const profileId = localStorage.getItem('profileId');
      if (!profileId) {
        throw new Error('No profile selected');
      }

      const response = await api.post('/api/v1/chat', {
        profile_id: profileId,
        query_text: message
      });

      return response.data;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  }
};

export default ChatService;