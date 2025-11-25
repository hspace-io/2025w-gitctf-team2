import api from './api';

export interface Recruit {
  _id: string;
  title: string;
  content: string;
  category: 'ctf' | 'project' | 'study';
  author: {
    _id: string;
    username: string;
  };
  status: 'recruiting' | 'closed';
  maxMembers: number;
  currentMembers: number;
  members: TeamMember[];
  pendingMembers: TeamMember[];
  tags: string[];
  images?: string[];
  deadline?: string;
  views: number;
  likes: string[];
  comments: RecruitComment[];
  teamChat?: TeamChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  username: string;
}

export interface TeamChatMessage {
  _id: string;
  author: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

export interface RecruitComment {
  _id: string;
  author: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

export interface CreateRecruitData {
  title: string;
  content: string;
  category: 'ctf' | 'project' | 'study';
  maxMembers: number;
  tags?: string[];
  images?: string[];
  deadline?: string;
}

export const recruitService = {
  async getRecruits(category?: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/recruits?${params.toString()}`);
    return response.data;
  },

  async getRecruit(id: string) {
    const response = await api.get(`/recruits/${id}`);
    return response.data.recruit;
  },

  async createRecruit(data: CreateRecruitData) {
    const response = await api.post('/recruits', data);
    return response.data.recruit;
  },

  async updateRecruit(id: string, data: Partial<CreateRecruitData & { status: string; currentMembers: number }>) {
    const response = await api.put(`/recruits/${id}`, data);
    return response.data.recruit;
  },

  async deleteRecruit(id: string) {
    const response = await api.delete(`/recruits/${id}`);
    return response.data;
  },

  async likeRecruit(id: string) {
    const response = await api.post(`/recruits/${id}/like`);
    return response.data;
  },

  async addComment(recruitId: string, content: string) {
    const response = await api.post(`/recruits/${recruitId}/comments`, {
      content,
    });
    return response.data.comment;
  },

  async deleteComment(recruitId: string, commentId: string) {
    const response = await api.delete(`/recruits/${recruitId}/comments/${commentId}`);
    return response.data;
  },

  async joinTeam(recruitId: string) {
    const response = await api.post(`/recruits/${recruitId}/join`);
    return response.data;
  },

  async cancelJoin(recruitId: string) {
    const response = await api.delete(`/recruits/${recruitId}/join`);
    return response.data;
  },

  async approveMember(recruitId: string, userId: string, approve: boolean) {
    const response = await api.post(`/recruits/${recruitId}/approve/${userId}`, {
      approve,
    });
    return response.data;
  },

  async removeMember(recruitId: string, userId: string) {
    const response = await api.delete(`/recruits/${recruitId}/members/${userId}`);
    return response.data;
  },

  async getTeamChat(recruitId: string) {
    const response = await api.get(`/recruits/${recruitId}/chat`);
    return response.data;
  },

  async sendChatMessage(recruitId: string, content: string) {
    const response = await api.post(`/recruits/${recruitId}/chat`, {
      content,
    });
    return response.data.chatMessage;
  },

  async deleteChatMessage(recruitId: string, messageId: string) {
    const response = await api.delete(`/recruits/${recruitId}/chat/${messageId}`);
    return response.data;
  },

  async getMyChatRooms() {
    const response = await api.get('/recruits/my-chats');
    return response.data;
  },
};

export interface ChatRoom {
  _id: string;
  title: string;
  category: 'ctf' | 'project' | 'study';
  status: 'recruiting' | 'closed';
  author: {
    _id: string;
    username: string;
  };
  members: TeamMember[];
  lastMessage: {
    _id: string;
    content: string;
    createdAt: string;
    author: {
      _id: string;
      username: string;
    };
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

