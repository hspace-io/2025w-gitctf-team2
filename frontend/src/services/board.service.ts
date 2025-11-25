import api from './api';

export interface Board {
  _id: string;
  title: string;
  content: string;
  category: 'notice' | 'anonymous' | 'wargame-ctf';
  author: {
    _id?: string;
    username: string;
  };
  isAnonymous: boolean;
  images?: string[];
  views: number;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  author: {
    _id?: string;
    username: string;
  };
  content: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface CreateBoardData {
  title: string;
  content: string;
  category: 'notice' | 'anonymous' | 'wargame-ctf';
  isAnonymous?: boolean;
  images?: string[];
}

export const boardService = {
  async getBoards(category?: string, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/boards?${params.toString()}`);
    return response.data;
  },

  async getBoard(id: string) {
    const response = await api.get(`/boards/${id}`);
    return response.data.board;
  },

  async createBoard(data: CreateBoardData) {
    const response = await api.post('/boards', data);
    return response.data.board;
  },

  async updateBoard(id: string, data: Partial<CreateBoardData>) {
    const response = await api.put(`/boards/${id}`, data);
    return response.data.board;
  },

  async deleteBoard(id: string) {
    const response = await api.delete(`/boards/${id}`);
    return response.data;
  },

  async likeBoard(id: string) {
    const response = await api.post(`/boards/${id}/like`);
    return response.data;
  },

  async addComment(boardId: string, content: string, isAnonymous = false) {
    const response = await api.post(`/boards/${boardId}/comments`, {
      content,
      isAnonymous,
    });
    return response.data.comment;
  },

  async deleteComment(boardId: string, commentId: string) {
    const response = await api.delete(`/boards/${boardId}/comments/${commentId}`);
    return response.data;
  },
};

