import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  reply: string;
  timestamp: string;
}

export const chatbotService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await api.post('/chatbot/chat', { message });
    return response.data;
  },
};

