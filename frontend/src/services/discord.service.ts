import api from './api';

export interface DiscordMessage {
  _id: string;
  messageId: string;
  channelId: string;
  channelName: string;
  threadName?: string;
  content: string;
  author: {
    username: string;
    avatar?: string;
  };
  embeds?: any[];
  attachments?: any[];
  timestamp: string;
  type: 'announcement' | 'mission' | 'general';
  createdAt: string;
  updatedAt: string;
}

export interface DiscordStatus {
  connected: boolean;
  channels: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export const discordService = {
  async getStatus() {
    const response = await api.get<DiscordStatus>('/discord/status');
    return response.data;
  },

  async getAnnouncements(limit: number = 20) {
    const response = await api.get<{ messages: DiscordMessage[]; total: number }>(
      `/discord/announcements?limit=${limit}`
    );
    return response.data;
  },

  async getMissions(limit: number = 20) {
    const response = await api.get<{ messages: DiscordMessage[]; total: number }>(
      `/discord/missions?limit=${limit}`
    );
    return response.data;
  },

  async syncMessages() {
    const response = await api.post('/discord/sync');
    return response.data;
  },
};

